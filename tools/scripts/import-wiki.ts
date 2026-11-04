/**
 * Importa da wiki oficial do PXG (wiki.pokexgames.com, API MediaWiki) os dados
 * da Pokedex. Só lê a wiki e grava arquivos; não mexe no banco:
 *
 *   npm run wiki:import
 *
 * - Efetividades e tipos das formas base (a wiki é a fonte da verdade).
 * - Versões alternativas, a partir da seção "Outras Versões" de cada página:
 *   shiny, regionais, especiais, megas e tiers (TM)/(TR).
 * - Miniaturas das versões alternativas em apps/frontend/public/sprites/pokemon.
 *
 * Saída:
 *   tools/data/pxg-wiki.json         dados usados pelo `npm run db:seed`
 *   tools/data/pxg-wiki-report.md    o que mudou e o que não foi possível ler
 */
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'node:fs'
import path from 'node:path'
import { Pokemon, connect, disconnect } from '@internal/database'
import {
    POKEMON_TYPES,
    PokemonType,
    PokemonVariant,
    spriteSlug
} from '@internal/shared'

const API = 'https://wiki.pokexgames.com/api.php'
const HEADERS = {
    'User-Agent': 'PxgAssistant/1.0 (importador pessoal da Pokedex)'
}
const ROOT = path.resolve(__dirname, '../..')
const DATA_DIR = path.join(ROOT, 'tools/data')
const SPRITES = path.join(ROOT, 'apps/frontend/public/sprites/pokemon')

/** Títulos que não seguem a regra de capitalização. */
const TITLE_OVERRIDES: Record<string, string> = {
    'ho-oh': 'Ho-oh',
    "farfetch'd": "Farfetch'D",
    'minun and plusle': 'Minun and Plusle'
}

const EFFECT_KEYS = [
    'superWeakness',
    'weakness',
    'neutral',
    'resistance',
    'superResistance',
    'immunity'
] as const
type EffectKey = (typeof EFFECT_KEYS)[number]
type Effects = Record<EffectKey, PokemonType[]>

/** Rótulos da seção de efetividade, sem acentos nem espaços (pt e en). */
const EFFECT_LABELS: Record<string, EffectKey> = {
    muitoefetivo: 'superWeakness',
    superefetivo: 'superWeakness',
    supereffective: 'superWeakness',
    veryeffective: 'superWeakness',
    efetivo: 'weakness',
    effective: 'weakness',
    normal: 'neutral',
    neutro: 'neutral',
    inefetivo: 'resistance',
    poucoefetivo: 'resistance',
    ineffective: 'resistance',
    muitoinefetivo: 'superResistance',
    superinefetivo: 'superResistance',
    superineffective: 'superResistance',
    veryineffective: 'superResistance',
    nulo: 'immunity',
    null: 'immunity',
    imune: 'immunity'
}

function effectKey(label: string): EffectKey | undefined {
    const clean = strip(label)
        .toLowerCase()
        .replace(/\bcontra\b.*$/, '') // "Super efetivo contra Light Abra"
        .replace(/^.*\be imune a\b.*$/, 'imune') // "Light Abra é imune a"
        .replace(/[^a-z]/g, '')
    return EFFECT_LABELS[clean]
}

/** Links de "Outras Versões" com erro de digitação na wiki. */
const FORM_TITLE_FIXES: Record<string, string> = {
    Teecko: 'Treecko',
    'Baby Teecko': 'Baby Treecko',
    LightAbra: 'Light Abra',
    'Mega Elektross': 'Mega Eelektross',
    'Mega Alakaza': 'Mega Alakazam',
    SRaichu: 'Shiny Raichu',
    'Shiny Rotom (Mow)': 'Shiny Rotom (mow)'
}

/**
 * Tabela de tipos oficial (Gen 6+), só para conferir a wiki: páginas muito
 * diferentes dela costumam ser erro de copiar e colar (ex.: Spinarak com a
 * efetividade do Bulbasaur). Cristal é exclusivo do PXG e fica de fora.
 */
