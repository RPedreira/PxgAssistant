/**
 * Aplica no banco os dados importados da wiki (tools/data/pxg-wiki.json).
 * Idempotente; roda dentro do `npm run db:seed`.
 *
 * - Formas base: tipos e efetividades passam a ser os da wiki.
 * - Versões alternativas: cria/atualiza uma entrada por versão (mesmo número
 *   da forma base) e remove as que saíram da wiki.
 * - Capturas (`caught`) são preservadas. Megas e TM/TR ficam sempre como não
 *   capturados, porque são forjados e não capturados.
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { Pokemon, connect, disconnect } from '@internal/database'
import { isCatchableVariant } from '@internal/shared'
import type { WikiData } from './import-wiki'

const DATA = path.resolve(__dirname, '../data/pxg-wiki.json')

export async function seedWiki() {
    const data: WikiData = JSON.parse(readFileSync(DATA, 'utf8'))

    const baseOps = Object.entries(data.base).map(([name, b]) => ({
        updateOne: {
            filter: { name, variant: null },
            update: { $set: { type: b.types, ...b.effects } }
        }
    }))
    const baseResult = await Pokemon.collection.bulkWrite(baseOps)
    console.log(`wiki: ${baseResult.modifiedCount} formas base atualizadas`)

    const bases = await Pokemon.collection
        .find(
            { variant: null },
            { projection: { name: 1, pokedexNumber: 1, number: 1 } }
        )
        .toArray()
    const byName = new Map(bases.map(b => [b['name'] as string, b]))

    const missingBase = data.variants.filter(v => !byName.has(v.baseName))
    if (missingBase.length) {
        throw new Error(
            `Versões sem forma base no banco: ${missingBase
                .map(v => v.name)
                .join(', ')}`
        )
    }

    const variantOps = data.variants.map(v => {
        const baseDoc = byName.get(v.baseName) as Record<string, unknown>
        const catchable = isCatchableVariant(v.variant)
        return {
            updateOne: {
                filter: { name: v.name },
                update: {
                    $set: {
                        variant: v.variant,
                        baseName: v.baseName,
                        pokedexNumber: baseDoc['pokedexNumber'],
                        number: baseDoc['number'],
                        type: v.types,
                        ...v.effects,
                        joeyQuestClans: [],
                        joeyQuestDifficulty: null,
                        ...(catchable ? {} : { caught: false })
                    },
                    ...(catchable ? { $setOnInsert: { caught: false } } : {})
                },
                upsert: true
            }
        }
    })
    const variantResult = await Pokemon.collection.bulkWrite(variantOps)
    const removed = await Pokemon.collection.deleteMany({
        variant: { $ne: null },
        name: { $nin: data.variants.map(v => v.name) }
    })
    console.log(
        `wiki: ${data.variants.length} versões alternativas ` +
            `(${variantResult.upsertedCount} novas, ${variantResult.modifiedCount} atualizadas, ${removed.deletedCount} removidas)`
    )
}

if (require.main === module) {
    connect()
        .then(seedWiki)
        .catch(err => {
            console.error(err)
            process.exitCode = 1
        })
        .finally(() => disconnect())
}
