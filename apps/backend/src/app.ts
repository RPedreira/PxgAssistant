import Fastify, { FastifyError, FastifyServerOptions } from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import { pokemonRoutes } from './routes/pokemon-routes'
import { joeyQuestRoutes } from './routes/joey-quest-routes'

export interface AppOptions {
    /**
     * Pasta com o build do frontend. Quando informada, o mesmo servidor entrega
     * as telas e a API (usado pelo app desktop). Rotas desconhecidas fora de
     * /api caem no index.html para o roteador do Angular.
     */
    staticDir?: string
}

export async function buildApp(
    options: FastifyServerOptions = {},
    { staticDir }: AppOptions = {}
) {
    const app = Fastify(options)

    app.setErrorHandler((error: FastifyError, request, reply) => {
        if (error.validation) {
            return reply.code(400).send({ error: error.message })
        }
        const status = error.statusCode ?? 500
        if (status >= 500) {
            request.log.error(error)
            return reply.code(500).send({ error: 'Erro interno do servidor' })
        }
        return reply.code(status).send({ error: error.message })
    })

    await app.register(cors, { methods: ['GET', 'PATCH'] })
    await app.register(
        async api => {
            await api.register(pokemonRoutes)
            await api.register(joeyQuestRoutes)
        },
        { prefix: '/api' }
    )

    if (staticDir) {
        await app.register(fastifyStatic, { root: staticDir, wildcard: false })
        app.setNotFoundHandler((request, reply) => {
            if (request.method === 'GET' && !request.url.startsWith('/api')) {
                return reply.sendFile('index.html')
            }
            return reply.code(404).send({ error: 'Rota não encontrada' })
        })
    }

    return app
}
