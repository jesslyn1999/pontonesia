import { Schema, model, Document } from 'mongoose';
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

// Interface for SourceParcel document
interface ISourceParcel extends Document {
    _id: string;
    trackingNumber: string;
    trackingBarcodeUrl: string;
    parcelImageUrls: string[];
    ocrResult: OCRResult;
    // status: 'pending' | 'success' | 'failed' | 'returned'; // these types of statuses for process
    status: 'pending' | 'processed' | 'returned';
    channel: 'taobao' | 'alibaba' | 'xianyu' | 'xianzhu' | 'others';
    description: string;
    category: string;
    quantity: number;
    sourcedBy: string; // string of User
    createdBy: string; // string of RepackUsers
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    history: any[];
}

const SourceParcelSchema = new Schema<ISourceParcel>(
    {
        _id: {
            type: String,
        },
        trackingNumber: {
            type: String,
            index: true,
            default: null,
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
            enum: ['pending', 'processed', 'returned'],
            default: 'pending',
        },
        channel: {
            type: String,
            default: null,
        },
        description: {
            type: String,
            default: null,
        },
        category: {
            type: String,
            default: null,
        },
        quantity: {
            type: Number,
            default: null,
        },
        sourcedBy: {
            type: String,
            ref: 'User',
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
SourceParcelSchema.methods.toJSON = function () {
    return {
        id: this._id,
        trackingNumber: this.trackingNumber,
        trackingBarcodeUrl: this.trackingBarcodeUrl,
        parcelImageUrls: this.parcelImageUrls,
        ocrResult: this.ocrResult,
        status: this.status,
        channel: this.channel,
        description: this.description,
        category: this.category,
        quantity: this.quantity,
        sourcedBy: this.sourcedBy,
        createdBy: this.createdBy,
        updatedBy: this.updatedBy,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
        history: this.history,
    };
};

SourceParcelSchema.methods.updateOCRResult = function (ocrData: OCRResult) {
    this.ocrResult = ocrData;
    this.trackingNumber = ocrData.extractedText;
    this.status = 'processed';
    return this.save();
};

SourceParcelSchema.methods.markAsFailed = function (error: string) {
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

SourceParcelSchema.pre('save', function (next) {
    let tmp_log = null;
    if (this.isNew && !this._id) {
        this._id = generateUUID();
        this.status = 'pending';
        this.createdAt = new Date();
        const { history, ...obj } = this.toJSON();
        tmp_log = {
            action: 'create',
            createdAt: new Date(),
            object: obj,
        };
    } else {
        const { history, ...obj } = this.toJSON();
        tmp_log = {
            action: 'update',
            updatedAt: new Date(),
            object: obj,
        };
    }
    this.history.push(tmp_log);
    this.updatedAt = new Date();
    next();
});

const SourceParcelModel = model<ISourceParcel>(
    'SourceParcel',
    SourceParcelSchema
);

export { SourceParcelModel, SourceParcelSchema };
export type { ImageData, OCRResult, ISourceParcel };