const CHART: Partial<
    Record<PokemonType, Partial<Record<PokemonType, number>>>
> = {
    NORMAL: { ROCK: 0.5, GHOST: 0, STEEL: 0.5 },
    FIRE: {
        FIRE: 0.5,
        WATER: 0.5,
        GRASS: 2,
        ICE: 2,
        BUG: 2,
        ROCK: 0.5,
        DRAGON: 0.5,
        STEEL: 2
    },
    WATER: { FIRE: 2, WATER: 0.5, GRASS: 0.5, GROUND: 2, ROCK: 2, DRAGON: 0.5 },
    ELECTRIC: {
        WATER: 2,
        ELECTRIC: 0.5,
        GRASS: 0.5,
        GROUND: 0,
        FLYING: 2,
        DRAGON: 0.5
    },
    GRASS: {
        FIRE: 0.5,
        WATER: 2,
        GRASS: 0.5,
        POISON: 0.5,
        GROUND: 2,
        FLYING: 0.5,
        BUG: 0.5,
        ROCK: 2,
        DRAGON: 0.5,
        STEEL: 0.5
    },
    ICE: {
        FIRE: 0.5,
        WATER: 0.5,
        GRASS: 2,
        ICE: 0.5,
        GROUND: 2,
        FLYING: 2,
        DRAGON: 2,
        STEEL: 0.5
    },
    FIGHTING: {
        NORMAL: 2,
        ICE: 2,
        POISON: 0.5,
        FLYING: 0.5,
        PSYCHIC: 0.5,
        BUG: 0.5,
        ROCK: 2,
        GHOST: 0,
        DARK: 2,
        STEEL: 2,
        FAIRY: 0.5
    },
    POISON: {
        GRASS: 2,
        POISON: 0.5,
        GROUND: 0.5,
        ROCK: 0.5,
        GHOST: 0.5,
        STEEL: 0,
        FAIRY: 2
    },
    GROUND: {
        FIRE: 2,
        ELECTRIC: 2,
        GRASS: 0.5,
        POISON: 2,
        FLYING: 0,
        BUG: 0.5,
        ROCK: 2,
        STEEL: 2
    },
    FLYING: {
        ELECTRIC: 0.5,
        GRASS: 2,
        FIGHTING: 2,
        BUG: 2,
        ROCK: 0.5,
        STEEL: 0.5
    },
    PSYCHIC: { FIGHTING: 2, POISON: 2, PSYCHIC: 0.5, DARK: 0, STEEL: 0.5 },
    BUG: {
        FIRE: 0.5,
        GRASS: 2,
        FIGHTING: 0.5,
        POISON: 0.5,
        FLYING: 0.5,
        PSYCHIC: 2,
        GHOST: 0.5,
        DARK: 2,
        STEEL: 0.5,
        FAIRY: 0.5
    },
    ROCK: {
        FIRE: 2,
        ICE: 2,
        FIGHTING: 0.5,
        GROUND: 0.5,
        FLYING: 2,
        BUG: 2,
        STEEL: 0.5
    },
    GHOST: { NORMAL: 0, PSYCHIC: 2, GHOST: 2, DARK: 0.5 },
    DRAGON: { DRAGON: 2, STEEL: 0.5, FAIRY: 0 },
    DARK: { FIGHTING: 0.5, PSYCHIC: 2, GHOST: 2, DARK: 0.5, FAIRY: 0.5 },
    STEEL: {
        FIRE: 0.5,
        WATER: 0.5,
        ELECTRIC: 0.5,
        ICE: 2,
        ROCK: 2,
        STEEL: 0.5,
        FAIRY: 2
    },
    FAIRY: {
        FIRE: 0.5,
        FIGHTING: 2,
        POISON: 0.5,
        DRAGON: 2,
        DARK: 2,
        STEEL: 0.5
    }
}

