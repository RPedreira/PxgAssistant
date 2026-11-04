import { buildPokemonFilter, buildPokemonSort } from './services/pokemon-query'
import { buildJoeyQuestSummary as buildSummary } from '@internal/shared'
import { buildApp } from './app'
import { makePokemon } from '@internal/shared/testing'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

jest.mock('./services/pokemon-service', () => ({
    PokemonService: {
        list: jest.fn(async () => []),
        findByName: jest.fn(async (name: string) =>
            name === 'dwebble'
                ? { name, catchable: true }
                : name === 'mega charizard x'
                ? { name, catchable: false }
                : null
        ),
        setCaught: jest.fn(async (name: string, caught: boolean) => ({
            name,
            caught
        }))
    }
}))

describe('buildPokemonFilter', () => {
    it('retorna filtro vazio sem parâmetros', () => {
        expect(buildPokemonFilter({})).toEqual({})
    })

    it('escapa a busca como texto literal', () => {
        const filter = buildPokemonFilter({ search: 'mr.mime' }) as {
            $and: { $or: { name: RegExp }[] }[]
        }
        const regex = filter.$and[0].$or[0].name
        expect(regex.test('mr.mime')).toBe(true)
        expect(regex.test('mrxmime')).toBe(false)
    })

    it('combina tipos, fraquezas, resistências e status', () => {
        expect(
            buildPokemonFilter({
                types: ['FIRE', 'FLYING'],
                matchup: { relation: 'weak', mode: 'and', types: ['ROCK'] },
                caught: false,
                joeyQuest: true,
                clan: 'VOLCANIC'
            })
        ).toEqual({
            $and: [
                { type: { $all: ['FIRE', 'FLYING'] } },
                { $or: [{ superWeakness: 'ROCK' }, { weakness: 'ROCK' }] },
                { caught: false, variant: { $nin: ['mega', 'tier'] } },
                { 'joeyQuestClans.0': { $exists: true } },
                { joeyQuestClans: 'VOLCANIC' }
            ]
        })
    })

    it('fraco contra X E Y exige cada tipo; X OU Y usa $in', () => {
        expect(
            buildPokemonFilter({
                matchup: {
                    relation: 'weak',
                    mode: 'and',
                    types: ['GRASS', 'GHOST']
                }
            })
        ).toEqual({
            $and: [
                { $or: [{ superWeakness: 'GRASS' }, { weakness: 'GRASS' }] },
                { $or: [{ superWeakness: 'GHOST' }, { weakness: 'GHOST' }] }
            ]
        })
        expect(
            buildPokemonFilter({
                matchup: {
                    relation: 'resists',
                    mode: 'or',
                    types: ['BUG', 'GRASS']
                }
            })
        ).toEqual({
            $and: [
                {
                    $or: [
                        { resistance: { $in: ['BUG', 'GRASS'] } },
                        { superResistance: { $in: ['BUG', 'GRASS'] } },
                        { immunity: { $in: ['BUG', 'GRASS'] } }
                    ]
                }
            ]
        })
    })

    it('filtra por versão', () => {
        expect(buildPokemonFilter({ version: 'base' })).toEqual({
            $and: [{ variant: null }]
        })
        expect(buildPokemonFilter({ version: 'alt' })).toEqual({
            $and: [{ variant: { $ne: null } }]
        })
        expect(buildPokemonFilter({ version: 'mega' })).toEqual({
            $and: [{ variant: 'mega' }]
        })
    })

    it('ordena por número ou nome', () => {
        expect(buildPokemonSort({})).toEqual({ number: 1, variant: 1, name: 1 })
        expect(buildPokemonSort({ sort: 'name' })).toEqual({ name: 1 })
    })
})

describe('buildSummary', () => {
    const clans = [
        {
            name: 'OREBOUND' as const,
            order: 1,
            egg: 'Sand Egg',
            essence: 'Orebound Essence'
        },
        {
            name: 'NATURIA' as const,
            order: 0,
            egg: 'Sprout Egg',
            essence: 'Naturia Essence'
        }
    ]

    it('calcula progresso por clã e conta pokémons compartilhados uma vez', () => {
        const summary = buildSummary(clans, [
            makePokemon({
                name: 'dwebble',
                caught: true,
                joeyQuestClans: ['NATURIA', 'OREBOUND']
            }),
            makePokemon({
                name: 'shroomish',
                caught: false,
                joeyQuestClans: ['NATURIA']
            })
        ])
        expect(
            summary.clans.map(c => [c.name, c.caught, c.total, c.completed])
        ).toEqual([
            ['NATURIA', 1, 2, false],
            ['OREBOUND', 1, 1, true]
        ])
        expect(summary.totalPokemons).toBe(2)
        expect(summary.caughtPokemons).toBe(1)
        expect(summary.completedClans).toBe(1)
        expect(summary.completed).toBe(false)
    })

    it('marca a quest completa quando todos os clãs estão completos', () => {
        const summary = buildSummary(clans, [
            makePokemon({
                name: 'dwebble',
                caught: true,
                joeyQuestClans: ['NATURIA', 'OREBOUND']
            })
        ])
        expect(summary.completed).toBe(true)
    })
})

