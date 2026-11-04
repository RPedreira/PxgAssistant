import { Schema } from 'mongoose'
import {
    CLAN_NAMES,
    DIFFICULTIES,
    POKEMON_TYPES,
    POKEMON_VARIANTS
} from '@internal/shared'
import { PokemonInterface } from '../interfaces'

const typeList = {
    type: [{ type: String, enum: POKEMON_TYPES }],
    required: true,
    default: []
}

const schema = new Schema<PokemonInterface>({
    number: { type: Number, required: true },
    pokedexNumber: { type: String, required: true },
    name: { type: String, required: true, unique: true },
    caught: { type: Boolean, required: true, default: false },
    joeyQuestClans: {
        type: [{ type: String, enum: CLAN_NAMES }],
        required: true,
        default: []
    },
    joeyQuestDifficulty: {
        type: String,
        enum: [...DIFFICULTIES, null],
        default: null
    },
    /** Forma base (null) ou versão alternativa (shiny, regional...). */
    variant: {
        type: String,
        enum: [...POKEMON_VARIANTS, null],
        default: null
    },
    /** Nas versões alternativas, o nome da forma base. */
    baseName: { type: String, default: null },
    type: typeList,
    superWeakness: typeList,
    weakness: typeList,
    neutral: typeList,
    resistance: typeList,
    superResistance: typeList,
    immunity: typeList
})

schema.index({ number: 1 })
schema.index({ caught: 1 })
schema.index({ type: 1 })
schema.index({ joeyQuestClans: 1 })
schema.index({ baseName: 1 })
schema.index({ variant: 1 })

export default schema