/** Quantos tipos de ataque a efetividade contradiz a tabela oficial (fraco x neutro x resiste). */
function chartMismatch(types: PokemonType[], effects: Effects) {
    if (!types.length || types.includes('CRYSTAL')) return 0
    const bucket = (m: number) => (m > 1 ? 1 : m < 1 ? -1 : 0)
    const listed = (t: PokemonType) =>
        effects.superWeakness.includes(t) || effects.weakness.includes(t)
            ? 1
            : effects.resistance.includes(t) ||
              effects.superResistance.includes(t) ||
              effects.immunity.includes(t)
            ? -1
            : 0
    return POKEMON_TYPES.filter(t => t !== 'CRYSTAL').filter(attack => {
        const m = types.reduce(
            (acc, def) => acc * (CHART[attack]?.[def] ?? 1),
            1
        )
        return bucket(m) !== listed(attack)
    }).length
}

/** A partir daqui a página é considerada suspeita. */
const SUSPICIOUS = 4

/**
 * Formas base em que o banco está certo e a wiki errada (conferido no jogo):
 * voadores são imunes a Terra (Wingull, Pelipper, Gligar) e Cranidos tem
 * super fraqueza a Terra.
 */
const KEEP_DB = new Set(['wingull', 'pelipper', 'gligar', 'cranidos'])

/**
 * Imunidades por tipo, como nos jogos (o PXG segue a mesma regra): tipo do
 * pokémon -> tipos de ataque a que ele é imune. A wiki às vezes troca a
 * imunidade por resistência (ex.: Tyranitar e Psíquico), então isso é corrigido.
 */
const TYPE_IMMUNITIES: Partial<Record<PokemonType, PokemonType[]>> = {
    NORMAL: ['GHOST'],
    GHOST: ['NORMAL', 'FIGHTING'],
    FLYING: ['GROUND'],
    GROUND: ['ELECTRIC'],
    DARK: ['PSYCHIC'],
    STEEL: ['POISON'],
    FAIRY: ['DRAGON']
}

/** Garante as imunidades do tipo; devolve o que precisou ser corrigido. */
function applyTypeImmunities(types: PokemonType[], effects: Effects): string[] {
    const fixed: string[] = []
    for (const attack of types.flatMap(t => TYPE_IMMUNITIES[t] ?? [])) {
        if (effects.immunity.includes(attack)) continue
        const from =
            EFFECT_KEYS.find(k => effects[k].includes(attack)) ??
            'nenhuma lista'
        for (const k of EFFECT_KEYS)
            effects[k] = effects[k].filter(t => t !== attack)
        effects.immunity.push(attack)
        fixed.push(`${attack} (estava em ${from})`)
    }
    return fixed
}

/** Versões conferidas no jogo: a wiki está certa mesmo fugindo da tabela de tipos. */
const CONFIRMED = new Set(['Shiny Aron'])

const PT_TYPES: Record<string, PokemonType> = {
    FOGO: 'FIRE',
    AGUA: 'WATER',
    PLANTA: 'GRASS',
    GRAMA: 'GRASS',
    ELETRICO: 'ELECTRIC',
    GELO: 'ICE',
    LUTADOR: 'FIGHTING',
    VENENOSO: 'POISON',
    TERRA: 'GROUND',
    VOADOR: 'FLYING',
    PSIQUICO: 'PSYCHIC',
    INSETO: 'BUG',
    PEDRA: 'ROCK',
    FANTASMA: 'GHOST',
    SOMBRIO: 'DARK',
    DRAGAO: 'DRAGON',
    METALICO: 'STEEL',
    FADA: 'FAIRY',
    CRISTAL: 'CRYSTAL',
    ELETRIC: 'ELECTRIC'
}

interface WikiPage {
    title: string
    text: string
}

interface ParsedPage {
    types: PokemonType[]
    effects: Effects | null
    forms: { title: string; icon: string }[]
}

export interface WikiBase {
    title: string
    types: PokemonType[]
    effects: Effects
}

