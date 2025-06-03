import { IParcelRepack } from 'src/models/repack/parcel';
import { Schema, model } from 'mongoose';
import { generateUUID } from 'src/libs/uuid';

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

// Interface for ParcelRepack document
interface IParcelRepack {
    _id?: string;
    trackingNumber: string;
    trackingBarcodeUrl: string | null;
    parcelImageUrls: string[];
    ocrResult: OCRResult | null;
    status: 'pending' | 'success' | 'failed' | 'returned';
    description: string;
    category: string;
    quantity: number;
    location: string;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    history: any[];
}

interface IParcelRepackDraft extends Partial<IParcelRepack> {}

const parcelRepackSchema = new Schema<IParcelRepack>(
    {
        _id: {
            type: String,
            required: true,
            index: true,
        },
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

parcelRepackSchema.pre('save', function (next) {
    let tmp_log = null;
    if (this.isNew && !this._id) {
        this._id = generateUUID();
        this.status = 'pending';
        this.createdAt = new Date();
        tmp_log = {
            action: 'create',
            createdAt: new Date(),
            object: this,
        };
    } else {
        tmp_log = {
            action: 'update',
            updatedAt: new Date(),
            object: this,
        };
    }
    this.history.push(tmp_log);
    this.updatedAt = new Date();
    next();
});

const ParcelRepackModel = model('ParcelRepack', parcelRepackSchema);

export { ParcelRepackModel, parcelRepackSchema };
export type { ImageData, OCRResult, IParcelRepack, IParcelRepackDraft };
