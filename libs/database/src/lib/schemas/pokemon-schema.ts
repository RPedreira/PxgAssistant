import { Schema } from 'mongoose'
import { PokemonInterface } from '../interfaces'

const pokemonTypes = [
    'NORMAL',
    'FIRE',
    'WATER',
    'GRASS',
    'ELECTRIC',
    'ICE',
    'FIGHTING',
    'POISON',
    'GROUND',
    'FLYING',
    'PSYCHIC',
    'BUG',
    'ROCK',
    'GHOST',
    'DARK',
    'DRAGON',
    'STEEL',
    'FAIRY',
    'CRYSTAL'
]

const schema = new Schema<PokemonInterface>({
    pokedexNumber: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    caught: {
        type: Boolean,
        required: true,
        default: false
    },
    type: {
        type: [String],
        required: true
    },
    superWeakness: {
        type: [String],
        required: true,
        enum: pokemonTypes,
        default: []
    },
    weakness: {
        type: [String],
        required: true,
        enum: pokemonTypes,
        default: []
    },
    neutral: {
        type: [String],
        required: true,
        enum: pokemonTypes,
        default: []
    },
    resistance: {
        type: [String],
        required: true,
        enum: pokemonTypes,
        default: []
    },
    immunity: {
        type: [String],
        required: true,
        enum: pokemonTypes,
        default: []
    }
})

export default schema
