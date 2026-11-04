/**
 * Hook afterPack do electron-builder (mesma solução do CreditManager).
 *
 * `win.signAndEditExecutable: false` evita baixar o pacote winCodeSign, cujo
 * arquivo tem symlinks de macOS que falham ao extrair no Windows sem o Modo
 * Desenvolvedor. Em troca, o electron-builder deixa de gravar o ícone e as
 * informações de versão no .exe, então fazemos isso aqui com o rcedit, antes
 * de o instalador NSIS ser montado.
 */
const path = require('path')
const rcedit = require('rcedit')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * O antivírus do Windows às vezes segura o .exe recém-extraído e o rcedit
 * falha com "Unable to commit changes". Tenta de novo algumas vezes.
 */
async function rceditWithRetry(exePath, options, attempts = 5) {
    for (let attempt = 1; ; attempt++) {
        try {
            return await rcedit(exePath, options)
        } catch (error) {
            if (attempt >= attempts) throw error
            console.log(
                `  • afterPack: rcedit falhou (tentativa ${attempt}), tentando de novo...`
            )
            await sleep(1500 * attempt)
        }
    }
}

exports.default = async function afterPack(context) {
    if (context.electronPlatformName !== 'win32') return

    const { appInfo, projectDir } = context.packager
    const exePath = path.join(
        context.appOutDir,
        `${appInfo.productFilename}.exe`
    )

    await rceditWithRetry(exePath, {
        icon: path.join(projectDir, 'apps', 'desktop', 'assets', 'icon.ico'),
        'file-version': appInfo.version,
        'product-version': appInfo.version,
        'version-string': {
            ProductName: appInfo.productName,
            FileDescription: appInfo.productName,
            CompanyName: appInfo.companyName || 'Rafael',
            LegalCopyright: `Copyright © ${new Date().getFullYear()}`,
            OriginalFilename: `${appInfo.productFilename}.exe`
        }
    })

    console.log(`  • afterPack: ícone aplicado em ${path.basename(exePath)}`)
}