describe('modo desktop (staticDir)', () => {
    let app: Awaited<ReturnType<typeof buildApp>>
    let dir: string
    beforeAll(async () => {
        dir = mkdtempSync(path.join(tmpdir(), 'pxg-static-'))
        writeFileSync(path.join(dir, 'index.html'), '<h1>app</h1>')
        writeFileSync(path.join(dir, 'main.js'), 'console.log(1)')
        app = await buildApp({}, { staticDir: dir })
    })
    afterAll(async () => {
        await app.close()
        rmSync(dir, { recursive: true, force: true })
    })

    it('serve arquivos do frontend e cai no index.html nas rotas do Angular', async () => {
        expect((await app.inject({ url: '/main.js' })).body).toBe(
            'console.log(1)'
        )
        expect((await app.inject({ url: '/' })).body).toBe('<h1>app</h1>')
        const deep = await app.inject({ url: '/pokedex?vs=GRASS' })
        expect(deep.statusCode).toBe(200)
        expect(deep.body).toBe('<h1>app</h1>')
    })

    it('mantém a API e responde 404 em JSON para rotas de API desconhecidas', async () => {
        expect((await app.inject({ url: '/api/pokemons' })).statusCode).toBe(
            200
        )
        const missing = await app.inject({ url: '/api/nada' })
        expect(missing.statusCode).toBe(404)
        expect(missing.json()).toEqual({ error: 'Rota não encontrada' })
    })
})

describe('rotas', () => {
    let app: Awaited<ReturnType<typeof buildApp>>
    beforeAll(async () => {
        app = await buildApp()
    })
    afterAll(() => app.close())

    it('rejeita filtros inválidos com 400', async () => {
        const res = await app.inject({ url: '/api/pokemons?types=FOGO' })
        expect(res.statusCode).toBe(400)
    })

    it('converte weakTo/resists + match no filtro de combate', async () => {
        const { PokemonService } = jest.requireMock(
            './services/pokemon-service'
        )
        const res = await app.inject({
            url: '/api/pokemons?weakTo=GRASS,GHOST&match=or'
        })
        expect(res.statusCode).toBe(200)
        expect(PokemonService.list).toHaveBeenLastCalledWith(
            expect.objectContaining({
                matchup: {
                    relation: 'weak',
                    mode: 'or',
                    types: ['GRASS', 'GHOST']
                }
            })
        )

        await app.inject({ url: '/api/pokemons?resists=FIRE' })
        expect(PokemonService.list).toHaveBeenLastCalledWith(
            expect.objectContaining({
                matchup: { relation: 'resists', mode: 'and', types: ['FIRE'] }
            })
        )
    })

    it('aceita só um filtro de combate por vez', async () => {
        const res = await app.inject({
            url: '/api/pokemons?weakTo=GRASS&resists=FIRE'
        })
        expect(res.statusCode).toBe(400)
        expect(res.json().error).toContain('não os dois')
    })

    it('responde 404 para pokémon inexistente', async () => {
        const res = await app.inject({ url: '/api/pokemons/missingno' })
        expect(res.statusCode).toBe(404)
    })

    it('exige caught booleano no PATCH', async () => {
        const bad = await app.inject({
            method: 'PATCH',
            url: '/api/pokemons/dwebble',
            payload: { caught: 'sim' }
        })
        expect(bad.statusCode).toBe(400)

        const ok = await app.inject({
            method: 'PATCH',
            url: '/api/pokemons/dwebble',
            payload: { caught: true }
        })
        expect(ok.statusCode).toBe(200)
        expect(ok.json()).toEqual({ name: 'dwebble', caught: true })
    })

    it('não deixa marcar megas e TM/TR como capturados', async () => {
        const res = await app.inject({
            method: 'PATCH',
            url: `/api/pokemons/${encodeURIComponent('mega charizard x')}`,
            payload: { caught: true }
        })
        expect(res.statusCode).toBe(400)
        expect(res.json().error).toContain('forjadas')
    })

    it('valida o filtro de versão', async () => {
        expect(
            (await app.inject({ url: '/api/pokemons?version=shiny' }))
                .statusCode
        ).toBe(200)
        expect(
            (await app.inject({ url: '/api/pokemons?version=gold' })).statusCode
        ).toBe(400)
    })
})
