import { Types } from 'mongoose'

type clanNames =
    | 'RAIBOLT'
    | 'SEAVELL'
    | 'VOLCANIC'
    | 'OREBOUND'
    | 'NATURIA'
    | 'GARDESTRIKE'
    | 'IRONHARD'
    | 'WINGEON'
    | 'PSYCRAFT'
    | 'MALEFIC'

export interface GroupInterface {
    clanName: clanNames
    pokemons: Types.ObjectId[]
    completed: boolean
}
