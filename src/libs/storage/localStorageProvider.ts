import path from 'path';
import {
    FileUploadProvider,
    UploadOptions,
    UploadResult,
} from './storage.types';

export class LocalStorageProvider implements FileUploadProvider {
    name = 'local';
    private uploadDir: string;
    private serialNumberDir: string;
    private itemImagesDir: string;

    constructor() {
        this.uploadDir = path.join(process.cwd(), 'uploads');
        this.serialNumberDir = path.join(this.uploadDir, 'serial-numbers');
        this.itemImagesDir = path.join(this.uploadDir, 'item-images');
        this.ensureDirectories();
    }

    private ensureDirectories(): void {
        [this.uploadDir, this.serialNumberDir, this.itemImagesDir].forEach(
            (dir) => {
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
            }
        );
    }

    isConfigured(): boolean {
        return true; // Local storage is always available
    }

    async uploadFile(
        file: Express.Multer.File,
        options?: UploadOptions
    ): Promise<UploadResult> {
        const type = options?.type || 'item';
        const targetDir =
            type === 'serial' ? this.serialNumberDir : this.itemImagesDir;

        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const extension = path.extname(file.originalname);
        const filename = `${type}-${uniqueSuffix}${extension}`;
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
                url: this.getFileUrl(filename, type),
                path: filePath,
                uploadedAt: new Date(),
                provider: this.name,
                metadata: options?.metadata,
            };
        } catch (error) {
            throw new Error(`Local storage upload failed: ${error.message}`);
        }
    }

    async deleteFile(fileUrl: string): Promise<void> {
        try {
            const filename = path.basename(fileUrl);
            const serialPath = path.join(this.serialNumberDir, filename);
            const itemPath = path.join(this.itemImagesDir, filename);

            if (fs.existsSync(serialPath)) {
                fs.unlinkSync(serialPath);
            } else if (fs.existsSync(itemPath)) {
                fs.unlinkSync(itemPath);
            }
        } catch (error) {
            throw new Error(`Local storage delete failed: ${error.message}`);
        }
    }

    getFileUrl(filename: string, type = 'item'): string {
        const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
        const folder = type === 'serial' ? 'serial-numbers' : 'item-images';
        return `${baseUrl}/uploads/${folder}/${filename}`;
    }
}