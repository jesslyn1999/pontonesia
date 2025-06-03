import {
    FileUploadService,
    convertToImageData,
    deleteUploadedFiles,
} from 'src/services/internal/fileUploadService';
import { ocrService } from '../internal/ocrService';
import { Model } from 'mongoose';
import { injectable } from 'inversify';
import { IParcelRepack, IParcelRepackDraft } from 'src/models/repack/parcel';

export interface CreateParcelData {
    trackingBarcode: Express.Multer.File;
    parcelImages: Express.Multer.File[];
    serialNumberText?: string;
    description?: string; // might include trackingBarcodeText
    category?: string;
    location?: string;
    createdBy?: string;
    updatedBy?: string;
}

export interface UpdateInventoryData {
    description?: string;
    category?: string;
    quantity?: number;
    location?: string;
    updatedBy?: string;
}

export interface InventorySearchParams {
    serialNumber?: string;
    category?: string;
    status?: string;
    createdBy?: string;
    page?: number;
    limit?: number;
}

@injectable()
export class ParcelReceiveService {
    constructor(
        private readonly parcelRepackModel: Model<IParcelRepack>,
        private readonly fileUploadService: FileUploadService
    ) {
        this.parcelRepackModel = parcelRepackModel;
        this.fileUploadService = fileUploadService;
    }
    async create(data: CreateParcelData): Promise<any> {
        try {
            const { trackingBarcode } = data;

            const barcodeUploadResult = await this.fileUploadService.uploadFile(
                trackingBarcode,
                {
                    providerName: 'local',
                }
            );

            const trackingBarcodeUrl = barcodeUploadResult.url;

            const parcelRepack = new this.parcelRepackModel({
                trackingBarcodeUrl: trackingBarcodeUrl,
                createdBy: data.createdBy,
                updatedBy: data.updatedBy,
            });

            await parcelRepack.save();

            const { parcelImages } = data;

            const fileUploadResults = await this.fileUploadService.uploadFiles(
                parcelImages,
                {
                    providerName: 'local',
                }
            );
            parcelRepack.parcelImageUrls = fileUploadResults.map(
                (result) => result.url
            );

            return parcelRepack.toJSON();
        } catch (error) {
            // Clean up uploaded files if database save fails
            // const filesToDelete = [
            //     data.serialNumberImage.path,
            //     ...data.itemImages.map((f) => f.path),
            // ];
            // deleteUploadedFiles(filesToDelete);
            throw new Error(
                `Failed to create inventory item: ${error.message}`
            );
        }
    }

