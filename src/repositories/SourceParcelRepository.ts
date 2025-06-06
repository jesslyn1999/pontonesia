import { FilterQuery } from 'mongoose';
import { BaseRepository, IBaseRepository } from './BaseRepository';
import {
    SourceParcelModel,
    ISourceParcel,
    OCRResult,
} from '../models/SourceParcel';
import { injectable } from 'inversify';

export interface ISourceParcelRepository
    extends IBaseRepository<ISourceParcel> {
    getStatsByStatus(): Promise<{ status: string; count: number }[]>;
    getStatsByChannel(): Promise<{ channel: string; count: number }[]>;
}

@injectable()
export class SourceParcelRepository
    extends BaseRepository<ISourceParcel>
    implements ISourceParcelRepository
{
    constructor() {
        console.log('HEYYYY');
        console.log(SourceParcelModel);
        super(SourceParcelModel);
    }
    async findByStatus(status: string): Promise<ISourceParcel[]> {
        try {
            return await this.find({ status });
        } catch (error) {
            throw new Error(`Error finding parcels by status: ${error}`);
        }
    }

    async findByChannel(channel: string): Promise<ISourceParcel[]> {
        try {
            return await this.find({ channel });
        } catch (error) {
            throw new Error(`Error finding parcels by channel: ${error}`);
        }
    }
    async updateOCRResult(
        id: string,
        ocrResult: OCRResult
    ): Promise<ISourceParcel | null> {
        try {
            const updateData = {
                ocrResult,
                trackingNumber: ocrResult.extractedText,
                status: 'processed',
                updatedAt: new Date(),
            };
            return await this.update(id, updateData);
        } catch (error) {
            throw new Error(`Error updating OCR result: ${error}`);
        }
    }

    async markAsProcessed(id: string): Promise<ISourceParcel | null> {
        try {
            return await this.update(id, {
                status: 'processed',
                updatedAt: new Date(),
            });
        } catch (error) {
            throw new Error(`Error marking parcel as processed: ${error}`);
        }
    }

    async findByDateRange(
        startDate: Date,
        endDate: Date
    ): Promise<ISourceParcel[]> {
        try {
            const filter: FilterQuery<ISourceParcel> = {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            };
            return await this.find(filter);
        } catch (error) {
            throw new Error(`Error finding parcels by date range: ${error}`);
        }
    }
    async getStatsByStatus(): Promise<{ status: string; count: number }[]> {
        try {
            const stats = await this.model.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        status: '$_id',
                        count: 1,
                        _id: 0,
                    },
                },
                {
                    $sort: { status: 1 },
                },
            ]);
            return stats;
        } catch (error) {
            throw new Error(`Error getting stats by status: ${error}`);
        }
    }

    async getStatsByChannel(): Promise<{ channel: string; count: number }[]> {
        try {
            const stats = await this.model.aggregate([
                {
                    $match: { channel: { $ne: null } },
                },
                {
                    $group: {
                        _id: '$channel',
                        count: { $sum: 1 },
                    },
                },
                {
                    $project: {
                        channel: '$_id',
                        count: 1,
                        _id: 0,
                    },
                },
                {
                    $sort: { channel: 1 },
                },
            ]);
            return stats;
        } catch (error) {
            throw new Error(`Error getting stats by channel: ${error}`);
        }
    }

    // Additional utility methods specific to SourceParcel
    async findWithImages(): Promise<ISourceParcel[]> {
        try {
            const filter: FilterQuery<ISourceParcel> = {
                parcelImageUrls: { $exists: true, $ne: [] },
            };
            return await this.find(filter);
        } catch (error) {
            throw new Error(`Error finding parcels with images: ${error}`);
        }
    }

    async findWithoutTrackingNumber(): Promise<ISourceParcel[]> {
        try {
            const filter: FilterQuery<ISourceParcel> = {
                $or: [
                    { trackingNumber: null },
                    { trackingNumber: '' },
                    { trackingNumber: { $exists: false } },
                ],
            };
            return await this.find(filter);
        } catch (error) {
            throw new Error(
                `Error finding parcels without tracking number: ${error}`
            );
        }
    }

    async findByQuantityRange(
        minQuantity: number,
        maxQuantity: number
    ): Promise<ISourceParcel[]> {
        try {
            const filter: FilterQuery<ISourceParcel> = {
                quantity: {
                    $gte: minQuantity,
                    $lte: maxQuantity,
                },
            };
            return await this.find(filter);
        } catch (error) {
            throw new Error(
                `Error finding parcels by quantity range: ${error}`
            );
        }
    }

    async findRecentParcels(days = 7): Promise<ISourceParcel[]> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            return await this.findByDateRange(startDate, new Date());
        } catch (error) {
            throw new Error(`Error finding recent parcels: ${error}`);
        }
    }
}
