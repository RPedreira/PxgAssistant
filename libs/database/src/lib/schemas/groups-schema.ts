import { Schema } from 'mongoose'
import { GroupInterface } from '../interfaces'

const clanNames = [
    'RAIBOLT',
    'SEAVELL',
    'VOLCANIC',
    'OREBOUND',
    'NATURIA',
    'GARDESTRIKE',
    'IRONHARD',
    'WINGEON',
    'PSYCRAFT',
    'MALEFIC'
]

const schema = new Schema<GroupInterface>({
    clanName: {
        type: String,
        required: true,
        enum: clanNames
    },
    pokemons: {
        type: [Schema.Types.ObjectId],
        required: true,
        default: []
    },
    completed: {
        type: Boolean,
        required: true,
        default: false
    }
})

export default schema
