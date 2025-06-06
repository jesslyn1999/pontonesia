import logger from 'src/libs/logger';
import {
    Document,
    Model,
    FilterQuery,
    UpdateQuery,
    QueryOptions,
} from 'mongoose';

export interface IBaseRepository<T extends Document> {
    findById(id: string): Promise<T | null>;
    findOne(filter: FilterQuery<T>): Promise<T | null>;
    find(filter?: FilterQuery<T>, options?: QueryOptions): Promise<T[]>;
    insert(data: Partial<T> | T): Promise<T>;
    create(data: Partial<T>): T;
    update(id: string, data: UpdateQuery<T>): Promise<T | null>;
    updateOne(filter: FilterQuery<T>, data: UpdateQuery<T>): Promise<T | null>;
    updateMany(
        filter: FilterQuery<T>,
        data: UpdateQuery<T>
    ): Promise<{ matchedCount: number; modifiedCount: number }>;
    delete(id: string): Promise<boolean>;
    deleteOne(filter: FilterQuery<T>): Promise<boolean>;
    deleteMany(filter: FilterQuery<T>): Promise<{ deletedCount: number }>;
    count(filter?: FilterQuery<T>): Promise<number>;
    exists(filter: FilterQuery<T>): Promise<boolean>;
    findWithPagination(
        filter: FilterQuery<T>,
        page: number,
        limit: number,
        sort?: any
    ): Promise<{
        data: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
}

export abstract class BaseRepository<T extends Document>
    implements IBaseRepository<T>
{
    protected model: Model<T>;

    constructor(model: Model<T>) {
        console.log('HEYYYY2');
        console.log(model);
        this.model = model;
    }

    async findById(id: string): Promise<T | null> {
        try {
            return await this.model.findById(id).exec();
        } catch (error) {
            throw new Error(`Error finding document by ID: ${error}`);
        }
    }

    async findOne(filter: FilterQuery<T>): Promise<T | null> {
        try {
            return await this.model.findOne(filter).exec();
        } catch (error) {
            throw new Error(`Error finding document: ${error}`);
        }
    }

    async find(
        filter: FilterQuery<T> = {},
        options: QueryOptions = {}
    ): Promise<T[]> {
        try {
            return await this.model.find(filter, null, options).exec();
        } catch (error) {
            throw new Error(`Error finding documents: ${error}`);
        }
    }

    async insert(data: Partial<T> | T): Promise<T> {
        try {
            // Check if data is already a Mongoose document (duck typing)
            if (
                data &&
                typeof data === 'object' &&
                'save' in data &&
                typeof (data as any).save === 'function'
            ) {
                // It's already a document, just save it
                const document = data as T;
                return await document.save();
            } else {
                // It's raw data, create new document and save
                const document = new this.model(data as Partial<T>);
                return await document.save();
            }
        } catch (error) {
            logger.error(error);
            throw new Error(`Error creating document: ${error}`);
        }
    }

    create(data: Partial<T>): T {
        try {
            const document = new this.model(data);
            return document;
        } catch (error) {
            throw new Error(`Error creating document directly: ${error}`);
        }
    }

    async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
        try {
            return await this.model
                .findByIdAndUpdate(id, data, { new: true })
                .exec();
        } catch (error) {
            throw new Error(`Error updating document: ${error}`);
        }
    }

    async updateOne(
        filter: FilterQuery<T>,
        data: UpdateQuery<T>
    ): Promise<T | null> {
        try {
            return await this.model
                .findOneAndUpdate(filter, data, { new: true })
                .exec();
        } catch (error) {
            throw new Error(`Error updating document: ${error}`);
        }
    }

    async updateMany(
        filter: FilterQuery<T>,
        data: UpdateQuery<T>
    ): Promise<{ matchedCount: number; modifiedCount: number }> {
        try {
            const result = await this.model.updateMany(filter, data).exec();
            return {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
            };
        } catch (error) {
            throw new Error(`Error updating documents: ${error}`);
        }
    }

    async delete(id: string): Promise<boolean> {
        try {
            const result = await this.model.findByIdAndDelete(id).exec();
            return result !== null;
        } catch (error) {
            throw new Error(`Error deleting document: ${error}`);
        }
    }

    async deleteOne(filter: FilterQuery<T>): Promise<boolean> {
        try {
            const result = await this.model.findOneAndDelete(filter).exec();
            return result !== null;
        } catch (error) {
            throw new Error(`Error deleting document: ${error}`);
        }
    }

    async deleteMany(
        filter: FilterQuery<T>
    ): Promise<{ deletedCount: number }> {
        try {
            const result = await this.model.deleteMany(filter).exec();
            return { deletedCount: result.deletedCount };
        } catch (error) {
            throw new Error(`Error deleting documents: ${error}`);
        }
    }

    async count(filter: FilterQuery<T> = {}): Promise<number> {
        try {
            return await this.model.countDocuments(filter).exec();
        } catch (error) {
            throw new Error(`Error counting documents: ${error}`);
        }
    }

    async exists(filter: FilterQuery<T>): Promise<boolean> {
        try {
            const result = await this.model.exists(filter).exec();
            return result !== null;
        } catch (error) {
            throw new Error(`Error checking document existence: ${error}`);
        }
    }

    async findWithPagination(
        filter: FilterQuery<T> = {},
        page = 1,
        limit = 10,
        sort: any = { createdAt: -1 }
    ): Promise<{
        data: T[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }> {
        try {
            const skip = (page - 1) * limit;

            const [data, total] = await Promise.all([
                this.model
                    .find(filter)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit)
                    .exec(),
                this.model.countDocuments(filter).exec(),
            ]);

            const totalPages = Math.ceil(total / limit);

            return {
                data,
                total,
                page,
                limit,
                totalPages,
            };
        } catch (error) {
            throw new Error(
                `Error finding documents with pagination: ${error}`
            );
        }
    }
}
