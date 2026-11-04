import {
    ClanName,
    Difficulty,
    PokemonType,
    PokemonVariant
} from '@internal/shared'

export interface PokemonInterface {
    number: number
    pokedexNumber: string
    name: string
    caught: boolean
    joeyQuestClans: ClanName[]
    joeyQuestDifficulty: Difficulty | null
    variant: PokemonVariant | null
    baseName: string | null
    type: PokemonType[]
    superWeakness: PokemonType[]
    weakness: PokemonType[]
    neutral: PokemonType[]
    resistance: PokemonType[]
    superResistance: PokemonType[]
    immunity: PokemonType[]
}
