type PokemonType =
    | 'NORMAL'
    | 'FIRE'
    | 'WATER'
    | 'GRASS'
    | 'ELECTRIC'
    | 'ICE'
    | 'FIGHTING'
    | 'POISON'
    | 'GROUND'
    | 'FLYING'
    | 'PSYCHIC'
    | 'BUG'
    | 'ROCK'
    | 'GHOST'
    | 'DARK'
    | 'DRAGON'
    | 'STEEL'
    | 'FAIRY'
    | 'CRYSTAL'

export interface PokemonInterface {
    pokedexNumber: string
    name: string
    caught: boolean
    type: PokemonType[]
    superWeakness: PokemonType[]
    weakness: PokemonType[]
    neutral: PokemonType[]
    resistance: PokemonType[]
    immunity: PokemonType[]
}
