import express from 'express';
import { Container } from 'inversify';
import { IParcelReceiveController } from 'src/controllers/repack/parcelReceiveController';
import * as TYPES from 'src/api/ioc/ioc.type';
import {
    uploadFieldsMiddleware,
    imageResizeMiddleware,
    handleUploadErrors,
    cleanupTempFiles,
} from 'src/middlewares/imageUploadMiddleware';
import { generateUUID } from 'src/libs/uuid';

export default function repackRouter(container: Container): express.Router {
    const router = express.Router();

    const parcelReceiveController = container.get<IParcelReceiveController>(
        TYPES.ParcelReceiveController
    );

    router.post(
        '/',
        uploadFieldsMiddleware(
            [
                { name: 'trackingBarcode', maxCount: 1 },
                { name: 'parcelImages', maxCount: 10 },
            ],
            {
                fileSize: 1 * 1024 * 1024, // 1MB per file
                files: 11, // 1 tracking + 10 parcel images
            }
        ),
        imageResizeMiddleware(resizedFilesCb),
        parcelReceiveController.create.bind(parcelReceiveController),
        cleanupTempFiles()
    );

    // GET /api/v1/inventory/stats - Get inventory statistics (before /:id route)
    // router.get(
    //     '/stats',
    //     parcelReceiveController.getInventoryStats.bind(parcelReceiveController)
    // );

    // GET /api/v1/inventory/search - Search inventory items
    // router.get(
    //     '/search',
    //     parcelReceiveController.searchInventoryItems.bind(
    //         parcelReceiveController
    //     )
    // );

    // GET /api/v1/inventory - Get all inventory items with pagination and filters
    router.get('/', parcelReceiveController.all.bind(parcelReceiveController));

    // GET /api/v1/inventory/:id - Get single inventory item by ID
    router.get(
        '/:id',
        parcelReceiveController.byId.bind(parcelReceiveController)
    );

    // PUT /api/v1/inventory/:id - Update inventory item
    // router.put(
    //     '/:id',
    //     parcelReceiveController.updateInventoryItem.bind(
    //         parcelReceiveController
    //     )
    // );

    // // DELETE /api/v1/inventory/:id - Delete inventory item
    // router.delete(
    //     '/:id',
    //     parcelReceiveController.deleteInventoryItem.bind(
    //         parcelReceiveController
    //     )
    // );

    // POST /api/v1/inventory/:id/reprocess-ocr - Reprocess OCR for an item
    // router.post(
    //     '/:id/reprocess-ocr',
    //     parcelReceiveController.reprocessOCR.bind(parcelReceiveController)
    // );

    // Error handling middleware for file uploads
    router.use(handleUploadErrors);

    return router;
}

// Configuration for image resizing
const resizeConfig = {
    trackingBarcode: { width: 800, height: 600, quality: 85 },
    parcelImages: { width: 800, height: 600, quality: 80 },
};

// Process tracking barcode
const resizedFilesCb = async (
    req: express.Request,
    resizeAndSaveImageCb: (...args: any[]) => any
) => {
    const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
    };

    // Get timezone and user ID
    const now = new Date();
    const timezone =
        now.toISOString().slice(0, 10) +
        'T' +
        now.toTimeString().slice(0, 5).replace(':', '') +
        now.toTimeString().slice(9, 15);
    const userId =
        (req as any).user?.id || req.headers['user-id'] || 'anonymous';

    const processedFiles: {
        [fieldname: string]: Express.Multer.File[];
    } = {};

    const trackingBarcodeTmpId = generateUUID();

    if (files.trackingBarcode?.[0]) {
        const file = files.trackingBarcode[0];
        const filename = `${timezone}-${userId}_${trackingBarcodeTmpId}_trackingbarcode.jpg`;
        const processed = await resizeAndSaveImageCb(
            file.buffer,
            filename,
            resizeConfig.trackingBarcode
        );
        processedFiles.trackingBarcode = processed;
    }

    // Process parcel images
    if (files.parcelImages?.length > 0) {
        processedFiles.parcelImages = [];
        for (let i = 0; i < files.parcelImages.length; i++) {
            const file = files.parcelImages[i];
            const filename = `${timezone}-${userId}_${trackingBarcodeTmpId}_parcelimage_${
                i + 1
            }.jpg`;
            const processed = await resizeAndSaveImageCb(
                file.buffer,
                filename,
                resizeConfig.parcelImages
            );
            processedFiles.parcelImages.push(processed);
        }
    }

    return processedFiles;
};
