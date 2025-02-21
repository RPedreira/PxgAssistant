import { connect } from './connection/connection'
import { Pokemon, Group } from './models'
import { PokemonInterface, GroupInterface } from './interfaces'

connect()

export { Pokemon, Group, PokemonInterface, GroupInterface }