export interface WikiVariant {
    name: string
    title: string
    baseName: string
    variant: PokemonVariant
    types: PokemonType[]
    effects: Effects
    /** De onde veio a efetividade. */
    effectsSource: 'wiki' | 'base'
}

export interface WikiData {
    source: string
    fetchedAt: string
    base: Record<string, WikiBase>
    variants: WikiVariant[]
}

const issues: string[] = []
const suspicious: string[] = []
const immunityFixes: string[] = []
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const strip = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
const cleanTitle = (s: string) =>
    s
        .replace(/^\|?link=/, '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
const nameOf = (title: string) => title.toLowerCase()

/** "mr.mime" -> "Mr.Mime" (mesma regra do frontend). */
const titleOf = (name: string) =>
    TITLE_OVERRIDES[name] ??
    name.replace(
        /(^|[\s.\-(])([a-z])/g,
        (_, a: string, b: string) => a + b.toUpperCase()
    )

async function api(params: Record<string, string>) {
    const url = new URL(API)
    for (const [k, v] of Object.entries({
        format: 'json',
        formatversion: '2',
        ...params
    })) {
        url.searchParams.set(k, v)
    }
    for (let attempt = 1; ; attempt++) {
        try {
            const res = await fetch(url, { headers: HEADERS })
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            return await res.json()
        } catch (error) {
            if (attempt >= 4) throw error
            await sleep(1500 * attempt)
        }
    }
}

/** Busca o wikitext de várias páginas (seguindo redirects). Chave: título pedido. */
async function fetchPages(
    titles: string[]
): Promise<Map<string, WikiPage | null>> {
    const result = new Map<string, WikiPage | null>()
    for (let i = 0; i < titles.length; i += 10) {
        const batch = titles.slice(i, i + 10)
        const json = await api({
            action: 'query',
            prop: 'revisions',
            rvprop: 'content',
            rvslots: 'main',
            redirects: '1',
            titles: batch.join('|')
        })
        const alias = new Map<string, string>()
        for (const n of json.query.normalized ?? []) alias.set(n.to, n.from)
        for (const r of json.query.redirects ?? [])
            alias.set(r.to, alias.get(r.from) ?? r.from)
        for (const page of json.query.pages) {
            const requested = alias.get(page.title) ?? page.title
            result.set(
                requested,
                page.missing
                    ? null
                    : {
                          title: page.title,
                          text: page.revisions?.[0]?.slots?.main?.content ?? ''
                      }
            )
        }
        for (const t of batch) if (!result.has(t)) result.set(t, null)
        await sleep(300)
    }
    return result
}

function parseTypeList(raw: string, context: string): PokemonType[] {
    const tokens = raw
        .replace(/<[^>]+>/g, ' ')
        .split(/,|\/|\s+e\s+|\s+and\s+|\s+ou\s+/i)
        .map(t =>
            strip(t)
                .replace(/[^A-Za-z]/g, '')
                .toUpperCase()
        )
        .filter(Boolean)
    const types: PokemonType[] = []
    for (const token of tokens) {
        if (token === 'NONE') continue
        const type = (POKEMON_TYPES as readonly string[]).includes(token)
            ? (token as PokemonType)
            : PT_TYPES[token]
        if (type) {
            if (!types.includes(type)) types.push(type)
        } else {
            issues.push(`${context}: tipo desconhecido "${token}"`)
        }
    }
    return types
}

function section(text: string, heading: RegExp) {
    const start = text.search(heading)
    if (start < 0) return ''
    const rest = text.slice(start).replace(heading, '')
    const end = rest.search(/\n==[^=]/)
    return end < 0 ? rest : rest.slice(0, end)
}

function parsePage(page: WikiPage): ParsedPage {
    const element =
        page.text.match(
            /(?:'''|<b>)\s*Elementos?\s*:?\s*(?:'''|<\/b>)\s*:?\s*([^\n]+)/i
        )?.[1] ?? ''
    const types = parseTypeList(
        element.split(/<br/i)[0],
        `${page.title} (elemento)`
    )
    if (!types.length) issues.push(`${page.title}: elemento não encontrado`)

    let effects: Effects | null = null
    const effSection = section(page.text, /==\s*'*\s*Efetividades?\s*'*\s*==/i)
    if (effSection) {
        effects = {
            superWeakness: [],
            weakness: [],
            neutral: [],
            resistance: [],
            superResistance: [],
            immunity: []
        }
        for (const m of effSection.matchAll(
            /'''\s*([^'\n:]+?)\s*:?\s*'''\s*:?\s*([^\n]*)/g
        )) {
            const key = effectKey(m[1])
            if (!key) {
                issues.push(
                    `${page.title}: rótulo de efetividade desconhecido "${m[1]}"`
                )
                continue
            }
            effects[key].push(
                ...parseTypeList(m[2], `${page.title} (efetividade)`)
            )
        }
        const listed = new Set(EFFECT_KEYS.flatMap(k => effects?.[k] ?? []))
        const missing = POKEMON_TYPES.filter(t => !listed.has(t))
        if (missing.length > 4) {
            // Seção fora do padrão (ex.: Kecleon): não dá para confiar
            issues.push(
                `${page.title}: efetividade ilegível (faltam ${missing.length} tipos)`
            )
            effects = null
        } else if (missing.length) {
            effects.neutral.push(...missing)
            issues.push(
                `${page.title}: efetividade sem ${missing.join(
                    ', '
                )} (considerados neutros)`
            )
        }
    }

    const forms = [
        ...section(
            page.text,
            /==\s*'*\s*Outras Vers(õ|o)es\s*'*\s*==/i
        ).matchAll(/\[\[Arquivo:([^|\]]+)\|link=([^\]]*)\]\]/g)
    ]
        .map(m => ({
            icon: m[1].trim(),
            title: FORM_TITLE_FIXES[cleanTitle(m[2])] ?? cleanTitle(m[2])
        }))
        .filter(f => f.title)

    return { types, effects, forms }
}

