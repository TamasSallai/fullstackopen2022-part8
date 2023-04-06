const merge = require('lodash.merge')
const { makeExecutableSchema } = require('@graphql-tools/schema')
const { typeDefs: authTypeDefs, resolvers: authResolvers } = require('./auth')
const {
  typeDefs: authorTypeDefs,
  resolvers: authorResolvers,
} = require('./author')
const { typeDefs: bookTypeDefs, resolvers: bookResolvers } = require('./book')

const emptySchema = `
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }
`

const schema = makeExecutableSchema({
  typeDefs: [emptySchema, authTypeDefs, authorTypeDefs, bookTypeDefs],
  resolvers: merge(authResolvers, authorResolvers, bookResolvers),
})

module.exports = schema
