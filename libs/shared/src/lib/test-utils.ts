import { PokemonDto } from './types'

/** Cria um PokemonDto mínimo para testes. */
export function makePokemon(overrides: Partial<PokemonDto> = {}): PokemonDto {
    return {
        id: overrides.name ?? 'id',
        number: 1,
        pokedexNumber: '#001',
        name: 'bulbasaur',
        caught: false,
        types: ['GRASS', 'POISON'],
        superWeakness: [],
        weakness: ['FIRE', 'ICE', 'FLYING', 'PSYCHIC'],
        neutral: [],
        resistance: ['WATER', 'ELECTRIC', 'FIGHTING', 'FAIRY'],
        superResistance: ['GRASS'],
        immunity: [],
        joeyQuestClans: [],
        joeyQuestDifficulty: null,
        baseName: null,
        variant: null,
        catchable: true,
        ...overrides
    }
}
