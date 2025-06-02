import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { ImageData } from '../../models/repack/sourcePackage';
import {
    FileUploadProvider,
    UploadOptions,
    UploadResult,
} from 'src/libs/storage/storage.types';
import {
    S3StorageProvider,
    LocalStorageProvider,
    GCSStorageProvider,
    CloudinaryProvider,
} from 'src/libs/storage';

// Configuration interface for FileUploadService
export interface FileUploadServiceConfig {
    providers?: FileUploadProvider[];
    defaultProvider?: string;
    multerConfig?: {
        maxFileSize?: number;
        maxFiles?: number;
        allowedMimeTypes?: string[];
        tempDirectory?: string;
    };
}

// Main FileUploadService class with dependency injection support
class FileUploadService {
    private providers: Map<string, FileUploadProvider> = new Map();
    private defaultProvider: string;
    private multerConfig: multer.Multer;

    constructor(config?: FileUploadServiceConfig) {
        // Initialize with provided providers or default to local storage
        if (config?.providers && config.providers.length > 0) {
            config.providers.forEach((provider) =>
                this.registerProvider(provider)
            );
            this.defaultProvider =
                config.defaultProvider || config.providers[0].name;
        } else {
            // Fallback to local storage if no providers are injected
            this.registerProvider(new LocalStorageProvider());
            this.defaultProvider = 'local';
        }

        // Set default provider if specified
        if (config?.defaultProvider) {
            this.setDefaultProvider(config.defaultProvider);
        }

        // Initialize multer configuration
        this.initializeMulter(config?.multerConfig);
    }

    private initializeMulter(
        config?: FileUploadServiceConfig['multerConfig']
    ): void {
        const tempDir =
            config?.tempDirectory || path.join(process.cwd(), 'temp');
        const maxFileSize = config?.maxFileSize || 10 * 1024 * 1024; // 10MB
        const maxFiles = config?.maxFiles || 11; // 1 serial + 10 item images
        const allowedMimeTypes = config?.allowedMimeTypes || [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
        ];

        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                cb(null, tempDir);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix =
                    Date.now() + '-' + Math.round(Math.random() * 1e9);
                const extension = path.extname(file.originalname);
                cb(null, `temp-${uniqueSuffix}${extension}`);
            },
        });

        const fileFilter = (
            req: any,
            file: Express.Multer.File,
            cb: multer.FileFilterCallback
        ) => {
            if (allowedMimeTypes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(
                    new Error(
                        `Only these file types are allowed: ${allowedMimeTypes.join(
                            ', '
                        )}`
                    )
                );
            }
        };

        this.multerConfig = multer({
            storage,
            fileFilter,
            limits: {
                fileSize: maxFileSize,
                files: maxFiles,
            },
        });
    }

    // Register a new upload provider
    registerProvider(provider: FileUploadProvider): void {
        this.providers.set(provider.name, provider);
    }

    // Remove a provider
    removeProvider(providerName: string): void {
        this.providers.delete(providerName);
    }

    // Set default provider
    setDefaultProvider(providerName: string): void {
        if (!this.providers.has(providerName)) {
            throw new Error(`Provider '${providerName}' not registered`);
        }
        this.defaultProvider = providerName;
    }

    // Get multer middleware for file uploads
    getUploadMiddleware() {
        return {
            single: (fieldName: string) => this.multerConfig.single(fieldName),
            array: (fieldName: string, maxCount?: number) =>
                this.multerConfig.array(fieldName, maxCount),
            fields: (fields: multer.Field[]) =>
                this.multerConfig.fields(fields),
            inventoryImages: this.multerConfig.fields([
                { name: 'serialNumberImage', maxCount: 1 },
                { name: 'itemImages', maxCount: 10 },
            ]),
        };
    }

    // Upload single file
    async uploadFile(
        file: Express.Multer.File,
        options?: UploadOptions & { providerName?: string }
    ): Promise<UploadResult> {
        const providerName = options?.providerName || this.defaultProvider;
        const provider = this.providers.get(providerName);

        if (!provider) {
            throw new Error(`Provider '${providerName}' not found`);
        }

        if (!provider.isConfigured()) {
            throw new Error(
                `Provider '${providerName}' is not properly configured`
            );
        }

        try {
            const result = await provider.uploadFile(file, options);

            // Clean up temp file
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }

            return result;
        } catch (error) {
            // Clean up temp file on error
            if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
            throw error;
        }
    }

    // Upload multiple files
    async uploadFiles(
        files: Express.Multer.File[],
        options?: UploadOptions & { providerName?: string }
    ): Promise<UploadResult[]> {
        const uploadPromises = files.map((file) =>
            this.uploadFile(file, options)
        );
        return Promise.all(uploadPromises);
    }

    // Delete file
    async deleteFile(fileUrl: string, providerName?: string): Promise<void> {
        const provider = this.providers.get(
            providerName || this.defaultProvider
        );
        if (!provider) {
            throw new Error(
                `Provider '${providerName || this.defaultProvider}' not found`
            );
        }

        await provider.deleteFile(fileUrl);
    }

    // Delete multiple files
    async deleteFiles(
        fileUrls: string[],
        providerName?: string
    ): Promise<void> {
        const deletePromises = fileUrls.map((url) =>
            this.deleteFile(url, providerName)
        );
        await Promise.all(deletePromises);
    }

    // Get available providers
    getAvailableProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    // Get configured providers
    getConfiguredProviders(): string[] {
        return Array.from(this.providers.entries())
            .filter(([, provider]) => provider.isConfigured())
            .map(([name]) => name);
    }

    // Get file URL
    getFileUrl(
        filename: string,
        type: 'serial' | 'item' = 'item',
        providerName?: string
    ): string {
        const provider = this.providers.get(
            providerName || this.defaultProvider
        );
        if (!provider) {
            throw new Error(
                `Provider '${providerName || this.defaultProvider}' not found`
            );
        }

        return provider.getFileUrl(filename, type);
    }

    // Get current default provider
    getDefaultProvider(): string {
        return this.defaultProvider;
    }

    // Get provider instance
    getProvider(providerName?: string): FileUploadProvider | undefined {
        return this.providers.get(providerName || this.defaultProvider);
    }

    // Check if provider exists and is configured
    isProviderConfigured(providerName: string): boolean {
        const provider = this.providers.get(providerName);
        return provider ? provider.isConfigured() : false;
    }
}

