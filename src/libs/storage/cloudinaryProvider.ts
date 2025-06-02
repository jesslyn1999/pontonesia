import path from 'path';
import {
    FileUploadProvider,
    UploadOptions,
    UploadResult,
} from './storage.types';

export class CloudinaryProvider implements FileUploadProvider {
    name = 'cloudinary';
    private cloudName: string;
    private apiKey?: string;
    private apiSecret?: string;
    private cloudinary: any;

    constructor(config: {
        cloudName: string;
        apiKey?: string;
        apiSecret?: string;
    }) {
        this.cloudName = config.cloudName;
        this.apiKey = config.apiKey || process.env.CLOUDINARY_API_KEY;
        this.apiSecret = config.apiSecret || process.env.CLOUDINARY_API_SECRET;

        this.initializeCloudinary();
    }

    private initializeCloudinary(): void {
        try {
            this.cloudinary = require('cloudinary').v2;
            this.cloudinary.config({
                cloud_name: this.cloudName,
                api_key: this.apiKey,
                api_secret: this.apiSecret,
            });
        } catch (error) {
            console.warn(
                'Cloudinary SDK not installed. Cloudinary provider will not work.'
            );
        }
    }

    isConfigured(): boolean {
        return !!(
            this.cloudinary &&
            this.cloudName &&
            this.apiKey &&
            this.apiSecret
        );
    }

    async uploadFile(
        file: Express.Multer.File,
        options?: UploadOptions
    ): Promise<UploadResult> {
        if (!this.isConfigured()) {
            throw new Error('Cloudinary provider is not properly configured');
        }

        const type = options?.type || 'item';
        const folder =
            options?.folder ||
            `inventory/${type === 'serial' ? 'serial-numbers' : 'item-images'}`;

        try {
            const result = await this.cloudinary.uploader.upload(file.path, {
                folder: folder,
                resource_type: 'image',
                context: options?.metadata || {},
            });

            return {
                filename: result.public_id,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: result.secure_url,
                uploadedAt: new Date(),
                provider: this.name,
                metadata: { ...options?.metadata, public_id: result.public_id },
            };
        } catch (error) {
            throw new Error(`Cloudinary upload failed: ${error.message}`);
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('Cloudinary provider is not properly configured');
        }

        try {
            // Extract public_id from URL
            const urlParts = fileUrl.split('/');
            const publicIdWithExtension = urlParts[urlParts.length - 1];
            const publicId = publicIdWithExtension.split('.')[0];

            await this.cloudinary.uploader.destroy(publicId);
        } catch (error) {
            throw new Error(`Cloudinary delete failed: ${error.message}`);
        }
    }

    getFileUrl(filename: string, type: string = 'item'): string {
        return `https://res.cloudinary.com/${
            this.cloudName
        }/image/upload/inventory/${
            type === 'serial' ? 'serial-numbers' : 'item-images'
        }/${filename}`;
    }
}