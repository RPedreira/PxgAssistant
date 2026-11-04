import { Clan, ClanInterface } from '@internal/database'
import {
    ClanName,
    ClanProgressDto,
    JoeyQuestSummaryDto,
    buildJoeyQuestSummary
} from '@internal/shared'
import { PokemonService } from './pokemon-service'

export const JoeyQuestService = {
    async summary(): Promise<JoeyQuestSummaryDto> {
        const [clans, pokemons] = await Promise.all([
            Clan.find({}, { _id: 0, __v: 0 }).lean<ClanInterface[]>(),
            PokemonService.list({ joeyQuest: true })
        ])
        return buildJoeyQuestSummary(clans, pokemons)
    },

    async clan(name: ClanName): Promise<ClanProgressDto | null> {
        const summary = await this.summary()
        return summary.clans.find(c => c.name === name) ?? null
    }
}
