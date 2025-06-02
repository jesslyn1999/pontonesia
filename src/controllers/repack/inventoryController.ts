import { Request, Response } from 'express';
import { inventoryService } from '../../services/repack/returnService';
import { uploadInventoryImages } from '../../services/common/fileUploadService-depr';

// Interface for typed request with files
interface InventoryRequest extends Request {
    files?: {
        serialNumberImage?: Express.Multer.File[];
        itemImages?: Express.Multer.File[];
    };
}

class InventoryController {
    // POST /api/v1/inventory - Create new inventory item
    async createInventoryItem(req: InventoryRequest, res: Response): Promise<void> {
        try {
            // Check if files were uploaded
            if (!req.files?.serialNumberImage || req.files.serialNumberImage.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'Serial number image is required'
                });
                return;
            }

            if (!req.files?.itemImages || req.files.itemImages.length === 0) {
                res.status(400).json({
                    success: false,
                    message: 'At least one item image is required'
                });
                return;
            }

            // Prepare data for service
            const createData = {
                serialNumberImage: req.files.serialNumberImage[0],
                itemImages: req.files.itemImages,
                description: req.body.description,
                category: req.body.category,
                quantity: req.body.quantity ? parseInt(req.body.quantity) : 1,
                location: req.body.location,
                createdBy: req.body.userId || req.user?.id, // Assuming auth middleware sets req.user
            };

            // Create inventory item
            const inventoryItem = await inventoryService.createInventoryItem(createData);

            res.status(201).json({
                success: true,
                message: 'Inventory item created successfully',
                data: inventoryItem
            });
        } catch (error) {
            console.error('Create inventory error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create inventory item'
            });
        }
    }

    // GET /api/v1/inventory - Get all inventory items with pagination and filters
    async getInventoryItems(req: Request, res: Response): Promise<void> {
        try {
            const searchParams = {
                serialNumber: req.query.serialNumber as string,
                category: req.query.category as string,
                status: req.query.status as string,
                createdBy: req.query.createdBy as string,
                page: req.query.page ? parseInt(req.query.page as string) : 1,
                limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
            };

            const result = await inventoryService.getInventoryItems(searchParams);

            res.status(200).json({
                success: true,
                message: 'Inventory items retrieved successfully',
                data: result.items,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    totalPages: Math.ceil(result.total / result.limit)
                }
            });
        } catch (error) {
            console.error('Get inventory items error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve inventory items'
            });
        }
    }

    // GET /api/v1/inventory/:id - Get single inventory item by ID
    async getInventoryItemById(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Inventory item ID is required'
                });
                return;
            }

            const inventoryItem = await inventoryService.getInventoryItemById(id);

            res.status(200).json({
                success: true,
                message: 'Inventory item retrieved successfully',
                data: inventoryItem
            });
        } catch (error) {
            console.error('Get inventory item error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to retrieve inventory item'
            });
        }
    }

    // GET /api/v1/inventory/search - Search inventory items by serial number
    async searchInventoryItems(req: Request, res: Response): Promise<void> {
        try {
            const { q } = req.query;

            if (!q || typeof q !== 'string') {
                res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
                return;
            }

            const inventoryItems = await inventoryService.searchInventoryItems(q);

            res.status(200).json({
                success: true,
                message: 'Search completed successfully',
                data: inventoryItems,
                count: inventoryItems.length
            });
        } catch (error) {
            console.error('Search inventory error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to search inventory items'
            });
        }
    }

    // PUT /api/v1/inventory/:id - Update inventory item
    async updateInventoryItem(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Inventory item ID is required'
                });
                return;
            }

            const updateData = {
                description: req.body.description,
                category: req.body.category,
                quantity: req.body.quantity ? parseInt(req.body.quantity) : undefined,
                location: req.body.location,
                updatedBy: req.body.userId || req.user?.id,
            };

            // Remove undefined values
            Object.keys(updateData).forEach(key => {
                if (updateData[key] === undefined) {
                    delete updateData[key];
                }
            });

            const updatedItem = await inventoryService.updateInventoryItem(id, updateData);

            res.status(200).json({
                success: true,
                message: 'Inventory item updated successfully',
                data: updatedItem
            });
        } catch (error) {
            console.error('Update inventory error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to update inventory item'
            });
        }
    }

    // DELETE /api/v1/inventory/:id - Delete inventory item
    async deleteInventoryItem(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Inventory item ID is required'
                });
                return;
            }

            await inventoryService.deleteInventoryItem(id);

            res.status(200).json({
                success: true,
                message: 'Inventory item deleted successfully'
            });
        } catch (error) {
            console.error('Delete inventory error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to delete inventory item'
            });
        }
    }

    // POST /api/v1/inventory/:id/reprocess-ocr - Reprocess OCR for an item
    async reprocessOCR(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;
            const { provider } = req.body;

            if (!id) {
                res.status(400).json({
                    success: false,
                    message: 'Inventory item ID is required'
                });
                return;
            }

            const updatedItem = await inventoryService.reprocessOCR(id, provider);

            res.status(200).json({
                success: true,
                message: 'OCR reprocessing initiated successfully',
                data: updatedItem
            });
        } catch (error) {
            console.error('Reprocess OCR error:', error);
            const statusCode = error.message.includes('not found') ? 404 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to reprocess OCR'
            });
        }
    }

    // GET /api/v1/inventory/stats - Get inventory statistics
    async getInventoryStats(req: Request, res: Response): Promise<void> {
        try {
            const stats = await inventoryService.getInventoryStats();

            res.status(200).json({
                success: true,
                message: 'Inventory statistics retrieved successfully',
                data: stats
            });
        } catch (error) {
            console.error('Get inventory stats error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to retrieve inventory statistics'
            });
        }
    }
}

// Export singleton instance
export const inventoryController = new InventoryController();
export { InventoryController }; 