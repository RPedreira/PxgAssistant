import { PokemonInterface } from '@internal/database'

export interface getJoeyQuestGroupResponse {
    clanName: string
    pokemons: PokemonInterface[]
    completed: boolean
}
