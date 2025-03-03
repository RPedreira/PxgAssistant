import mongoose from 'mongoose'
import { groupSchema } from '../schemas'
import { GroupInterface } from '../interfaces'

class Group {
    private static getModel() {
        return mongoose.model('groups', groupSchema)
    }

    static async find(): Promise<GroupInterface[] | null> {
        const GroupModel = this.getModel()
        return GroupModel.find().lean<GroupInterface[]>()
    }

    static async findOne(
        filter: Record<string, unknown>
    ): Promise<GroupInterface | null> {
        const GroupModel = this.getModel()
        return GroupModel.find(filter).lean<GroupInterface>()
    }

    static async findOneAndUpdate(
        filter: Record<string, unknown>,
        update: Record<string, unknown>
    ): Promise<GroupInterface | null> {
        const GroupModel = this.getModel()
        return GroupModel.findOneAndUpdate(filter, update, {
            new: true
        }).lean<GroupInterface>()
    }
}

export default Group
