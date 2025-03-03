import { Pokemon, PokemonInterface } from '@internal/database'
import { JoeyQuestService } from './joey-quest-service'

class PokedexService {
    static async getAllPokemons(): Promise<PokemonInterface[]> {
        return await Pokemon.find({}, { pokedexNumber: 1 })
    }

    static async getPokemons(
        filter: Record<string, unknown>
    ): Promise<PokemonInterface[]> {
        return await Pokemon.find(filter, { pokedexNumber: 1 })
    }

    static async caughtPokemon(name: string): Promise<PokemonInterface> {
        const newPokemonRegister = await Pokemon.findOneAndUpdate(
            { name },
            { caught: true }
        )

        if (newPokemonRegister.joeyQuestClans.length) {
            await JoeyQuestService.updatePokemonGroups(
                newPokemonRegister.joeyQuestClans
            )
        }

        return newPokemonRegister
    }
}

export { PokedexService }
