// Upload options interface
export interface UploadOptions {
    type?: 'serial' | 'item';
    folder?: string;
    metadata?: Record<string, any>;
}

// Upload result interface
export interface UploadResult {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    url: string;
    path?: string;
    uploadedAt: Date;
    provider: string;
    metadata?: Record<string, any>;
}

// Interface for third-party upload providers
export interface FileUploadProvider {
    name: string;
    uploadFile(
        file: Express.Multer.File,
        options?: UploadOptions
    ): Promise<UploadResult>;
    deleteFile(fileUrl: string): Promise<void>;
    getFileUrl(filename: string, type?: string): string;
    isConfigured(): boolean;
}
