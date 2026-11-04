import { connect } from '@internal/database'
import { buildApp } from './app'

const PORT = Number(process.env['PORT'] ?? 8200)

async function start() {
    const app = await buildApp({ logger: true })
    try {
        await connect()
        await app.listen({ port: PORT })
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

start()
