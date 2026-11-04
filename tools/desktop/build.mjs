/**
 * Monta o app desktop em dist/apps/desktop:
 *   main.js    processo principal do Electron (apps/desktop/src/main.ts)
 *   server.js  API + servidor do frontend, com todas as dependências embutidas
 *   frontend/  build de produção do Angular (rode `nx build frontend` antes)
 *   icon.png, package.json
 *
 * Uso: node tools/desktop/build.mjs   (ou npm run desktop:build)
 */
import { build } from 'esbuild'
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const out = path.join(root, 'dist/apps/desktop')
const frontend = path.join(root, 'dist/apps/frontend/browser')

if (!existsSync(path.join(frontend, 'index.html'))) {
    console.error(
        'Build do frontend não encontrado. Rode antes: npx nx build frontend'
    )
    process.exit(1)
}

rmSync(out, { recursive: true, force: true })
mkdirSync(out, { recursive: true })

const common = {
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    minify: true,
    legalComments: 'none',
    logLevel: 'warning'
}

await build({
    ...common,
    entryPoints: [path.join(root, 'apps/desktop/src/main.ts')],
    outfile: path.join(out, 'main.js'),
    tsconfig: path.join(root, 'apps/desktop/tsconfig.app.json'),
    external: ['electron', './server.js']
})

await build({
    ...common,
    entryPoints: [path.join(root, 'apps/backend/src/server.ts')],
    outfile: path.join(out, 'server.js'),
    tsconfig: path.join(root, 'apps/backend/tsconfig.app.json'),
    // Dependências opcionais do driver do MongoDB que não usamos
    external: [
        'kerberos',
        'snappy',
        'socks',
        'aws4',
        'gcp-metadata',
        'mongodb-client-encryption',
        '@mongodb-js/zstd',
        '@aws-sdk/credential-providers'
    ]
})

cpSync(frontend, path.join(out, 'frontend'), { recursive: true })
cpSync(
    path.join(root, 'apps/desktop/assets/icon.png'),
    path.join(out, 'icon.png')
)

writeFileSync(
    path.join(out, 'package.json'),
    JSON.stringify(
        {
            name: 'pxg-assistant',
            productName: 'PXG Assistant',
            version: '1.0.0',
            description: 'Pokedex e Joey Quest do PokeXGames',
            author: 'Rafael',
            main: 'main.js'
        },
        null,
        4
    )
)

console.log(`App desktop montado em ${path.relative(root, out)}`)
