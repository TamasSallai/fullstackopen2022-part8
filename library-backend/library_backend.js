require('dotenv').config()
const express = require('express')
const { createServer } = require('http')
const { WebSocketServer } = require('ws')
const { useServer } = require('graphql-ws/lib/use/ws')
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const {
  ApolloServerPluginDrainHttpServer,
} = require('@apollo/server/plugin/drainHttpServer')
const schema = require('./graphql/schema')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const User = require('./models/user')

const MONGODB_URI = process.env.MONGODB_URI
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('error connecting to MongoDB:', error.message))

const start = async () => {
  const app = express()
  const httpServer = createServer(app)
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/',
  })
  const serverCleanup = useServer({ schema }, wsServer)
  const apolloServer = new ApolloServer({
    schema,
    plugin: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose()
            },
          }
        },
      },
    ],
  })

  await apolloServer.start()

  app.use(
    '/',
    cors(),
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.startsWith('Bearer ')) {
          const token = auth.substring(7)
          const decodedToken = jwt.verify(token, process.env.JWT_SECRET)
          const currentUser = await User.findById(decodedToken.id)

          return { currentUser }
        }
      },
    })
  )

  const PORT = 4000
  httpServer.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`)
  })
}

start()
