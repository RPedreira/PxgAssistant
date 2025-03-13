import {
    FastifyInstance,
    FastifyPluginOptions,
    FastifyRequest,
    FastifyReply
} from 'fastify'

import { PokedexController } from './controllers/pokedex-controller'
import { JoeyQuestController } from './controllers/joey-quest-controller'

export async function routes(
    fastify: FastifyInstance,
    options: FastifyPluginOptions
) {
    fastify.get(
        '/pokemons',
        async (request: FastifyRequest, reply: FastifyReply) => {
            return PokedexController.getAllPokemons()
        }
    )

    fastify.get(
        '/groups',
        async (request: FastifyRequest, reply: FastifyReply) => {
            return JoeyQuestController.getJoeyQuestGroups()
        }
    )

    fastify.post(
        '/pokemons',
        async (request: FastifyRequest, reply: FastifyReply) => {
            return PokedexController.getPokemons(
                request.body as Record<string, unknown>
            )
        }
    )
}
