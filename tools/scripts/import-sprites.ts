/**
 * Importa as sprites para apps/frontend/public/sprites, normalizando os nomes
 * com `spriteSlug` (o mesmo usado pelo frontend para montar as URLs):
 *   npm run sprites:import -- "C:/caminho/para/Icons"
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync } from 'fs'
import { extname, join, parse } from 'path'
import { CLAN_NAMES, POKEMON_TYPES, spriteSlug } from '@internal/shared'

const source = process.argv[2]
if (!source || !existsSync(source)) {
    console.error('Uso: npm run sprites:import -- "<pasta com as sprites>"')
    process.exit(1)
}

const target = join(__dirname, '../../apps/frontend/public/sprites')
const types = new Set(POKEMON_TYPES.map(t => spriteSlug(t)))
const clans = new Set(CLAN_NAMES.map(c => spriteSlug(c)))
const counts: Record<string, number> = {}

for (const file of readdirSync(source)) {
    const ext = extname(file).toLowerCase()
    if (!['.png', '.gif'].includes(ext)) continue
    const slug = spriteSlug(parse(file).name)
    const folder = types.has(slug)
        ? 'types'
        : clans.has(slug)
        ? 'clans'
        : ext === '.gif'
        ? 'misc'
        : 'pokemon'
    mkdirSync(join(target, folder), { recursive: true })
    copyFileSync(join(source, file), join(target, folder, slug + ext))
    counts[folder] = (counts[folder] ?? 0) + 1
}

console.log(counts)
