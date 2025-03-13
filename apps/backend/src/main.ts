import Fastify from 'fastify'
import cors from '@fastify/cors'
import { routes } from './routes'

const app = Fastify({ logger: true })

app.errorHandler = (error, request, reply) => {
    reply.code(400).send({ error: error.message })
}

const start = async () => {
    await app.register(cors)
    await app.register(routes)
    try {
        await app.listen({ port: 8200 })
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()
