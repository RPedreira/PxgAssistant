import mongoose, { ConnectOptions } from 'mongoose'
import { config } from 'dotenv'

config({ path: '.env' })

export async function connect(
    uri = process.env['MONGODB_URI'],
    options?: ConnectOptions
) {
    if (!uri) {
        throw new Error(
            'MONGODB_URI não definida (crie um arquivo .env na raiz)'
        )
    }
    await mongoose.connect(uri, options)
}

export async function disconnect() {
    await mongoose.disconnect()
}
