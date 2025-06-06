import path from 'path';
import {
    FileUploadProvider,
    UploadOptions,
    UploadResult,
} from './storage.types';
import AWS from 'aws-sdk';
import fs from 'fs';

export class S3StorageProvider implements FileUploadProvider {
    name = 'aws-s3';

    private defaultUploadDir: string;
    private bucketName: string;
    private region: string;
    private accessKeyId?: string;
    private secretAccessKey?: string;
    private s3Client: AWS.S3;

    constructor(config: {
        bucketName: string;
        region?: string;
        accessKeyId?: string;
        secretAccessKey?: string;
    }) {
        this.bucketName = config.bucketName;
        this.region = config.region || 'us-east-1';
        this.accessKeyId = config.accessKeyId || process.env.AWS_ACCESS_KEY_ID;
        this.secretAccessKey =
            config.secretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;

        this.defaultUploadDir = 'unknown';

        this.initializeS3Client();
    }

    private initializeS3Client(): void {
        try {
            this.s3Client = new AWS.S3({
                region: this.region,
                accessKeyId: this.accessKeyId,
                secretAccessKey: this.secretAccessKey,
            });
        } catch (error) {
            console.warn('AWS SDK not installed. S3 provider will not work.');
        }
    }

    isConfigured(): boolean {
        return !!(
            this.s3Client &&
            this.bucketName &&
            this.accessKeyId &&
            this.secretAccessKey
        );
    }

    async uploadFile(
        file: Express.Multer.File,
        options?: UploadOptions
    ): Promise<UploadResult> {
        if (!this.isConfigured()) {
            throw new Error('S3 provider is not properly configured');
        }

        const folder = options?.folder || this.defaultUploadDir;
        const extension = path.extname(file.originalname);
        const basename = path.basename(file.originalname, extension);
        const filename = `${basename}${extension}`;
        const key = `${folder}/${filename}`;

        const uploadParams: AWS.S3.Types.PutObjectRequest = {
            Bucket: this.bucketName,
            Key: key,
            Body: fs.createReadStream(file.path),
            ContentType: file.mimetype,
            Metadata: options?.metadata || {},
        };

        try {
            const result = await this.s3Client.upload(uploadParams).promise();

            return {
                filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: result.Location,
                uploadedAt: new Date(),
                provider: this.name,
                metadata: options?.metadata,
            };
        } catch (error) {
            throw new Error(`S3 upload failed: ${error.message}`);
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        if (!this.isConfigured()) {
            throw new Error('S3 provider is not properly configured');
        }

        try {
            const key = fileUrl.replace(
                `https://${this.bucketName}.s3.amazonaws.com/`,
                ''
            );
            await this.s3Client
                .deleteObject({
                    Bucket: this.bucketName,
                    Key: key,
                })
                .promise();
        } catch (error) {
            throw new Error(`S3 delete failed: ${error.message}`);
        }
    }

    getFileUrl(filename: string, options?: UploadOptions): string {
        return `https://${this.bucketName}.s3.amazonaws.com/${
            options?.folder || this.defaultUploadDir
        }/${filename}`;
    }
}
