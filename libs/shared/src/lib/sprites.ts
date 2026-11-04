/**
 * Converte um nome (pokémon, tipo ou clã) no nome de arquivo da sprite.
 * Ex.: "Mr.Mime" -> "mr-mime", "Flabébé" -> "flabebe", "Farfetch'd" -> "farfetch-d".
 */
export function spriteSlug(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}
