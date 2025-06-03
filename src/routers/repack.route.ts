import express from 'express';
import { Container } from 'inversify';
import { ParcelReceiveController } from 'src/controllers/repack/parcelReceiveController';

export default function repackRouter(container: Container): express.Router {
    const router = express.Router();

    const parcelReceiveController: ParcelReceiveController = container.get(
        ParcelReceiveController
    );

    router.post(
        '/',
        parcelReceiveController.create.bind(parcelReceiveController)
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

    return router;
}
