import { Router } from 'express';
import { inventoryController } from '../controllers/repack/inventoryController';
import { uploadInventoryImages } from '../services/common/fileUploadService-depr';

const router = Router();

// POST /api/v1/inventory - Create new inventory item with images
router.post(
    '/',
    uploadInventoryImages,
    inventoryController.createInventoryItem.bind(inventoryController)
);

// GET /api/v1/inventory/stats - Get inventory statistics (before /:id route)
router.get(
    '/stats',
    inventoryController.getInventoryStats.bind(inventoryController)
);

// GET /api/v1/inventory/search - Search inventory items
router.get(
    '/search',
    inventoryController.searchInventoryItems.bind(inventoryController)
);

// GET /api/v1/inventory - Get all inventory items with pagination and filters
router.get(
    '/',
    inventoryController.getInventoryItems.bind(inventoryController)
);

// GET /api/v1/inventory/:id - Get single inventory item by ID
router.get(
    '/:id',
    inventoryController.getInventoryItemById.bind(inventoryController)
);

// PUT /api/v1/inventory/:id - Update inventory item
router.put(
    '/:id',
    inventoryController.updateInventoryItem.bind(inventoryController)
);

// DELETE /api/v1/inventory/:id - Delete inventory item
router.delete(
    '/:id',
    inventoryController.deleteInventoryItem.bind(inventoryController)
);

// POST /api/v1/inventory/:id/reprocess-ocr - Reprocess OCR for an item
router.post(
    '/:id/reprocess-ocr',
    inventoryController.reprocessOCR.bind(inventoryController)
);

export default router; 