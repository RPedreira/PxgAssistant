import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyRequest,
    FastifyReply
} from 'fastify'

import { PokedexController } from './controllers/pokedex-controller'

export async function routes(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        return PokedexController.getAllPokemons(request, reply)
    })
}
