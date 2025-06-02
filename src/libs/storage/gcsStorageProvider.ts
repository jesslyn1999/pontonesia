import path from 'path';
import {
    FileUploadProvider,
    UploadOptions,
    UploadResult,
} from './storage.types';

export class GCSStorageProvider implements FileUploadProvider {
    name = 'google-cloud-storage';
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
        const folder =
            options?.folder ||
            `uploads/${type === 'serial' ? 'serial-numbers' : 'item-images'}`;
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        const filename = `${type}-${uniqueSuffix}${extension}`;
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
                stream.on('error', (error) => {
                    reject(new Error(`GCS upload failed: ${error.message}`));
                });

                stream.on('finish', () => {
                    resolve({
                        filename,
                        originalName: file.originalname,
                        mimetype: file.mimetype,
                        size: file.size,
                        url: this.getFileUrl(filename, type),
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

    getFileUrl(filename: string, type: string = 'item'): string {
        const folder = type === 'serial' ? 'serial-numbers' : 'item-images';
        return `https://storage.googleapis.com/${this.bucketName}/uploads/${folder}/${filename}`;
    }
}