// Factory function to create FileUploadService with common configurations
export class FileUploadServiceFactory {
    // Create service with local storage only
    static createWithLocalStorage(
        config?: FileUploadServiceConfig
    ): FileUploadService {
        return new FileUploadService({
            ...config,
            providers: [new LocalStorageProvider()],
            defaultProvider: 'local',
        });
    }

    // Create service with S3 storage
    static createWithS3(
        s3Config: {
            bucketName: string;
            region?: string;
            accessKeyId?: string;
            secretAccessKey?: string;
        },
        config?: FileUploadServiceConfig
    ): FileUploadService {
        const s3Provider = new S3StorageProvider(s3Config);
        return new FileUploadService({
            ...config,
            providers: [s3Provider, new LocalStorageProvider()],
            defaultProvider: s3Provider.isConfigured() ? 'aws-s3' : 'local',
        });
    }

    // Create service with Cloudinary storage
    static createWithCloudinary(
        cloudinaryConfig: {
            cloudName: string;
            apiKey?: string;
            apiSecret?: string;
        },
        config?: FileUploadServiceConfig
    ): FileUploadService {
        const cloudinaryProvider = new CloudinaryProvider(cloudinaryConfig);
        return new FileUploadService({
            ...config,
            providers: [cloudinaryProvider, new LocalStorageProvider()],
            defaultProvider: cloudinaryProvider.isConfigured()
                ? 'cloudinary'
                : 'local',
        });
    }

    // Create service with GCS storage
    static createWithGCS(
        gcsConfig: {
            bucketName: string;
            projectId?: string;
            keyFilename?: string;
        },
        config?: FileUploadServiceConfig
    ): FileUploadService {
        const gcsProvider = new GCSStorageProvider(gcsConfig);
        return new FileUploadService({
            ...config,
            providers: [gcsProvider, new LocalStorageProvider()],
            defaultProvider: gcsProvider.isConfigured()
                ? 'google-cloud-storage'
                : 'local',
        });
    }

    // Create service with multiple providers
    static createWithMultipleProviders(
        providers: FileUploadProvider[],
        config?: FileUploadServiceConfig
    ): FileUploadService {
        // Add local storage as fallback if not already included
        const hasLocalStorage = providers.some((p) => p.name === 'local');
        const allProviders = hasLocalStorage
            ? providers
            : [...providers, new LocalStorageProvider()];

        // Find first configured provider or fallback to local
        const configuredProvider = allProviders.find((p) => p.isConfigured());
        const defaultProvider = configuredProvider
            ? configuredProvider.name
            : 'local';

        return new FileUploadService({
            ...config,
            providers: allProviders,
            defaultProvider: config?.defaultProvider || defaultProvider,
        });
    }
}

// Export singleton instance for backward compatibility
export const fileUploadService = new FileUploadService();

// Export classes and interfaces
export {
    FileUploadService,
    FileUploadProvider,
    UploadResult,
    UploadOptions,
    LocalStorageProvider,
    S3StorageProvider,
    GCSStorageProvider,
    CloudinaryProvider,
};

// Legacy exports for backward compatibility
export const uploadInventoryImages =
    fileUploadService.getUploadMiddleware().inventoryImages;

export const convertToImageData = (file: Express.Multer.File): ImageData => {
    return {
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        path: file.path,
        uploadedAt: new Date(),
    };
};

export const deleteUploadedFiles = (files: string[]): void => {
    files.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    });
};
