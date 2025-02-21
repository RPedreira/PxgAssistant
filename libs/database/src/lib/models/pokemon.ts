import mongoose from 'mongoose'
import { pokemonSchema } from '../schemas'
import { PokemonInterface } from '../interfaces'

class Pokemon {
    private static getModel() {
        return mongoose.model('pokemons', pokemonSchema)
    }

    static async find(
        filter: Record<string, unknown>
    ): Promise<PokemonInterface[] | null> {
        const PokemonModel = this.getModel()
        return PokemonModel.find(filter).lean<PokemonInterface[]>()
    }

    static async findOneAndUpdate(
        filter: Record<string, unknown>,
        update: Record<string, unknown>
    ): Promise<PokemonInterface | null> {
        const PokemonModel = this.getModel()
        return PokemonModel.findOneAndUpdate(filter, update, {
            new: true
        }).lean<PokemonInterface>()
    }
}

export default Pokemon
