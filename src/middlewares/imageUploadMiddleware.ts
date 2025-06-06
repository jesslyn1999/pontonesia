import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

type TLimitOptions =
    | {
          /** Maximum size of each form field name in bytes. (Default: 100) */
          fieldNameSize?: number | undefined;
          /** Maximum size of each form field value in bytes. (Default: 1048576) */
          fieldSize?: number | undefined;
          /** Maximum number of non-file form fields. (Default: Infinity) */
          fields?: number | undefined;
          /** Maximum size of each file in bytes. (Default: Infinity) */
          fileSize?: number | undefined;
          /** Maximum number of file fields. (Default: Infinity) */
          files?: number | undefined;
          /** Maximum number of parts (non-file fields + files). (Default: Infinity) */
          parts?: number | undefined;
          /** Maximum number of headers. (Default: 2000) */
          headerPairs?: number | undefined;
      }
    | undefined;

// Multer setup for memory storage
const upload = (limitOptions: TLimitOptions) =>
    multer({
        storage: multer.memoryStorage(),
        fileFilter: (req, file, callback) => {
            if (file.mimetype.startsWith('image/')) {
                callback(null, true);
            } else {
                callback(new Error('Only image files are allowed!'));
            }
        },
        limits: limitOptions,
    });

// Upload fields middleware
export const uploadFieldsMiddleware = (
    fieldConfigs: multer.Field[],
    limitOptions: TLimitOptions
) => upload(limitOptions).fields(fieldConfigs);

// Resize and save image function
async function resizeAndSaveImage(
    buffer: Buffer,
    filename: string,
    config: any
): Promise<Express.Multer.File> {
    const tempDir = path.join(process.cwd(), 'temp', 'processed');

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    const outputPath = path.join(tempDir, filename);

    await sharp(buffer)
        .resize(config.width, config.height, {
            fit: 'inside',
            withoutEnlargement: true,
        })
        .jpeg({ quality: config.quality })
        .toFile(outputPath);

    return {
        fieldname: '',
        originalname: filename,
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: fs.statSync(outputPath).size,
        destination: tempDir,
        filename: filename,
        path: outputPath,
        buffer: buffer,
    } as Express.Multer.File;
}

// Image resize middleware
export function imageResizeMiddleware(resizedFileCb: (...args: any[]) => any) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const files = req.files as {
                [fieldname: string]: Express.Multer.File[];
            };

            if (!files) {
                return next();
            }

            const processedFiles = await resizedFileCb(req, resizeAndSaveImage);
            req.files = processedFiles;
            next();
        } catch (error) {
            res.status(400).json({
                error: 'Failed to process images',
                details: error.message,
            });
        }
    };
}

// Error handling middleware
export function handleUploadErrors(
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large (max 5MB)' });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Too many files (max 11)' });
        }
    }

    if (error.message === 'Only image files are allowed!') {
        return res.status(400).json({ error: 'Only image files allowed' });
    }

    next(error);
    return;
}

// Cleanup middleware to delete temporary files
export function cleanupTempFiles() {
    return (req: Request, res: Response, next: NextFunction) => {
        const originalSend = res.send;
        const originalJson = res.json;

        const cleanup = () => {
            const files = req.files as {
                [fieldname: string]: Express.Multer.File[];
            };
            if (files) {
                // Get all files from all fields
                const allFiles = Object.values(files).flat();

                allFiles.forEach((file) => {
                    if (file.path && fs.existsSync(file.path)) {
                        try {
                            fs.unlinkSync(file.path);
                            console.log(`Cleaned up temp file: ${file.path}`);
                        } catch (error) {
                            console.warn(
                                `Failed to delete temp file ${file.path}:`,
                                error
                            );
                        }
                    }
                });

                // Also try to remove the temp directory if it's empty
                try {
                    const tempDir = path.join(
                        process.cwd(),
                        'temp',
                        'processed'
                    );
                    if (fs.existsSync(tempDir)) {
                        const remainingFiles = fs.readdirSync(tempDir);
                        if (remainingFiles.length === 0) {
                            fs.rmdirSync(tempDir);
                            console.log('Cleaned up empty temp directory');
                        }
                    }
                } catch (error) {
                    // Ignore errors when removing directory (might not be empty)
                }
            }
        };

        // Override response methods to ensure cleanup happens
        res.send = function (body) {
            cleanup();
            return originalSend.call(this, body);
        };

        res.json = function (body) {
            cleanup();
            return originalJson.call(this, body);
        };

        next();
    };
}
