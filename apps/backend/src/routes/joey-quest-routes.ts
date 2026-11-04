import { FastifyInstance } from 'fastify'
import { CLAN_NAMES, ClanName } from '@internal/shared'
import { JoeyQuestService } from '../services/joey-quest-service'
import { notFound } from '../errors'

export async function joeyQuestRoutes(app: FastifyInstance) {
    app.get('/joey-quest', async () => JoeyQuestService.summary())

    app.get<{ Params: { clan: string } }>(
        '/joey-quest/:clan',
        {
            schema: {
                params: {
                    type: 'object',
                    required: ['clan'],
                    properties: { clan: { type: 'string', enum: CLAN_NAMES } }
                }
            }
        },
        async request => {
            const clan = await JoeyQuestService.clan(
                request.params.clan as ClanName
            )
            return (
                clan ?? notFound(`Clã "${request.params.clan}" não encontrado`)
            )
        }
    )
}
