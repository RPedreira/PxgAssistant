import { MatchupFilter, PokemonQuery, PokemonType } from '@internal/shared'

const MATCHUP_FIELDS = {
    weak: ['superWeakness', 'weakness'],
    resists: ['resistance', 'superResistance', 'immunity']
} as const

/** `{ $or: [{ campo: tipo(s) }, ...] }` para uma relação de combate. */
function matchupClause(
    matchup: MatchupFilter,
    value: PokemonType | { $in: PokemonType[] }
) {
    return {
        $or: MATCHUP_FIELDS[matchup.relation].map(field => ({ [field]: value }))
    }
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Converte filtros já validados em uma query do Mongo. Só monta operadores
 * conhecidos: nada vindo do cliente é repassado diretamente ao banco.
 * Mesma semântica de `filterPokemons` (libs/shared).
 */
export function buildPokemonFilter(
    query: PokemonQuery
): Record<string, unknown> {
    const and: Record<string, unknown>[] = []
    const search = query.search?.trim().toLowerCase()

    if (search) {
        const pattern = new RegExp(escapeRegex(search))
        and.push({ $or: [{ name: pattern }, { pokedexNumber: pattern }] })
    }
    if (query.types?.length) {
        and.push({ type: { $all: query.types } })
    }
    const matchup = query.matchup
    if (matchup?.types.length) {
        if (matchup.mode === 'and') {
            for (const type of matchup.types)
                and.push(matchupClause(matchup, type))
        } else {
            and.push(matchupClause(matchup, { $in: matchup.types }))
        }
    }
    if (query.version === 'base') {
        and.push({ variant: null })
    } else if (query.version === 'alt') {
        and.push({ variant: { $ne: null } })
    } else if (query.version) {
        and.push({ variant: query.version })
    }
    if (query.caught !== undefined) {
        // Megas e TM/TR não são capturáveis: ficam fora de "capturados" e "faltam"
        and.push({ caught: query.caught, variant: { $nin: ['mega', 'tier'] } })
    }
    if (query.joeyQuest !== undefined) {
        and.push({ 'joeyQuestClans.0': { $exists: query.joeyQuest } })
    }
    if (query.clan) {
        and.push({ joeyQuestClans: query.clan })
    }

    return and.length ? { $and: and } : {}
}

export function buildPokemonSort(query: PokemonQuery): Record<string, 1> {
    // variant: null vem antes no Mongo, então a forma base abre cada número
    return query.sort === 'name'
        ? { name: 1 }
        : { number: 1, variant: 1, name: 1 }
}
