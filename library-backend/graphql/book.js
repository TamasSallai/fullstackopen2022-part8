const { PubSub } = require('graphql-subscriptions')
const { GraphQLError } = require('graphql')
const { gql } = require('graphql-tag')
const Book = require('../models/book')
const Author = require('../models/author')

const pubsub = new PubSub()

const typeDefs = gql`
  enum Genre {
    agile
    classic
    crime
    design
    refactoring
    revolution
    patterns
  }

  type Book {
    id: ID!
    title: String!
    author: Author!
    published: Int!
    genres: [Genre!]!
  }

  extend type Query {
    bookCount: Int!
    allBooks(author: String, genre: String): [Book!]!
  }

  extend type Mutation {
    addBook(
      title: String!
      author: String!
      published: Int!
      genres: [Genre!]!
    ): Book
  }

  type Subscription {
    bookAdded: Book!
  }
`

const resolvers = {
  Query: {
    bookCount: async () => Book.countDocuments(),
    allBooks: async (root, args) => {
      const filter = {}

      if (args.author) {
        const author = await Author.findOne({ name: args.author })
        filter['author'] = author ? author._id : null
      }

      if (args.genre) {
        filter['genres'] = args.genre
      }

      return Book.find(filter).populate('author')
    },
  },
  Mutation: {
    addBook: async (root, args, context) => {
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        })
      }

      if (args.author.length < 4) {
        throw new GraphQLError(
          'Author is shorter than the minimum allowed length',
          {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.author,
            },
          }
        )
      }

      if (args.title.length < 5) {
        throw new GraphQLError(
          'Title is shorter then the minimum allowed length',
          {
            extensions: {
              code: 'BAD_USER_INPUT',
              invalidArgs: args.title,
            },
          }
        )
      }

      let author = await Author.findOne({ name: args.author })

      if (!author) {
        author = new Author({ name: args.author })
      }

      const book = new Book({
        title: args.title,
        author: author._id,
        published: args.published,
        genres: args.genres,
      })

      author.bookCount = !author.bookCount ? 1 : author.bookCount + 1
      author.save()

      await book.save()

      pubsub.publish('BOOK_ADDED', { bookAdded: book.populate('author') })

      return book.populate('author')
    },
  },
  Subscription: {
    bookAdded: {
      subscribe: () => pubsub.asyncIterator('BOOK_ADDED'),
    },
  },
}

module.exports = { typeDefs, resolvers }
