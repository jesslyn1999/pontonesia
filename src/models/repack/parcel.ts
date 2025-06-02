import { Schema, model } from 'ottoman';

// Interface for image data
interface ImageData {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    path: string;
    uploadedAt: Date;
}

// Interface for OCR result
interface OCRResult {
    extractedText: string;
    confidence: number;
    processedAt: Date;
    ocrProvider: string;
}

const parcelRepackSchema = new Schema(
    {
        trackingNumber: {
            type: String,
            index: true,
            default: '',
        },
        trackingBarcodeUrl: {
            type: String,
            default: null,
        },
        parcelImageUrls: {
            type: [String],
            default: () => [],
        },
        ocrResult: {
            type: Object,
            default: null,
        },
        status: {
            type: String,
            enum: ['pending', 'success', 'failed', 'returned'],
            default: 'pending',
        },
        description: {
            type: String,
            default: '',
        },
        category: {
            type: String,
            default: '',
        },
        quantity: {
            type: Number,
            default: 1,
        },
        location: {
            type: String,
            default: '',
        },
        createdBy: {
            type: String,
            ref: 'User',
        },
        updatedBy: {
            type: String,
            ref: 'User',
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
        history: {
            type: [Object],
            default: () => [],
        },
    },
    {
        timestamps: true,
    }
);

// Instance methods
parcelRepackSchema.methods.toJSON = function () {
    return {
        id: this.id,
        serialNumber: this.serialNumber,
        serialNumberImage: this.serialNumberImage,
        itemImages: this.itemImages,
        ocrResult: this.ocrResult,
        status: this.status,
        description: this.description,
        category: this.category,
        quantity: this.quantity,
        location: this.location,
        createdBy: this.createdBy,
        updatedBy: this.updatedBy,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        history: this.history,
    };
};

parcelRepackSchema.methods.updateOCRResult = function (ocrData: OCRResult) {
    this.ocrResult = ocrData;
    this.serialNumber = ocrData.extractedText;
    this.status = 'processed';
    return this.save();
};

parcelRepackSchema.methods.markAsFailed = function (error: string) {
    this.status = 'failed';
    this.ocrResult = {
        extractedText: '',
        confidence: 0,
        processedAt: new Date(),
        ocrProvider: 'failed',
        error: error,
    };
    return this.save();
};

const scope = process.env.DB_SCOPE || '_default';
const Inventory = model('Inventory', parcelRepackSchema, { scopeName: scope });

export { Inventory, parcelRepackSchema };
export type { ImageData, OCRResult };