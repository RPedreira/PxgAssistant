import { filterPokemons } from './pokemon-filter'
import { spriteSlug } from './sprites'
import { JOEY_QUEST_CLANS, JOEY_QUEST_DIFFICULTY } from './joey-quest-data'
import {
    CLAN_NAMES,
    MatchupMode,
    POKEMON_VARIANTS,
    PokemonType,
    isCatchableVariant
} from './types'
import { buildJoeyQuestSummary } from './joey-quest-summary'
import { makePokemon } from './test-utils'

describe('spriteSlug', () => {
    it.each([
        ['Mr.Mime', 'mr-mime'],
        ['Flabébé', 'flabebe'],
        ["Farfetch'd", 'farfetch-d'],
        ['Minun and Plusle', 'minun-and-plusle'],
        ['Porygon2', 'porygon2'],
        ['Ho-oh', 'ho-oh']
    ])('%s -> %s', (name, slug) => expect(spriteSlug(name)).toBe(slug))
})

describe('filterPokemons', () => {
    const charizard = makePokemon({
        name: 'charizard',
        number: 6,
        pokedexNumber: '#006',
        types: ['FIRE', 'FLYING'],
        superWeakness: ['ROCK'],
        weakness: ['WATER', 'ELECTRIC'],
        resistance: ['FIRE', 'FIGHTING'],
        superResistance: ['GRASS', 'BUG'],
        immunity: ['GROUND'],
        caught: true
    })
    const bulbasaur = makePokemon()
    const dwebble = makePokemon({
        name: 'dwebble',
        number: 557,
        pokedexNumber: '#557',
        types: ['BUG', 'ROCK'],
        weakness: ['WATER', 'STEEL'],
        resistance: ['NORMAL'],
        superResistance: [],
        joeyQuestClans: ['NATURIA', 'OREBOUND'],
        joeyQuestDifficulty: 'EASY'
    })
    const all = [dwebble, charizard, bulbasaur]
    const names = (query: Parameters<typeof filterPokemons>[1]) =>
        filterPokemons(all, query).map(p => p.name)

    it('ordena por número por padrão e por nome quando pedido', () => {
        expect(names({})).toEqual(['bulbasaur', 'charizard', 'dwebble'])
        expect(names({ sort: 'name' })).toEqual([
            'bulbasaur',
            'charizard',
            'dwebble'
        ])
        expect(
            filterPokemons([charizard, bulbasaur], { sort: 'name' })[0].name
        ).toBe('bulbasaur')
    })

    it('busca por nome ou número', () => {
        expect(names({ search: 'CHAR' })).toEqual(['charizard'])
        expect(names({ search: '557' })).toEqual(['dwebble'])
    })

    it('exige todos os tipos selecionados', () => {
        expect(names({ types: ['FIRE'] })).toEqual(['charizard'])
        expect(names({ types: ['FIRE', 'BUG'] })).toEqual([])
    })

    const weak = (mode: MatchupMode, ...types: PokemonType[]) =>
        names({ matchup: { relation: 'weak', mode, types } })
    const resists = (mode: MatchupMode, ...types: PokemonType[]) =>
        names({ matchup: { relation: 'resists', mode, types } })

    it('fraco contra inclui fraqueza e super fraqueza', () => {
        expect(weak('and', 'ROCK')).toEqual(['charizard'])
        expect(weak('and', 'FIRE')).toEqual(['bulbasaur'])
    })

    it('fraco contra X OU Y: basta um dos tipos', () => {
        expect(weak('or', 'ROCK', 'FIRE')).toEqual(['bulbasaur', 'charizard'])
        expect(weak('or', 'STEEL', 'PSYCHIC')).toEqual(['bulbasaur', 'dwebble'])
    })

    it('fraco contra X E Y: precisa ser fraco a todos', () => {
        expect(weak('and', 'WATER', 'ELECTRIC')).toEqual(['charizard'])
        expect(weak('and', 'WATER', 'STEEL')).toEqual(['dwebble'])
        expect(weak('and', 'ROCK', 'FIRE')).toEqual([])
    })

    it('resiste inclui resistência, super resistência e imunidade', () => {
        expect(resists('and', 'GROUND')).toEqual(['charizard'])
        expect(resists('and', 'GRASS')).toEqual(['bulbasaur', 'charizard'])
    })

    it('resiste a X E/OU Y', () => {
        expect(resists('and', 'GRASS', 'FIGHTING')).toEqual([
            'bulbasaur',
            'charizard'
        ])
        expect(resists('and', 'GRASS', 'NORMAL')).toEqual([])
        expect(resists('or', 'GROUND', 'NORMAL')).toEqual([
            'charizard',
            'dwebble'
        ])
    })

    it('filtro de combate sem tipos não filtra nada', () => {
        expect(weak('and')).toEqual(['bulbasaur', 'charizard', 'dwebble'])
    })

    it('filtra capturados, joey quest e clã', () => {
        expect(names({ caught: true })).toEqual(['charizard'])
        expect(names({ caught: false })).toEqual(['bulbasaur', 'dwebble'])
        expect(names({ joeyQuest: true })).toEqual(['dwebble'])
        expect(names({ joeyQuest: false })).toEqual(['bulbasaur', 'charizard'])
        expect(names({ clan: 'OREBOUND' })).toEqual(['dwebble'])
        expect(names({ clan: 'MALEFIC' })).toEqual([])
    })
})

