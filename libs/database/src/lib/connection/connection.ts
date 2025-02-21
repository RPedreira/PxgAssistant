import mongoose from 'mongoose'

const { MONGODB_URI } = process.env

const connect = async () => {
    if (!MONGODB_URI) {
        throw new Error('MongoDB URI is not defined in environment variables')
    }
    await mongoose.connect(MONGODB_URI)
}

export { connect }
