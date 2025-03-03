import { FastifyRequest, FastifyReply } from 'fastify'
import { PokedexService } from '../services/pokedex-service'

class PokedexController {
    static async getAllPokemons(request: FastifyRequest, reply: FastifyReply) {
        return PokedexService.getAllPokemons()
    }
}

export { PokedexController }
