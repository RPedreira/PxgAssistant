import { PokemonInterface } from '@internal/database'
import { PokedexService } from '../services/pokedex-service'

class PokedexController {
    static async getAllPokemons(): Promise<PokemonInterface[]> {
        return PokedexService.getAllPokemons()
    }

    static async getPokemons(
        filter: Record<string, unknown>
    ): Promise<PokemonInterface[]> {
        return PokedexService.getPokemons(filter)
    }

    static async caughtPokemon(name: string): Promise<PokemonInterface> {
        return PokedexService.caughtPokemon(name)
    }
}

export { PokedexController }
