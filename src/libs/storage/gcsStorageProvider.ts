import path from 'path';
import {
    FileUploadProvider,
    UploadOptions,
    UploadResult,
} from './storage.types';
import fs from 'fs';

export class GCSStorageProvider implements FileUploadProvider {
    name = 'google-cloud-storage';

    private defaultUploadDir: string;
    private bucketName: string;
    private projectId?: string;
    private keyFilename?: string;
    private storage: any;
    private bucket: any;

    constructor(config: {
        bucketName: string;
        projectId?: string;
        keyFilename?: string;
    }) {
        this.bucketName = config.bucketName;
        this.projectId =
            config.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID;
        this.keyFilename =
            config.keyFilename || process.env.GOOGLE_CLOUD_KEY_FILE;

        this.defaultUploadDir = 'unknown';

        this.initializeGCS();
    }

    private initializeGCS(): void {
        try {
            const { Storage } = require('@google-cloud/storage');
            this.storage = new Storage({
                projectId: this.projectId,
                keyFilename: this.keyFilename,
            });
            this.bucket = this.storage.bucket(this.bucketName);
        } catch (error) {
            console.warn(
                'Google Cloud Storage SDK not installed. GCS provider will not work.'
            );
        }
    }

    isConfigured(): boolean {
        return !!(this.storage && this.bucketName && this.projectId);
    }

    async uploadFile(
        file: Express.Multer.File,
        options?: UploadOptions
    ): Promise<UploadResult> {
        if (!this.isConfigured()) {
            throw new Error('GCS provider is not properly configured');
        }

        const type = options?.type || 'item';
        const folder = options?.folder || this.defaultUploadDir;
        const extension = path.extname(file.originalname);
        const filename = `${file.originalname}${extension}`;
        const destination = `${folder}/${filename}`;

        try {
            const gcsFile = this.bucket.file(destination);
            const stream = gcsFile.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                    metadata: options?.metadata || {},
                },
            });

            return new Promise((resolve, reject) => {
                stream.on('error', (error: any) => {
                    reject(new Error(`GCS upload failed: ${error.message}`));
                });

                stream.on('finish', () => {
                    resolve({
                        filename,
                        originalName: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                        url: this.getFileUrl(filename, options),
                        uploadedAt: new Date(),
                        provider: this.name,
                        metadata: options?.metadata,
                    });
                });

                fs.createReadStream(file.path).pipe(stream);
            });
        } catch (error) {
            throw new Error(`GCS upload failed: ${error.message}`);
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('GCS provider is not properly configured');
        }

        try {
            const filename = fileUrl.split('/').pop();
            const file = this.bucket.file(filename);
            await file.delete();
        } catch (error) {
            throw new Error(`GCS delete failed: ${error.message}`);
        }
    }

    getFileUrl(filename: string, options?: UploadOptions): string {
        return `https://storage.googleapis.com/${this.bucketName}/${
            options?.folder || this.defaultUploadDir
        }/${filename}`;
    }
}
