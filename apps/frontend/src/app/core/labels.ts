import {
    ClanName,
    Difficulty,
    PokemonType,
    PokemonVariant,
    VersionFilter,
    spriteSlug
} from '@internal/shared'

export const TYPE_LABELS: Record<PokemonType, string> = {
    NORMAL: 'Normal',
    FIRE: 'Fogo',
    WATER: 'Água',
    GRASS: 'Planta',
    ELECTRIC: 'Elétrico',
    ICE: 'Gelo',
    FIGHTING: 'Lutador',
    POISON: 'Venenoso',
    GROUND: 'Terra',
    FLYING: 'Voador',
    PSYCHIC: 'Psíquico',
    BUG: 'Inseto',
    ROCK: 'Pedra',
    GHOST: 'Fantasma',
    DARK: 'Sombrio',
    DRAGON: 'Dragão',
    STEEL: 'Metálico',
    FAIRY: 'Fada',
    CRYSTAL: 'Cristal'
}

export const TYPE_COLORS: Record<PokemonType, string> = {
    NORMAL: '#9fa19f',
    FIRE: '#e62829',
    WATER: '#2980ef',
    GRASS: '#3fa129',
    ELECTRIC: '#fac000',
    ICE: '#3dcef3',
    FIGHTING: '#ff8000',
    POISON: '#9141cb',
    GROUND: '#915121',
    FLYING: '#81b9ef',
    PSYCHIC: '#ef4179',
    BUG: '#91a119',
    ROCK: '#afa981',
    GHOST: '#704170',
    DARK: '#624d4e',
    DRAGON: '#5060e1',
    STEEL: '#60a1b8',
    FAIRY: '#ef70ef',
    CRYSTAL: '#5fd3c4'
}

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
    EASY: 'Fácil',
    MEDIUM: 'Médio',
    HARD: 'Difícil'
}

/** "VOLCANIC" -> "Volcanic" */
export function clanLabel(name: ClanName) {
    return name.charAt(0) + name.slice(1).toLowerCase()
}

export const VARIANT_LABELS: Record<PokemonVariant, string> = {
    shiny: 'Shiny',
    regional: 'Regional',
    special: 'Especial',
    mega: 'Mega',
    tier: 'TM/TR'
}

export const VERSION_LABELS: Record<VersionFilter, string> = {
    base: 'Só normais',
    alt: 'Só alternativas',
    shiny: 'Shiny',
    regional: 'Regionais',
    special: 'Especiais',
    mega: 'Mega',
    tier: 'TM/TR'
}

/** "mr.mime" -> "Mr.Mime", "ho-oh" -> "Ho-Oh", "shiny marowak (tm)" -> "Shiny Marowak (TM)" */
export function displayName(name: string) {
    return name
        .replace(
            /(^|[\s.(-])(\p{Ll})/gu,
            (_, sep: string, ch: string) => sep + ch.toUpperCase()
        )
        .replace(/\((tm|tr)\)/gi, m => m.toUpperCase())
}

/** Selo curto do card: ✦ para shiny, M para mega, TM/TR para os tiers. */
export function variantMark(
    name: string,
    variant: PokemonVariant | null
): string | null {
    if (variant === 'tier') return /\(tr\)/i.test(name) ? 'TR' : 'TM'
    if (variant === 'mega') return 'M'
    if (variant === 'shiny') return '✦'
    return null
}

export const pokemonSprite = (name: string) =>
    `sprites/pokemon/${spriteSlug(name)}.png`
export const typeIcon = (type: PokemonType) =>
    `sprites/types/${spriteSlug(type)}.png`
export const clanIcon = (clan: ClanName) =>
    `sprites/clans/${spriteSlug(clan)}.png`
