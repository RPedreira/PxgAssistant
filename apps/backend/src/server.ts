import { AddressInfo } from 'node:net'
import { connect, disconnect } from '@internal/database'
import { buildApp } from './app'

export interface StartServerOptions {
    mongodbUri: string
    /** Pasta com o build do frontend (servida junto com a API). */
    staticDir: string
    /** 0 = porta livre escolhida pelo sistema. */
    port?: number
}

export interface RunningServer {
    url: string
    close(): Promise<void>
}

/**
 * Sobe API + frontend num único servidor local (127.0.0.1). Usado pelo app
 * desktop, que carrega este módulo dentro do próprio Electron: não precisa de
 * Node instalado na máquina.
 */
export async function startServer({
    mongodbUri,
    staticDir,
    port = 0
}: StartServerOptions): Promise<RunningServer> {
    // Falha rápido se o MongoDB não estiver rodando (o padrão espera 30s)
    await connect(mongodbUri, { serverSelectionTimeoutMS: 5000 })

    const app = await buildApp({ logger: { level: 'warn' } }, { staticDir })
    await app.listen({ host: '127.0.0.1', port })
    const { port: actualPort } = app.server.address() as AddressInfo

    return {
        url: `http://127.0.0.1:${actualPort}`,
        async close() {
            await app.close()
            await disconnect()
        }
    }
}
