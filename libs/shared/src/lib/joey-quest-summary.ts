import {
    ClanDto,
    ClanProgressDto,
    JoeyQuestSummaryDto,
    PokemonDto
} from './types'

/**
 * Monta o progresso da quest. "Clã completo" é sempre derivado do `caught` de
 * cada pokémon, então nunca fica dessincronizado. Usado no backend e no frontend.
 */
export function buildJoeyQuestSummary(
    clans: ClanDto[],
    pokemons: PokemonDto[]
): JoeyQuestSummaryDto {
    // Só formas base contam (shinies e outras versões não fazem parte da quest)
    const questPokemons = pokemons.filter(
        p => p.variant === null && p.joeyQuestClans.length > 0
    )
    const progress: ClanProgressDto[] = [...clans]
        .sort((a, b) => a.order - b.order)
        .map(clan => {
            const members = questPokemons.filter(p =>
                p.joeyQuestClans.includes(clan.name)
            )
            const caught = members.filter(p => p.caught).length
            return {
                name: clan.name,
                order: clan.order,
                egg: clan.egg,
                essence: clan.essence,
                total: members.length,
                caught,
                completed: members.length > 0 && caught === members.length,
                pokemons: members
            }
        })

    const completedClans = progress.filter(c => c.completed).length
    return {
        clans: progress,
        totalPokemons: questPokemons.length,
        caughtPokemons: questPokemons.filter(p => p.caught).length,
        completedClans,
        completed: progress.length > 0 && completedClans === progress.length
    }
}