    /*
    // READ - Get inventory items
    async getInventoryItems(
        params: InventorySearchParams = {}
    ): Promise<{ items: any[]; total: number; page: number; limit: number }> {
        try {
            const page = params.page || 1;
            const limit = params.limit || 10;
            const skip = (page - 1) * limit;

            // Build query
            const query: any = {};

            if (params.serialNumber) {
                query.serialNumber = {
                    $regex: params.serialNumber,
                    $options: 'i',
                };
            }
            if (params.category) {
                query.category = params.category;
            }
            if (params.status) {
                query.status = params.status;
            }
            if (params.createdBy) {
                query.createdBy = params.createdBy;
            }

            // Execute query with pagination
            const items = await Inventory.find(query)
                .skip(skip)
                .limit(limit)
                .sort({ createdAt: -1 });

            const total = await Inventory.countDocuments(query);

            return {
                items: items.map((item) => item.toJSON()),
                total,
                page,
                limit,
            };
        } catch (error) {
            throw new Error(
                `Failed to fetch inventory items: ${error.message}`
            );
        }
    }

    // READ - Get single inventory item by ID
    async getInventoryItemById(id: string): Promise<any> {
        try {
            const item = await Inventory.findById(id);
            if (!item) {
                throw new Error('Inventory item not found');
            }
            return item.toJSON();
        } catch (error) {
            throw new Error(`Failed to fetch inventory item: ${error.message}`);
        }
    }

    // READ - Search by serial number or image similarity
    async searchInventoryItems(searchTerm: string): Promise<any[]> {
        try {
            // Search by serial number (exact and partial matches)
            const serialNumberQuery = {
                $or: [
                    { serialNumber: searchTerm },
                    { serialNumber: { $regex: searchTerm, $options: 'i' } },
                    {
                        'ocrResult.extractedText': {
                            $regex: searchTerm,
                            $options: 'i',
                        },
                    },
                ],
            };

            const items = await Inventory.find(serialNumberQuery)
                .sort({ createdAt: -1 })
                .limit(20);

            return items.map((item) => item.toJSON());
        } catch (error) {
            throw new Error(
                `Failed to search inventory items: ${error.message}`
            );
        }
    }

    // UPDATE - Update inventory item
    async updateInventoryItem(
        id: string,
        data: UpdateInventoryData
    ): Promise<any> {
        try {
            const item = await Inventory.findById(id);
            if (!item) {
                throw new Error('Inventory item not found');
            }

            // Update fields
            if (data.description !== undefined)
                item.description = data.description;
            if (data.category !== undefined) item.category = data.category;
            if (data.quantity !== undefined) item.quantity = data.quantity;
            if (data.location !== undefined) item.location = data.location;
            if (data.updatedBy !== undefined) item.updatedBy = data.updatedBy;

            const updatedItem = await item.save();
            return updatedItem.toJSON();
        } catch (error) {
            throw new Error(
                `Failed to update inventory item: ${error.message}`
            );
        }
    }

    // DELETE - Delete inventory item
    async deleteInventoryItem(id: string): Promise<void> {
        try {
            const item = await Inventory.findById(id);
            if (!item) {
                throw new Error('Inventory item not found');
            }

            // Collect file paths for cleanup
            const filesToDelete: string[] = [];
            if (item.serialNumberImage?.path) {
                filesToDelete.push(item.serialNumberImage.path);
            }
            if (item.itemImages) {
                item.itemImages.forEach((img: ImageData) => {
                    if (img.path) filesToDelete.push(img.path);
                });
            }

            // Delete from database
            await Inventory.findByIdAndDelete(id);

            // Clean up files
            deleteUploadedFiles(filesToDelete);
        } catch (error) {
            throw new Error(
                `Failed to delete inventory item: ${error.message}`
            );
        }
    }

    // UTILITY - Process OCR asynchronously
    private async processOCRAsync(
        itemId: string,
        imagePath: string
    ): Promise<void> {
        try {
            console.log(`Starting OCR processing for item ${itemId}`);

            // Extract text from serial number image
            const ocrResult: OCRResult = await ocrService.extractSerialNumber(
                imagePath
            );

            // Update inventory item with OCR result
            const item = await Inventory.findById(itemId);
            if (item) {
                await item.updateOCRResult(ocrResult);
                console.log(
                    `OCR processing completed for item ${itemId}: ${ocrResult.extractedText}`
                );
            }
        } catch (error) {
            console.error(`OCR processing failed for item ${itemId}:`, error);

            // Mark item as failed
            const item = await Inventory.findById(itemId);
            if (item) {
                await item.markAsFailed(error.message);
            }
        }
    }

    // UTILITY - Reprocess OCR for an item
    async reprocessOCR(id: string, providerName?: string): Promise<any> {
        try {
            const item = await Inventory.findById(id);
            if (!item) {
                throw new Error('Inventory item not found');
            }

            if (!item.serialNumberImage?.path) {
                throw new Error(
                    'No serial number image found for OCR processing'
                );
            }

            // Reset status to pending
            item.status = 'pending';
            await item.save();

            // Process OCR
            await this.processOCRAsync(id, item.serialNumberImage.path);

            // Return updated item
            const updatedItem = await Inventory.findById(id);
            return updatedItem?.toJSON();
        } catch (error) {
            throw new Error(`Failed to reprocess OCR: ${error.message}`);
        }
    }

    // UTILITY - Get inventory statistics
    async getInventoryStats(): Promise<any> {
        try {
            const totalItems = await Inventory.countDocuments();
            const pendingItems = await Inventory.countDocuments({
                status: 'pending',
            });
            const processedItems = await Inventory.countDocuments({
                status: 'processed',
            });
            const failedItems = await Inventory.countDocuments({
                status: 'failed',
            });

            const categoryCounts = await Inventory.aggregate([
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]);

            return {
                total: totalItems,
                pending: pendingItems,
                processed: processedItems,
                failed: failedItems,
                categories: categoryCounts,
            };
        } catch (error) {
            throw new Error(
                `Failed to fetch inventory statistics: ${error.message}`
            );
        }
    }
        */
}
