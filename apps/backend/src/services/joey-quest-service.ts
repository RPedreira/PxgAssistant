import { Group, GroupInterface, Types } from '@internal/database'
import { PokedexService } from './pokedex-service'
import { getJoeyQuestGroupResponse } from '../interfaces'

class JoeyQuestService {
    static async getJoeyQuestGroups(): Promise<GroupInterface[]> {
        return Group.find()
    }

    static async getJoeyQuestGroup(
        clanName: string,
        pokemons: Types.ObjectId[],
        completed: boolean
    ): Promise<getJoeyQuestGroupResponse> {
        const pokemonsDocs = await PokedexService.getPokemons({
            _id: { $in: pokemons }
        })
        return { clanName, pokemons: pokemonsDocs, completed }
    }

    static async updatePokemonGroups(joeyQuestClans: string[]): Promise<void> {
        for (const clan of joeyQuestClans) {
            const clanDoc = await Group.findOne({ name: clan })
            const pokemons = await PokedexService.getPokemons({
                _id: { $in: clanDoc.pokemons }
            })
            const allCaught = pokemons.every(pokemon => pokemon.caught)

            if (allCaught) {
                await Group.findOneAndUpdate(
                    { clanName: clan },
                    { completed: true }
                )
            }

            return
        }
    }
}

export { JoeyQuestService }
