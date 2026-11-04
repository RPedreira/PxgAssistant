/**
 * Processo principal do app desktop (Electron).
 *
 * 1. Lê a configuração (%APPDATA%/PXG Assistant/config.json).
 * 2. Sobe API + frontend num servidor local dentro do próprio Electron
 *    (server.js, gerado a partir de apps/backend/src/server.ts).
 * 3. Abre a janela apontando para esse servidor.
 *
 * Se o MongoDB não estiver acessível, mostra um aviso em vez de uma tela vazia.
 */
import { app, BrowserWindow, Menu, dialog, shell } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

interface RunningServer {
    url: string
    close(): Promise<void>
}

interface ServerModule {
    startServer(options: {
        mongodbUri: string
        staticDir: string
        port?: number
    }): Promise<RunningServer>
}

interface DesktopConfig {
    mongodbUri: string
}

const DEFAULT_CONFIG: DesktopConfig = {
    mongodbUri: 'mongodb://127.0.0.1:27017/PokeXGames'
}

const ICON = path.join(__dirname, 'icon.png')

let server: RunningServer | null = null
let mainWindow: BrowserWindow | null = null

function configPath() {
    return path.join(app.getPath('userData'), 'config.json')
}

/** Cria o config.json com os valores padrão na primeira execução. */
function loadConfig(): DesktopConfig {
    const file = configPath()
    if (!existsSync(file)) {
        mkdirSync(path.dirname(file), { recursive: true })
        writeFileSync(file, JSON.stringify(DEFAULT_CONFIG, null, 4))
    }
    let saved: Partial<DesktopConfig> = {}
    try {
        saved = JSON.parse(readFileSync(file, 'utf8'))
    } catch {
        // Arquivo inválido: segue com o padrão
    }
    return {
        mongodbUri:
            process.env['MONGODB_URI'] ||
            saved.mongodbUri ||
            DEFAULT_CONFIG.mongodbUri
    }
}

function createWindow(url: string) {
    mainWindow = new BrowserWindow({
        width: 1320,
        height: 880,
        minWidth: 380,
        minHeight: 500,
        title: 'PXG Assistant',
        icon: ICON,
        backgroundColor: '#12151c',
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true
        }
    })

    mainWindow.once('ready-to-show', () => mainWindow?.show())

    // Links externos abrem no navegador, não dentro do app
    mainWindow.webContents.setWindowOpenHandler(({ url: target }) => {
        void shell.openExternal(target)
        return { action: 'deny' }
    })
    mainWindow.webContents.on('will-navigate', (event, target) => {
        if (!target.startsWith(url)) {
            event.preventDefault()
            void shell.openExternal(target)
        }
    })

    mainWindow.on('closed', () => (mainWindow = null))
    void mainWindow.loadURL(url)
}

async function start() {
    const config = loadConfig()
    // require em tempo de execução: server.js é um bundle separado, ao lado deste arquivo
    const { startServer } = require('./server.js') as ServerModule

    try {
        server = await startServer({
            mongodbUri: config.mongodbUri,
            staticDir: path.join(__dirname, 'frontend')
        })
    } catch (error) {
        const choice = dialog.showMessageBoxSync({
            type: 'error',
            title: 'PXG Assistant',
            message: 'Não foi possível conectar ao MongoDB',
            detail:
                `Verifique se o MongoDB está rodando em:\n${config.mongodbUri}\n\n` +
                `Para usar outro endereço, edite o arquivo:\n${configPath()}\n\n` +
                `Detalhe: ${
                    error instanceof Error ? error.message : String(error)
                }`,
            buttons: ['Fechar', 'Abrir configuração'],
            defaultId: 0,
            cancelId: 0
        })
        if (choice === 1) {
            shell.showItemInFolder(configPath())
        }
        app.quit()
        return
    }

    createWindow(server.url)
}

// Uma instância só: abrir o atalho de novo foca a janela existente
if (!app.requestSingleInstanceLock()) {
    app.quit()
} else {
    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
    })

    app.whenReady().then(() => {
        Menu.setApplicationMenu(null)
        void start()
    })

    app.on('window-all-closed', () => app.quit())

    let closing = false
    app.on('before-quit', event => {
        if (!server || closing) return
        // Fecha o servidor e a conexão com o Mongo antes de sair
        event.preventDefault()
        closing = true
        server
            .close()
            .catch(() => undefined)
            .finally(() => {
                server = null
                app.quit()
            })
    })
}
