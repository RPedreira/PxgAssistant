import { connect } from './connection/connection'
import { Pokemon, Group } from './models'
import { PokemonInterface, GroupInterface } from './interfaces'
import { config } from 'dotenv'
import { Types } from 'mongoose'

config({ path: '.env' })

connect()

export { Pokemon, Group, PokemonInterface, GroupInterface, Types }
