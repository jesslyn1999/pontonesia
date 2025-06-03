import { fileUploadService } from '../services/internal/fileUploadService';

// Example: How to use the FileUploadService class

// 1. Configure AWS S3 (requires aws-sdk package)
export function configureS3Example() {
    fileUploadService.configureS3({
        bucketName: 'my-app-bucket',
        region: 'us-east-1',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID, // Optional, will use env var
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY, // Optional, will use env var
    });

    console.log(
        'S3 configured. Available providers:',
        fileUploadService.getAvailableProviders()
    );
    console.log(
        'Configured providers:',
        fileUploadService.getConfiguredProviders()
    );
}

// 2. Configure Google Cloud Storage (requires @google-cloud/storage package)
export function configureGCSExample() {
    fileUploadService.configureGCS({
        bucketName: 'my-gcs-bucket',
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID, // Optional, will use env var
        keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE, // Optional, will use env var
    });

    console.log(
        'GCS configured. Available providers:',
        fileUploadService.getAvailableProviders()
    );
}

// 3. Configure Cloudinary (requires cloudinary package)
export function configureCloudinaryExample() {
    fileUploadService.configureCloudinary({
        cloudName: 'my-cloud-name',
        apiKey: process.env.CLOUDINARY_API_KEY, // Optional, will use env var
        apiSecret: process.env.CLOUDINARY_API_SECRET, // Optional, will use env var
    });

    console.log(
        'Cloudinary configured. Available providers:',
        fileUploadService.getAvailableProviders()
    );
}

// 4. Upload files using the service
export async function uploadFileExample(file: Express.Multer.File) {
    try {
        // Upload to default provider
        const result1 = await fileUploadService.uploadFile(file, {
            type: 'serial',
            metadata: { description: 'Serial number image' },
        });
        console.log('Upload result:', result1);

        // Upload to specific provider
        const result2 = await fileUploadService.uploadFile(file, {
            type: 'item',
            providerName: 'aws-s3',
            folder: 'custom-folder',
            metadata: { category: 'electronics' },
        });
        console.log('S3 upload result:', result2);

        return [result1, result2];
    } catch (error) {
        console.error('Upload failed:', error.message);
        throw error;
    }
}

// 5. Upload multiple files
export async function uploadMultipleFilesExample(files: Express.Multer.File[]) {
    try {
        const results = await fileUploadService.uploadFiles(files, {
            type: 'item',
            providerName: 'cloudinary',
            metadata: { batch: 'batch-001' },
        });

        console.log('Multiple upload results:', results);
        return results;
    } catch (error) {
        console.error('Multiple upload failed:', error.message);
        throw error;
    }
}

// 6. Delete files
export async function deleteFileExample(fileUrl: string) {
    try {
        await fileUploadService.deleteFile(fileUrl);
        console.log('File deleted successfully');
    } catch (error) {
        console.error('Delete failed:', error.message);
        throw error;
    }
}

// 7. Express.js controller example
export class FileUploadController {
    // Single file upload endpoint
    async uploadSingle(req: any, res: any) {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const result = await fileUploadService.uploadFile(req.file, {
                type: req.body.type || 'item',
                metadata: {
                    userId: req.user?.id,
                    uploadedBy: req.user?.email,
                },
            });

            res.json({
                success: true,
                data: result,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    // Multiple files upload endpoint
    async uploadMultiple(req: any, res: any) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ error: 'No files uploaded' });
            }

            const results = await fileUploadService.uploadFiles(req.files, {
                type: req.body.type || 'item',
                providerName: req.body.provider,
                metadata: {
                    userId: req.user?.id,
                    uploadedBy: req.user?.email,
                },
            });

            res.json({
                success: true,
                data: results,
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    // Delete file endpoint
    async deleteFile(req: any, res: any) {
        try {
            const { fileUrl } = req.body;

            if (!fileUrl) {
                return res.status(400).json({ error: 'File URL is required' });
            }

            await fileUploadService.deleteFile(fileUrl, req.body.provider);

            res.json({
                success: true,
                message: 'File deleted successfully',
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
            });
        }
    }

    // Get service info endpoint
    async getServiceInfo(req: any, res: any) {
        res.json({
            availableProviders: fileUploadService.getAvailableProviders(),
            configuredProviders: fileUploadService.getConfiguredProviders(),
            defaultProvider: fileUploadService.getDefaultProvider(),
        });
    }
}

// 8. Environment variables setup example
export const environmentSetup = `
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key

# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account-key.json

# Cloudinary Configuration
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Base URL for local storage
BASE_URL=http://localhost:3000
`;

// 9. Package dependencies needed
export const requiredPackages = {
    aws: 'npm install aws-sdk',
    gcs: 'npm install @google-cloud/storage',
    cloudinary: 'npm install cloudinary',
};

// 10. Usage in routes
export function setupRoutes(app: any) {
    const controller = new FileUploadController();
    const upload = fileUploadService.getUploadMiddleware();

    // Single file upload
    app.post('/upload/single', upload.single('file'), controller.uploadSingle);

    // Multiple files upload
    app.post(
        '/upload/multiple',
        upload.array('files', 10),
        controller.uploadMultiple
    );

    // Inventory images upload (serial number + item images)
    app.post(
        '/upload/inventory',
        upload.inventoryImages,
        async (req: any, res: any) => {
            try {
                const results = [];

                // Upload serial number image
                if (req.files.serialNumberImage?.[0]) {
                    const serialResult = await fileUploadService.uploadFile(
                        req.files.serialNumberImage[0],
                        { type: 'serial' }
                    );
                    results.push(serialResult);
                }

                // Upload item images
                if (req.files.itemImages) {
                    const itemResults = await fileUploadService.uploadFiles(
                        req.files.itemImages,
                        { type: 'item' }
                    );
                    results.push(...itemResults);
                }

                res.json({ success: true, data: results });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        }
    );

    // Delete file
    app.delete('/upload', controller.deleteFile);

    // Service info
    app.get('/upload/info', controller.getServiceInfo);
}
