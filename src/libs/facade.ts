import mongoose, { Model, Document, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose'

interface IFacade<T extends Document> {
    create(data: Partial<T>): Promise<T>
    find(query?: FilterQuery<T>, options?: QueryOptions<T>): Promise<T[]>
    findOne(query?: FilterQuery<T>, options?: QueryOptions<T>): Promise<T | null>
    findById(id: string | mongoose.Types.ObjectId, options?: QueryOptions<T>): Promise<T | null>
    updateOne(query: FilterQuery<T>, data: UpdateQuery<T>, options?: QueryOptions<T>): Promise<{ matchedCount: number; modifiedCount: number }>
    deleteOne(query: FilterQuery<T>, options?: QueryOptions<T>): Promise<{ deletedCount: number }>
}

class Facade<T extends Document> implements IFacade<T> {
    private model: Model<T>

    constructor(name: string, schema: mongoose.Schema) {
        this.model = mongoose.model<T>(name, schema)
    }

    create(data: Partial<T>): Promise<T> {
        const model = new this.model(data)
        return model.save()
    }

    find(query: FilterQuery<T> = {}, options?: QueryOptions<T>): Promise<T[]> {
        return this.model
            .find(query, null, options)
            .exec()
    }

    findOne(query: FilterQuery<T> = {}, options?: QueryOptions<T>): Promise<T | null> {
        return this.model
            .findOne(query, null, options)
            .exec()
    }

    findById(id: string | mongoose.Types.ObjectId, options?: QueryOptions<T>): Promise<T | null> {
        return this.model
            .findById(id, null, options)
            .exec()
    }

    updateOne(query: FilterQuery<T>, data: UpdateQuery<T>, options?: QueryOptions<T>): Promise<{ matchedCount: number; modifiedCount: number }> {
        return this.model
            .updateOne(query, data, options)
            .exec()
    }

    deleteOne(query: FilterQuery<T>, options?: QueryOptions<T>): Promise<{ deletedCount: number }> {
        return this.model
            .deleteOne(query, options)
            .exec()
    }
}

export default Facade 