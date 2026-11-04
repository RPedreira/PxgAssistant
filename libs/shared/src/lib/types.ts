export const POKEMON_TYPES = [
    'NORMAL',
    'FIRE',
    'WATER',
    'GRASS',
    'ELECTRIC',
    'ICE',
    'FIGHTING',
    'POISON',
    'GROUND',
    'FLYING',
    'PSYCHIC',
    'BUG',
    'ROCK',
    'GHOST',
    'DARK',
    'DRAGON',
    'STEEL',
    'FAIRY',
    'CRYSTAL'
] as const

export type PokemonType = (typeof POKEMON_TYPES)[number]

export const CLAN_NAMES = [
    'VOLCANIC',
    'SEAVELL',
    'OREBOUND',
    'NATURIA',
    'GARDESTRIKE',
    'IRONHARD',
    'RAIBOLT',
    'WINGEON',
    'PSYCRAFT',
    'MALEFIC'
] as const

export type ClanName = (typeof CLAN_NAMES)[number]

export const DIFFICULTIES = ['EASY', 'MEDIUM', 'HARD'] as const

export type Difficulty = (typeof DIFFICULTIES)[number]

/**
 * Versões alternativas (fonte: seção "Outras Versões" da wiki do PXG).
 * - shiny: Shiny Marowak
 * - regional: Alolan/Galarian/Hisuian/Paldean
 * - special: Big Onix, Crystal Onix, Golden Sudowoodo, Rotom Fire, Baby Mudkip...
 * - mega: Mega Charizard X, Shiny Mega Sableye
 * - tier: versões (TM) e (TR)
 * Na ordem em que aparecem depois da forma base.
 */
export const POKEMON_VARIANTS = [
    'shiny',
    'regional',
    'special',
    'mega',
    'tier'
] as const

export type PokemonVariant = (typeof POKEMON_VARIANTS)[number]

/** Megas e tiers TM/TR são forjados, não capturados: não entram no "capturado". */
export function isCatchableVariant(variant: PokemonVariant | null) {
    return variant !== 'mega' && variant !== 'tier'
}

/** Filtro de versão da Pokedex: só formas base, só alternativas ou um tipo de variante. */
export type VersionFilter = 'base' | 'alt' | PokemonVariant

/** Pokémon como trafega entre backend e frontend. */
export interface PokemonDto {
    id: string
    /** Número da pokedex nacional, para ordenação. */
    number: number
    /** Número formatado como no jogo, ex.: "#025". */
    pokedexNumber: string
    name: string
    caught: boolean
    types: PokemonType[]
    superWeakness: PokemonType[]
    weakness: PokemonType[]
    neutral: PokemonType[]
    resistance: PokemonType[]
    superResistance: PokemonType[]
    immunity: PokemonType[]
    joeyQuestClans: ClanName[]
    joeyQuestDifficulty: Difficulty | null
    /** null na forma base; nas variantes, o nome da forma base (ex.: "marowak"). */
    baseName: string | null
    variant: PokemonVariant | null
    /** false para Megas e TM/TR: não podem ser marcados como capturados. */
    catchable: boolean
}

export interface ClanDto {
    name: ClanName
    order: number
    egg: string
    essence: string
}

export interface ClanProgressDto extends ClanDto {
    total: number
    caught: number
    completed: boolean
    pokemons: PokemonDto[]
}

export interface JoeyQuestSummaryDto {
    clans: ClanProgressDto[]
    /** Pokémons distintos na quest (um pokémon pode estar em vários clãs). */
    totalPokemons: number
    caughtPokemons: number
    completedClans: number
    completed: boolean
}

export interface UpdatePokemonDto {
    caught: boolean
}

/**
 * Filtro de combate: "fraco contra" ou "resiste a" uma lista de tipos.
 * - weak: recebe dano aumentado (fraqueza ou super fraqueza).
 * - resists: resiste, super resiste ou é imune.
 * - and: precisa valer para TODOS os tipos (hunt em dupla: Planta E Fantasma).
 * - or: basta valer para UM dos tipos (Planta OU Inseto).
 * Só um filtro de combate por vez.
 */
export type MatchupRelation = 'weak' | 'resists'
export type MatchupMode = 'and' | 'or'

export interface MatchupFilter {
    relation: MatchupRelation
    mode: MatchupMode
    types: PokemonType[]
}

/** Filtros aceitos por GET /api/pokemons. */
export interface PokemonQuery {
    search?: string
    types?: PokemonType[]
    matchup?: MatchupFilter
    version?: VersionFilter
    /** Filtra capturados/faltando; megas e TM/TR ficam de fora (não são capturáveis). */
    caught?: boolean
    joeyQuest?: boolean
    clan?: ClanName
    sort?: 'number' | 'name'
}
