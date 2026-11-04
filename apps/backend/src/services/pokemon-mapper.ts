import { PokemonDto, isCatchableVariant } from '@internal/shared'
import type { PokemonInterface } from '@internal/database'
import type { Types } from 'mongoose'

export type PokemonDoc = PokemonInterface & { _id: Types.ObjectId }

export function toPokemonDto(doc: PokemonDoc): PokemonDto {
    return {
        id: doc._id.toString(),
        number: doc.number,
        pokedexNumber: doc.pokedexNumber,
        name: doc.name,
        caught: doc.caught,
        types: doc.type,
        superWeakness: doc.superWeakness,
        weakness: doc.weakness,
        neutral: doc.neutral,
        resistance: doc.resistance,
        superResistance: doc.superResistance,
        immunity: doc.immunity,
        joeyQuestClans: doc.joeyQuestClans,
        joeyQuestDifficulty: doc.joeyQuestDifficulty ?? null,
        baseName: doc.baseName ?? null,
        variant: doc.variant ?? null,
        catchable: isCatchableVariant(doc.variant ?? null)
    }
}
