import { Schema } from 'mongoose'
import { CLAN_NAMES } from '@internal/shared'
import { ClanInterface } from '../interfaces'

const schema = new Schema<ClanInterface>({
    name: { type: String, required: true, unique: true, enum: CLAN_NAMES },
    order: { type: Number, required: true },
    egg: { type: String, required: true },
    essence: { type: String, required: true }
})

export default schema
