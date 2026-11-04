import { ClanName, Difficulty } from './types'

/**
 * Lista oficial da Joey Quest, conferida com o NPC Joey dentro do jogo.
 * Fonte complementar: https://wiki.pokexgames.com/index.php/Joey_Quest
 *
 * Fonte da verdade para o seed do banco (tools/scripts/seed-joey-quest.ts).
 */
export interface ClanDefinition {
    name: ClanName
    egg: string
    essence: string
    pokemons: string[]
}

export const JOEY_QUEST_CLANS: ClanDefinition[] = [
    {
        name: 'VOLCANIC',
        egg: 'Flame Egg',
        essence: 'Volcanic Essence',
        pokemons: ['darumaka', 'darmanitan', 'heatmor']
    },
    {
        name: 'SEAVELL',
        egg: 'Waterfall Egg',
        essence: 'Seavell Essence',
        pokemons: ['wingull', 'pelipper', 'cubchoo', 'beartic']
    },
    {
        name: 'OREBOUND',
        egg: 'Sand Egg',
        essence: 'Orebound Essence',
        pokemons: [
            'nosepass',
            'probopass',
            'hippopotas',
            'hippowdon',
            'drilbur',
            'excadrill',
            'dwebble',
            'crustle'
        ]
    },
    {
        name: 'NATURIA',
        egg: 'Sprout Egg',
        essence: 'Naturia Essence',
        pokemons: [
            'shroomish',
            'breloom',
            'dwebble',
            'crustle',
            'joltik',
            'galvantula',
            'ferroseed',
            'ferrothorn'
        ]
    },
    {
        name: 'GARDESTRIKE',
        egg: 'Champion Egg',
        essence: 'Gardestrike Essence',
        pokemons: ['breloom', 'ambipom', 'lickilicky', 'timburr', 'gurdurr']
    },
    {
        name: 'IRONHARD',
        egg: 'Smither Egg',
        essence: 'Ironhard Essence',
        pokemons: [
            'probopass',
            'ferroseed',
            'ferrothorn',
            'pawniard',
            'bisharp'
        ]
    },
    {
        name: 'RAIBOLT',
        egg: 'Eletrician Egg',
        essence: 'Raibolt Essence',
        pokemons: ['emolga', 'joltik', 'galvantula']
    },
    {
        name: 'WINGEON',
        egg: 'Falcon Egg',
        essence: 'Wingeon Essence',
        pokemons: [
            'wingull',
            'pelipper',
            'emolga',
            'axew',
            'fraxure',
            'haxorus'
        ]
    },
    {
        name: 'PSYCRAFT',
        egg: 'Brain Egg',
        essence: 'Psycraft Essence',
        pokemons: ['darmanitan']
    },
    {
        name: 'MALEFIC',
        egg: 'Spectre Egg',
        essence: 'Malefic Essence',
        pokemons: [
            'poochyena',
            'mightyena',
            'skorupi',
            'drapion',
            'pawniard',
            'bisharp'
        ]
    }
]

/** Dificuldade de captura de cada pokémon da quest. */
export const JOEY_QUEST_DIFFICULTY: Record<string, Difficulty> = {
    darumaka: 'EASY',
    darmanitan: 'HARD',
    heatmor: 'HARD',
    wingull: 'EASY',
    pelipper: 'HARD',
    cubchoo: 'EASY',
    beartic: 'HARD',
    shroomish: 'EASY',
    breloom: 'HARD',
    dwebble: 'EASY',
    crustle: 'HARD',
    joltik: 'EASY',
    galvantula: 'HARD',
    ferroseed: 'EASY',
    ferrothorn: 'HARD',
    ambipom: 'HARD',
    lickilicky: 'HARD',
    timburr: 'EASY',
    gurdurr: 'MEDIUM',
    nosepass: 'EASY',
    probopass: 'HARD',
    hippopotas: 'EASY',
    hippowdon: 'HARD',
    drilbur: 'EASY',
    excadrill: 'HARD',
    emolga: 'HARD',
    axew: 'EASY',
    fraxure: 'MEDIUM',
    haxorus: 'HARD',
    poochyena: 'EASY',
    mightyena: 'HARD',
    skorupi: 'EASY',
    drapion: 'HARD',
    pawniard: 'EASY',
    bisharp: 'HARD'
}

/** Recompensa entregue a cada captura, por dificuldade. */
export const CAPTURE_REWARDS: Record<Difficulty, string[]> = {
    EASY: [
        '2 Golden Key',
        '4 Silver Key',
        '10 Running Elixir',
        '3 Healing Elixir'
    ],
    MEDIUM: [
        '3 Golden Key',
        '4 Silver Key',
        '10 Running Elixir',
        '3 Healing Elixir'
    ],
    HARD: [
        '6 Golden Key',
        '6 Silver Key',
        '15 Running Elixir',
        '5 Healing Elixir',
        '5 Attack Elixir',
        '3 Bounty Elixir',
        "5 Speedster's Elixir"
    ]
}

/** Itens comuns a toda recompensa de clã (além do ovo e da essência). */
export const CLAN_REWARD_BASE = ['10 Golden Key', '10 Silver Key']
export const CLAN_REWARD_ESSENCE_AMOUNT = 100

export const FINAL_REWARDS = [
    'Four Leaf Clover',
    'Ultimate Catcher Outfit',
    'Master Ball',
    'Catcher Trophy'
]
