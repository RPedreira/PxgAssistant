import {
    Pokemon,
    Group,
    PokemonInterface,
    GroupInterface
} from '@internal/database'

class PokedexService {
    static async getAllPokemons() {
        return await Pokemon.find({}, { pokedexNumber: 1 })
    }
}

export { PokedexService }
