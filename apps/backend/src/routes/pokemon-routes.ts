import { FastifyInstance } from 'fastify'
import {
    CLAN_NAMES,
    ClanName,
    MatchupFilter,
    MatchupMode,
    POKEMON_TYPES,
    PokemonQuery,
    POKEMON_VARIANTS,
    PokemonType,
    UpdatePokemonDto,
    VersionFilter
} from '@internal/shared'
import { PokemonService } from '../services/pokemon-service'
import { HttpError, notFound } from '../errors'

interface ListQuerystring {
    search?: string
    /** Lista separada por vírgula, ex.: FIRE,FLYING */
    types?: string
    /** Fraco contra estes tipos (lista separada por vírgula). */
    weakTo?: string
    /** Resiste a estes tipos (lista separada por vírgula). */
    resists?: string
    /** and = todos os tipos de weakTo/resists; or = qualquer um. Padrão: and. */
    match?: MatchupMode
    /** base, alt ou um tipo de variante (shiny, regional, special, mega, tier). */
    version?: VersionFilter
    caught?: boolean
    joeyQuest?: boolean
    clan?: ClanName
    sort?: 'number' | 'name'
}

const typePattern = `^(${POKEMON_TYPES.join('|')})(,(${POKEMON_TYPES.join(
    '|'
)}))*$`

const listSchema = {
    querystring: {
        type: 'object',
        additionalProperties: false,
        properties: {
            search: { type: 'string', maxLength: 50 },
            types: { type: 'string', pattern: typePattern },
            weakTo: { type: 'string', pattern: typePattern },
            resists: { type: 'string', pattern: typePattern },
            match: { type: 'string', enum: ['and', 'or'] },
            version: {
                type: 'string',
                enum: ['base', 'alt', ...POKEMON_VARIANTS]
            },
            caught: { type: 'boolean' },
            joeyQuest: { type: 'boolean' },
            clan: { type: 'string', enum: CLAN_NAMES },
            sort: { type: 'string', enum: ['number', 'name'] }
        }
    }
}

const splitTypes = (csv?: string) =>
    csv ? (csv.split(',') as PokemonType[]) : undefined

function toMatchup({
    weakTo,
    resists,
    match
}: ListQuerystring): MatchupFilter | undefined {
    // Só um filtro de combate por vez.
    if (weakTo && resists) {
        throw new HttpError(
            400,
            'Use weakTo ou resists, não os dois ao mesmo tempo'
        )
    }
    const types = splitTypes(weakTo ?? resists)
    if (!types) return undefined
    return {
        relation: weakTo ? 'weak' : 'resists',
        mode: match ?? 'and',
        types
    }
}

const nameParams = {
    type: 'object',
    required: ['name'],
    properties: { name: { type: 'string', minLength: 1, maxLength: 50 } }
}

const updateSchema = {
    params: nameParams,
    body: {
        type: 'object',
        required: ['caught'],
        additionalProperties: false,
        properties: { caught: { type: 'boolean' } }
    }
}

export async function pokemonRoutes(app: FastifyInstance) {
    app.get<{ Querystring: ListQuerystring }>(
        '/pokemons',
        { schema: listSchema },
        async request => {
            const { types, weakTo, resists, match, ...rest } = request.query
            const query: PokemonQuery = {
                ...rest,
                types: splitTypes(types),
                matchup: toMatchup({ weakTo, resists, match })
            }
            return PokemonService.list(query)
        }
    )

    app.get<{ Params: { name: string } }>(
        '/pokemons/:name',
        { schema: { params: nameParams } },
        async request => {
            const pokemon = await PokemonService.findByName(request.params.name)
            return (
                pokemon ??
                notFound(`Pokémon "${request.params.name}" não encontrado`)
            )
        }
    )

    app.patch<{ Params: { name: string }; Body: UpdatePokemonDto }>(
        '/pokemons/:name',
        { schema: updateSchema },
        async request => {
            const current = await PokemonService.findByName(request.params.name)
            if (!current)
                return notFound(
                    `Pokémon "${request.params.name}" não encontrado`
                )
            if (!current.catchable && request.body.caught) {
                throw new HttpError(
                    400,
                    'Megas e versões TM/TR são forjadas, não capturadas'
                )
            }
            const pokemon = await PokemonService.setCaught(
                request.params.name,
                request.body.caught
            )
            return (
                pokemon ??
                notFound(`Pokémon "${request.params.name}" não encontrado`)
            )
        }
    )
}
