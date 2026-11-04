import mongoose from 'mongoose'
import { clanSchema, pokemonSchema } from '../schemas'
import { ClanInterface, PokemonInterface } from '../interfaces'

export const Pokemon = mongoose.model<PokemonInterface>(
    'Pokemon',
    pokemonSchema,
    'pokemons'
)

/** Clãs da Joey Quest. A coleção mantém o nome histórico "joeyquests". */
export const Clan = mongoose.model<ClanInterface>(
    'Clan',
    clanSchema,
    'joeyquests'
)
