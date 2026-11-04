import {
    MatchupFilter,
    POKEMON_VARIANTS,
    PokemonDto,
    PokemonQuery,
    PokemonType,
    VersionFilter
} from './types'

export function takesExtraDamageFrom(pokemon: PokemonDto, type: PokemonType) {
    return (
        pokemon.superWeakness.includes(type) || pokemon.weakness.includes(type)
    )
}

export function resistsType(pokemon: PokemonDto, type: PokemonType) {
    return (
        pokemon.resistance.includes(type) ||
        pokemon.superResistance.includes(type) ||
        pokemon.immunity.includes(type)
    )
}

export function matchesMatchup(pokemon: PokemonDto, matchup: MatchupFilter) {
    if (!matchup.types.length) return true
    const test =
        matchup.relation === 'weak' ? takesExtraDamageFrom : resistsType
    const check = (type: PokemonType) => test(pokemon, type)
    return matchup.mode === 'and'
        ? matchup.types.every(check)
        : matchup.types.some(check)
}

export function matchesVersion(pokemon: PokemonDto, version: VersionFilter) {
    if (version === 'base') return pokemon.variant === null
    if (version === 'alt') return pokemon.variant !== null
    return pokemon.variant === version
}

/** Forma base primeiro, depois shiny, regional, especial, mega e TM/TR. */
export function variantRank(pokemon: PokemonDto) {
    return pokemon.variant === null
        ? 0
        : POKEMON_VARIANTS.indexOf(pokemon.variant) + 1
}

/**
 * Filtra e ordena uma lista de pokémons. Usada pelo frontend (filtros
 * instantâneos) e espelhada pelo backend na query do Mongo.
 * `types` exige que o pokémon tenha TODOS os tipos selecionados.
 */
export function filterPokemons(
    pokemons: PokemonDto[],
    query: PokemonQuery
): PokemonDto[] {
    const search = query.search?.trim().toLowerCase()

    const result = pokemons.filter(pokemon => {
        if (
            search &&
            !pokemon.name.includes(search) &&
            !pokemon.pokedexNumber.includes(search)
        ) {
            return false
        }
        if (
            query.types?.length &&
            !query.types.every(t => pokemon.types.includes(t))
        ) {
            return false
        }
        if (query.matchup && !matchesMatchup(pokemon, query.matchup)) {
            return false
        }
        if (query.version && !matchesVersion(pokemon, query.version)) {
            return false
        }
        if (
            query.caught !== undefined &&
            (!pokemon.catchable || pokemon.caught !== query.caught)
        ) {
            return false
        }
        if (
            query.joeyQuest !== undefined &&
            pokemon.joeyQuestClans.length > 0 !== query.joeyQuest
        ) {
            return false
        }
        if (query.clan && !pokemon.joeyQuestClans.includes(query.clan)) {
            return false
        }
        return true
    })

    return result.sort(
        query.sort === 'name'
            ? (a, b) => a.name.localeCompare(b.name)
            : (a, b) =>
                  a.number - b.number ||
                  variantRank(a) - variantRank(b) ||
                  a.name.localeCompare(b.name)
    )
}