function classify(title: string): PokemonVariant {
    if (/\((TM|TR)\)/i.test(title)) return 'tier'
    if (/\bMega\b/i.test(title)) return 'mega'
    if (/^Shiny\b/i.test(title)) return 'shiny'
    if (/^(Alolan|Galarian|Hisuian|Paldean)\b/i.test(title)) return 'regional'
    return 'special'
}

/** Forma base de uma variante: o nome base mais longo contido no título. */
function resolveBase(title: string, foundOn: string, baseNames: string[]) {
    const lower = ` ${nameOf(title).replace(/[()]/g, ' ')} `
    const match = baseNames
        .filter(n => lower.includes(` ${n} `))
        .sort((a, b) => b.length - a.length)[0]
    return match ?? foundOn
}

async function downloadIcons(
    icons: Map<string, string[]>,
    baseSprite: (name: string) => string
) {
    const files = [...icons.keys()]
    const urls = new Map<string, string>()
    for (let i = 0; i < files.length; i += 40) {
        const batch = files.slice(i, i + 40)
        const json = await api({
            action: 'query',
            prop: 'imageinfo',
            iiprop: 'url',
            titles: batch.map(f => `Arquivo:${f}`).join('|')
        })
        const alias = new Map<string, string>()
        for (const n of json.query.normalized ?? []) alias.set(n.to, n.from)
        for (const page of json.query.pages) {
            const url = page.imageinfo?.[0]?.url
            if (url)
                urls.set(
                    (alias.get(page.title) ?? page.title).replace(
                        /^Arquivo:/,
                        ''
                    ),
                    url
                )
        }
        await sleep(300)
    }

    let downloaded = 0
    let fallback = 0
    mkdirSync(SPRITES, { recursive: true })
    for (const [file, names] of icons) {
        const url = urls.get(file)
        let bytes: Buffer | null = null
        if (url && /\.png$/i.test(file)) {
            try {
                const res = await fetch(url, { headers: HEADERS })
                if (res.ok) bytes = Buffer.from(await res.arrayBuffer())
            } catch {
                bytes = null
            }
            await sleep(150)
        }
        for (const [name, base] of names.map(n => n.split('\u0000'))) {
            const target = path.join(SPRITES, `${spriteSlug(name)}.png`)
            if (bytes) {
                writeFileSync(target, bytes)
                downloaded++
            } else if (existsSync(baseSprite(base))) {
                copyFileSync(baseSprite(base), target)
                fallback++
                issues.push(
                    `${name}: miniatura "${file}" indisponível, usando a da forma base`
                )
            }
        }
    }
    return { downloaded, fallback }
}

