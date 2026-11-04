import { Pokemon } from '@internal/database'
import { PokemonDto, PokemonQuery } from '@internal/shared'
import { PokemonDoc, toPokemonDto } from './pokemon-mapper'
import { buildPokemonFilter, buildPokemonSort } from './pokemon-query'

export const PokemonService = {
    async list(query: PokemonQuery = {}): Promise<PokemonDto[]> {
        const docs = await Pokemon.find(buildPokemonFilter(query))
            .sort(buildPokemonSort(query))
            .lean<PokemonDoc[]>()
        return docs.map(toPokemonDto)
    },

    async findByName(name: string): Promise<PokemonDto | null> {
        const doc = await Pokemon.findOne({ name }).lean<PokemonDoc>()
        return doc ? toPokemonDto(doc) : null
    },

    async setCaught(name: string, caught: boolean): Promise<PokemonDto | null> {
        const doc = await Pokemon.findOneAndUpdate(
            { name },
            { $set: { caught } },
            { new: true }
        ).lean<PokemonDoc>()
        return doc ? toPokemonDto(doc) : null
    }
}