describe('dados da Joey Quest', () => {
    const entries = JOEY_QUEST_CLANS.flatMap(c => c.pokemons)
    const unique = new Set(entries)

    it('tem os 10 clãs, sem repetição', () => {
        expect(JOEY_QUEST_CLANS.map(c => c.name).sort()).toEqual(
            [...CLAN_NAMES].sort()
        )
    })

    it('tem 49 capturas e 35 pokémons distintos', () => {
        expect(entries).toHaveLength(49)
        expect(unique.size).toBe(35)
    })

    it('não repete pokémon dentro de um clã', () => {
        for (const clan of JOEY_QUEST_CLANS) {
            expect(new Set(clan.pokemons).size).toBe(clan.pokemons.length)
        }
    })

    it('define dificuldade para cada pokémon e só para eles', () => {
        expect(Object.keys(JOEY_QUEST_DIFFICULTY).sort()).toEqual(
            [...unique].sort()
        )
    })

    it('não inclui os pokémons descartados após conferência com o NPC', () => {
        for (const name of [
            'litwick',
            'lampent',
            'chandelure',
            'blitzle',
            'zebstrika'
        ]) {
            expect(unique.has(name)).toBe(false)
        }
    })
})

describe('versões alternativas', () => {
    const marowak = makePokemon({
        name: 'marowak',
        number: 105,
        types: ['GROUND'],
        caught: true
    })
    const shiny = makePokemon({
        name: 'shiny marowak',
        number: 105,
        baseName: 'marowak',
        variant: 'shiny'
    })
    const alolan = makePokemon({
        name: 'alolan marowak',
        number: 105,
        baseName: 'marowak',
        variant: 'regional',
        types: ['FIRE', 'GHOST']
    })
    const tm = makePokemon({
        name: 'shiny marowak (tm)',
        number: 105,
        baseName: 'marowak',
        variant: 'tier',
        catchable: false
    })
    const mega = makePokemon({
        name: 'mega charizard x',
        number: 6,
        baseName: 'charizard',
        variant: 'mega',
        catchable: false
    })
    const all = [tm, alolan, shiny, marowak, mega]
    const names = (query: Parameters<typeof filterPokemons>[1]) =>
        filterPokemons(all, query).map(p => p.name)

    it('ordena a forma base antes das versões, na ordem shiny, regional, especial, mega, TM/TR', () => {
        expect(names({})).toEqual([
            'mega charizard x',
            'marowak',
            'shiny marowak',
            'alolan marowak',
            'shiny marowak (tm)'
        ])
    })

    it('filtra por versão', () => {
        expect(names({ version: 'base' })).toEqual(['marowak'])
        expect(names({ version: 'alt' })).toHaveLength(4)
        expect(names({ version: 'regional' })).toEqual(['alolan marowak'])
        expect(names({ version: 'tier' })).toEqual(['shiny marowak (tm)'])
    })

    it('megas e TM/TR ficam fora de "faltam" e "capturados"', () => {
        expect(names({ caught: false })).toEqual([
            'shiny marowak',
            'alolan marowak'
        ])
        expect(names({ caught: true })).toEqual(['marowak'])
    })

    it('versões usam os próprios tipos nos filtros (Alolan Marowak é Fogo/Fantasma)', () => {
        expect(names({ types: ['GHOST'] })).toEqual(['alolan marowak'])
    })

    it('só megas e TM/TR não são capturáveis', () => {
        expect(POKEMON_VARIANTS.filter(v => !isCatchableVariant(v))).toEqual([
            'mega',
            'tier'
        ])
        expect(isCatchableVariant(null)).toBe(true)
    })

    it('versões alternativas não contam para a Joey Quest', () => {
        const clans = [
            { name: 'OREBOUND' as const, order: 0, egg: '', essence: '' }
        ]
        const summary = buildJoeyQuestSummary(clans, [
            makePokemon({ name: 'marowak', joeyQuestClans: ['OREBOUND'] }),
            makePokemon({
                name: 'shiny marowak',
                variant: 'shiny',
                baseName: 'marowak',
                joeyQuestClans: ['OREBOUND']
            })
        ])
        expect(summary.totalPokemons).toBe(1)
    })
})
