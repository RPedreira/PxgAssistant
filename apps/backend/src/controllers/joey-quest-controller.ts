import { GroupInterface, Types } from '@internal/database'
import { JoeyQuestService } from '../services/joey-quest-service'
import { getJoeyQuestGroupResponse } from '../interfaces'

class JoeyQuestController {
    static async getJoeyQuestGroups(): Promise<GroupInterface[]> {
        return JoeyQuestService.getJoeyQuestGroups()
    }

    static async getJoeyQuestGroup(
        clanName: string,
        pokemons: Types.ObjectId[],
        completed: boolean
    ): Promise<getJoeyQuestGroupResponse> {
        return JoeyQuestService.getJoeyQuestGroup(clanName, pokemons, completed)
    }
}

export { JoeyQuestController }
