/**
 * Migração/seed idempotente do banco. Pode ser rodado quantas vezes quiser:
 *   npm run db:seed
 *
 * - Preenche `number` (numérico) a partir de `pokedexNumber`.
 * - Aplica os dados da wiki: efetividades e versões alternativas (seed-wiki.ts).
 * - Reaplica a lista oficial da Joey Quest (clãs e dificuldades) nos pokémons.
 * - Recria a coleção de clãs (1 documento por clã, sem duplicatas).
 * - Sincroniza os índices.
 * O progresso (`caught`) nunca é alterado.
 */
import { Clan, Pokemon, connect, disconnect } from '@internal/database'
import { JOEY_QUEST_CLANS, JOEY_QUEST_DIFFICULTY } from '@internal/shared'
import { seedWiki } from './seed-wiki'

/** No PXG Minun e Plusle são um único pokémon; usamos o número do Plusle. */
const POKEDEX_NUMBER_FIXES: Record<string, string> = {
    'minun and plusle': '#311'
}

async function main() {
    await connect()

    // Correções pontuais nos dados coletados.
    for (const [name, pokedexNumber] of Object.entries(POKEDEX_NUMBER_FIXES)) {
        await Pokemon.collection.updateOne(
            { name },
            { $set: { pokedexNumber } }
        )
    }

    const numbered = await Pokemon.collection.updateMany({}, [
        {
            $set: {
                number: {
                    $toInt: { $trim: { input: '$pokedexNumber', chars: '# ' } }
                }
            }
        }
    ])
    console.log(`number: ${numbered.modifiedCount} pokémons atualizados`)

    await seedWiki()

    const membership = new Map<string, string[]>()
    for (const clan of JOEY_QUEST_CLANS) {
        for (const name of clan.pokemons) {
            membership.set(name, [...(membership.get(name) ?? []), clan.name])
        }
    }

    const names = [...membership.keys()]
    const found = await Pokemon.collection.distinct('name', {
        name: { $in: names },
        variant: null
    })
    const missing = names.filter(n => !found.includes(n))
    if (missing.length) {
        throw new Error(
            `Pokémons da quest ausentes no banco: ${missing.join(', ')}`
        )
    }
    const noDifficulty = names.filter(n => !JOEY_QUEST_DIFFICULTY[n])
    if (noDifficulty.length) {
        throw new Error(`Sem dificuldade definida: ${noDifficulty.join(', ')}`)
    }

    await Pokemon.collection.updateMany(
        { name: { $nin: names } },
        { $set: { joeyQuestClans: [], joeyQuestDifficulty: null } }
    )
    await Pokemon.collection.bulkWrite(
        names.map(name => ({
            updateOne: {
                filter: { name },
                update: {
                    $set: {
                        joeyQuestClans: membership.get(name),
                        joeyQuestDifficulty: JOEY_QUEST_DIFFICULTY[name]
                    }
                }
            }
        }))
    )
    console.log(
        `joey quest: ${names.length} pokémons distintos em ${JOEY_QUEST_CLANS.length} clãs`
    )

    await Clan.collection.deleteMany({})
    await Clan.insertMany(
        JOEY_QUEST_CLANS.map((clan, order) => ({
            name: clan.name,
            order,
            egg: clan.egg,
            essence: clan.essence
        }))
    )
    console.log(`clãs: ${JOEY_QUEST_CLANS.length} documentos`)

    await Pokemon.syncIndexes()
    await Clan.syncIndexes()
    console.log('índices sincronizados')
}

main()
    .catch(err => {
        console.error(err)
        process.exitCode = 1
    })
    .finally(() => disconnect())