function diffBase(name: string, db: Record<string, unknown>, wiki: WikiBase) {
    const changes: string[] = []
    const fields: [string, PokemonType[], PokemonType[]][] = [
        ['tipos', (db['type'] as PokemonType[]) ?? [], wiki.types],
        ...EFFECT_KEYS.map(
            k =>
                [k, (db[k] as PokemonType[]) ?? [], wiki.effects[k]] as [
                    string,
                    PokemonType[],
                    PokemonType[]
                ]
        )
    ]
    for (const [field, before, after] of fields) {
        const a = [...before].sort().join(', ')
        const b = [...after].sort().join(', ')
        if (a !== b) changes.push(`  - ${field}: [${a}] → [${b}]`)
    }
    return changes.length ? `- **${name}**\n${changes.join('\n')}` : null
}

async function main() {
    await connect()
    const docs = await Pokemon.collection
        .find(
            { variant: null },
            { projection: { _id: 0, caught: 0, joeyQuestClans: 0 } }
        )
        .toArray()
    await disconnect()
    const baseNames = docs.map(d => d['name'] as string)
    console.log(`banco: ${baseNames.length} formas base`)

    // 1. Páginas base
    const titles = new Map(baseNames.map(n => [n, titleOf(n)]))
    const basePages = await fetchPages([...titles.values()])
    const base: Record<string, WikiBase> = {}
    const pending = new Map<string, { icon: string; foundOn: string }>()
    const baseSet = new Set(baseNames)

    for (const name of baseNames) {
        const page = basePages.get(titles.get(name) as string)
        if (!page) {
            issues.push(
                `${name}: página base não encontrada na wiki (mantido como está no banco)`
            )
            continue
        }
        const parsed = parsePage(page)
        const doc = docs.find(d => d['name'] === name) as Record<
            string,
            PokemonType[]
        >
        const types = parsed.types.length ? parsed.types : doc['type']
        if (!parsed.types.length)
            issues.push(
                `${name}: sem elemento na wiki, usando os tipos do banco`
            )
        if (KEEP_DB.has(name)) {
            suspicious.push(
                `- **${name}**: conferido no jogo, o banco está certo e a wiki não. **Mantido o banco.**`
            )
        } else if (!parsed.effects) {
            issues.push(
                `${name}: página sem efetividade legível (mantido como está no banco)`
            )
        } else {
            const dbEffects = Object.fromEntries(
                EFFECT_KEYS.map(k => [k, doc[k] ?? []])
            ) as Effects
            const wikiScore = chartMismatch(types, parsed.effects)
            const dbScore = chartMismatch(doc['type'], dbEffects)
            if (wikiScore >= SUSPICIOUS && dbScore < wikiScore) {
                suspicious.push(
                    `- **${name}** (${types.join(
                        '/'
                    )}): a wiki contradiz a tabela de tipos em ${wikiScore} tipos, o banco em ${dbScore}. **Mantido o banco.**`
                )
            } else {
                const fixed = applyTypeImmunities(types, parsed.effects)
                if (fixed.length)
                    immunityFixes.push(
                        `- **${name}** (${types.join(
                            '/'
                        )}): imune a ${fixed.join(', ')}`
                    )
                base[name] = {
                    title: page.title,
                    types,
                    effects: parsed.effects
                }
            }
        }
        for (const form of parsed.forms) {
            const formName = nameOf(form.title)
            if (
                formName === name ||
                baseSet.has(formName) ||
                pending.has(form.title)
            )
                continue
            pending.set(form.title, { icon: form.icon, foundOn: name })
        }
    }
    console.log(
        `wiki: ${Object.keys(base).length} formas base lidas, ${
            pending.size
        } versões alternativas listadas`
    )

    // 2. Páginas das versões alternativas (e versões listadas só nelas)
    const variants: WikiVariant[] = []
    const icons = new Map<string, string[]>()
    const seen = new Set<string>()
    let queue = [...pending.keys()]
    for (let round = 0; round < 3 && queue.length; round++) {
        const pages = await fetchPages(queue)
        const next: string[] = []
        for (const title of queue) {
            seen.add(title)
            const info = pending.get(title) as { icon: string; foundOn: string }
            const page = pages.get(title)
            if (!page) {
                issues.push(
                    `${title}: listado em "Outras Versões" de ${info.foundOn}, mas a página não existe`
                )
                continue
            }
            const parsed = parsePage(page)
            const baseName = resolveBase(page.title, info.foundOn, baseNames)
            const baseDoc = docs.find(d => d['name'] === baseName)
            const baseTypes =
                base[baseName]?.types ??
                (baseDoc?.['type'] as PokemonType[]) ??
                []
            const name = nameOf(page.title)
            if (baseSet.has(name) || variants.some(v => v.name === name))
                continue

            let effects = parsed.effects
            let effectsSource: WikiVariant['effectsSource'] = 'wiki'
            const types = parsed.types.length ? parsed.types : baseTypes
            if (!effects) {
                const sameTypes =
                    [...types].sort().join() === [...baseTypes].sort().join()
                const baseEffects =
                    base[baseName]?.effects ??
                    (baseDoc
                        ? (Object.fromEntries(
                              EFFECT_KEYS.map(k => [k, baseDoc[k] ?? []])
                          ) as Effects)
                        : null)
                if (sameTypes && baseEffects) {
                    effects = baseEffects
                    effectsSource = 'base'
                    issues.push(
                        `${page.title}: sem efetividade na wiki; mesmos tipos da forma base, usando a dela`
                    )
                } else {
                    issues.push(
                        `${page.title}: sem efetividade na wiki e tipos diferentes da base (ficou vazia)`
                    )
                    effects = {
                        superWeakness: [],
                        weakness: [],
                        neutral: [],
                        resistance: [],
                        superResistance: [],
                        immunity: []
                    }
                }
            }

            const score = chartMismatch(types, effects)
            if (score >= SUSPICIOUS && !CONFIRMED.has(page.title)) {
                const sameTypes =
                    [...types].sort().join() === [...baseTypes].sort().join()
                const baseEffects =
                    base[baseName]?.effects ??
                    (baseDoc
                        ? (Object.fromEntries(
                              EFFECT_KEYS.map(k => [k, baseDoc[k] ?? []])
                          ) as Effects)
                        : null)
                if (
                    sameTypes &&
                    baseEffects &&
                    chartMismatch(baseTypes, baseEffects) < score
                ) {
                    effects = baseEffects
                    effectsSource = 'base'
                    suspicious.push(
                        `- ${page.title} (${types.join(
                            '/'
                        )}): a wiki contradiz a tabela de tipos em ${score} tipos. **Usada a efetividade da forma base** (mesmos tipos).`
                    )
                } else {
                    suspicious.push(
                        `- ${page.title} (${types.join(
                            '/'
                        )}): a wiki contradiz a tabela de tipos em ${score} tipos (importado assim mesmo)`
                    )
                }
            }
            // Cópia: a efetividade pode ter vindo da forma base
            effects = structuredClone(effects)
            const fixed = applyTypeImmunities(types, effects)
            if (fixed.length)
                immunityFixes.push(
                    `- ${page.title} (${types.join('/')}): imune a ${fixed.join(
                        ', '
                    )}`
                )
            variants.push({
                name,
                title: page.title,
                baseName,
                variant: classify(page.title),
                types,
                effects,
                effectsSource
            })
            icons.set(info.icon, [
                ...(icons.get(info.icon) ?? []),
                `${name}\u0000${baseName}`
            ])

            for (const form of parsed.forms) {
                const formName = nameOf(form.title)
                if (
                    baseSet.has(formName) ||
                    seen.has(form.title) ||
                    pending.has(form.title)
                )
                    continue
                pending.set(form.title, { icon: form.icon, foundOn: baseName })
                next.push(form.title)
            }
        }
        queue = next
    }

    // 3. Miniaturas
    const { downloaded, fallback } = await downloadIcons(icons, b =>
        path.join(SPRITES, `${spriteSlug(b)}.png`)
    )

    // 4. Saída
    variants.sort(
        (a, b) =>
            a.baseName.localeCompare(b.baseName) || a.name.localeCompare(b.name)
    )
    const data: WikiData = {
        source: 'https://wiki.pokexgames.com',
        fetchedAt: new Date().toISOString(),
        base,
        variants
    }
    mkdirSync(DATA_DIR, { recursive: true })
    writeFileSync(
        path.join(DATA_DIR, 'pxg-wiki.json'),
        JSON.stringify(data, null, 1) + '\n'
    )

    const byKind = variants.reduce<Record<string, number>>(
        (acc, v) => ({ ...acc, [v.variant]: (acc[v.variant] ?? 0) + 1 }),
        {}
    )
    const diffs = docs
        .map(d =>
            base[d['name']] ? diffBase(d['name'], d, base[d['name']]) : null
        )
        .filter((d): d is string => !!d)
    const report = [
        '# Importação da wiki do PXG',
        '',
        `Gerado em ${data.fetchedAt} a partir de ${data.source}.`,
        '',
        '## Resumo',
        '',
        `- Formas base lidas: ${Object.keys(base).length} de ${
            baseNames.length
        }`,
        `- Versões alternativas: ${variants.length} (${Object.entries(byKind)
            .map(([k, n]) => `${k}: ${n}`)
            .join(', ')})`,
        `- Miniaturas: ${downloaded} baixadas da wiki, ${fallback} usando a da forma base`,
        `- Formas base que mudam com a wiki: ${diffs.length}`,
        '',
        '## Formas base que mudam (banco → wiki)',
        '',
        ...(diffs.length ? diffs : ['Nenhuma.']),
        '',
        '## Imunidades de tipo corrigidas',
        '',
        'O PXG segue os jogos: Normal é imune a Fantasma, Fantasma a Normal e Lutador, Voador a Terra, Terra a Elétrico, Sombrio a Psíquico, Metálico a Venenoso e Fada a Dragão.',
        '',
        ...(immunityFixes.length ? immunityFixes : ['Nenhuma.']),
        '',
        '## Efetividades suspeitas',
        '',
        'Comparadas com a tabela de tipos oficial. Na forma base, quando o banco está mais coerente, ele é mantido.',
        '',
        ...(suspicious.length ? suspicious : ['Nenhuma.']),
        '',
        '## Avisos',
        '',
        ...(issues.length
            ? [...new Set(issues)].map(i => `- ${i}`)
            : ['Nenhum.']),
        ''
    ].join('\n')
    writeFileSync(path.join(DATA_DIR, 'pxg-wiki-report.md'), report)

    console.log(`versões alternativas: ${variants.length}`, byKind)
    console.log(`miniaturas: ${downloaded} baixadas, ${fallback} da forma base`)
    console.log(
        `formas base que mudam: ${diffs.length} · imunidades corrigidas: ${immunityFixes.length} · ` +
            `suspeitas: ${suspicious.length} · avisos: ${new Set(issues).size}`
    )
    console.log('-> tools/data/pxg-wiki.json e tools/data/pxg-wiki-report.md')
}

main().catch(err => {
    console.error(err)
    process.exitCode = 1
})
