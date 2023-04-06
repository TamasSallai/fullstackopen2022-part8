const { gql } = require('graphql-tag')
const Book = require('../models/book')

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
        try {
          await author.save()
        } catch (error) {
          throw new GraphQLError('Saving author failed.', {
            extensions: {
              error,
            },
          })
        }
      }

      const book = new Book({
        title: args.title,
        author: author._id,
        published: args.published,
        genres: args.genres,
      })

      try {
        await book.save()
      } catch (error) {
        throw new GraphQLError('Saving book failed.', {
          extensions: {
            code: 'BAD_USER_INPUT',
            error,
          },
        })
      }
      return book.populate('author')
    },
  },
}

module.exports = { typeDefs, resolvers }
