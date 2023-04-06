const { gql } = require('graphql-tag')
const Author = require('../models/author')

const typeDefs = gql`
  type Author {
    id: ID!
    name: String!
    born: Int
    bookCount: Int!
  }

  extend type Query {
    authorCount: Int!
    allAuthors: [Author!]!
  }

  extend type Mutation {
    editAuthor(name: String!, setBornTo: Int!): Author
  }
`
const resolvers = {
  Query: {
    authorCount: async () => Author.countDocument(),
    allAuthors: async () => {
      const authors = await Author.find({})
      return Promise.all(
        authors.map(async (a) => ({
          name: a.name,
          born: a.born,
          bookCount: await Book.countDocuments({ author: a._id }),
        }))
      )
    },
  },
  Mutation: {
    editAuthor: async (root, args, context) => {
      const currentUser = context.currentUser
      if (!currentUser) {
        throw new GraphQLError('not authenticated', {
          extensions: {
            code: 'BAD_USER_INPUT',
          },
        })
      }

      const author = await Author.findOne({ name: args.name })
      if (!author) {
        throw new GraphQLError("author don't exists", {
          extensions: {
            code: 'BAD_USER_INPUT',
            invalidArgs: args.name,
          },
        })
      }

      author.born = args.setBornTo

      try {
        await author.save()
      } catch (error) {
        throw new GraphQLError('Saving birth date failed.', {
          extensions: {
            code: 'BAD_USER_INPUT',
            error,
          },
        })
      }
      return author
    },
  },
}

module.exports = { typeDefs, resolvers }
