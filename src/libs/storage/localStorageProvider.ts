import logger from 'src/libs/logger';
import path from 'path';
import {
    FileUploadProvider,
    UploadOptions,
    UploadResult,
} from './storage.types';
import fs from 'fs';
import { SERVER_ENV } from 'src/configs/env';

export class LocalStorageProvider implements FileUploadProvider {
    name = 'local';
    private defaultUploadDir: string;

    constructor() {
        this.defaultUploadDir = path.join(process.cwd(), 'uploads/unknown');
        this.ensureDirectories();
    }

    private ensureDirectories(): void {
        [this.defaultUploadDir].forEach((dir) => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    isConfigured(): boolean {
        return true; // Local storage is always available
    }

    async uploadFile(
        file: Express.Multer.File,
        options?: UploadOptions
    ): Promise<UploadResult> {
        const targetDir = options?.folder || this.defaultUploadDir;
        const extension = path.extname(file.originalname);
        const basename = path.basename(file.originalname, extension);
        const filename = `${basename}${extension}`;
        const filePath = path.join(targetDir, filename);

        try {
            // Move file to target directory
            if (file.path !== filePath) {
                fs.copyFileSync(file.path, filePath);
                fs.unlinkSync(file.path); // Remove temp file
            }

            return {
                filename,
                originalName: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                url: this.getFileUrl(filename, options),
                path: filePath,
                uploadedAt: new Date(),
                provider: this.name,
                metadata: options?.metadata,
            };
        } catch (error) {
            logger.error(error);
            throw new Error(`Local storage upload failed: ${error.message}`);
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            const baseUrl = SERVER_ENV.BASE_URL;
            const localFilePath = fileUrl.replace(baseUrl, '');

            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
        } catch (error) {
            throw new Error(`Local storage delete failed: ${error.message}`);
        }
    }

    getFileUrl(filename: string, options?: UploadOptions): string {
        const baseUrl = SERVER_ENV.BASE_URL;
        return `${baseUrl}/${
            options?.folder || this.defaultUploadDir
        }/${filename}`;
    }
}
