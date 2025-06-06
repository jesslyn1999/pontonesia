import logger from 'src/libs/logger';
import { Request, Response } from 'express';
import { IParcelReceiveService } from 'src/services/repack/parcelReceiveService';
import { injectable, inject } from 'inversify';
import * as TYPES from 'src/api/ioc/ioc.type';

export interface IParcelReceiveController {
    create(req: Request, res: Response): Promise<void>;
    all(req: Request, res: Response): Promise<void>;
    byId(req: Request, res: Response): Promise<void>;
    update?(req: Request, res: Response): Promise<void>;
    delete?(req: Request, res: Response): Promise<void>;
}

@injectable()
export class ParcelReceiveController implements IParcelReceiveController {
    constructor(
        @inject(TYPES.ParcelReceiveService)
        private readonly parcelReceiveService: IParcelReceiveService
    ) {
        this.parcelReceiveService = parcelReceiveService;
    }

    async create(req: Request, res: Response): Promise<void> {
        try {
            const data = await this.parcelReceiveService.create({
                ...req.files,
                ...req.body,
            });
            res.status(200).json(data);
        } catch (error) {
            logger.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async all(req: Request, res: Response): Promise<void> {
        try {
            // TODO: Implement getAll method in ParcelReceiveService
            res.status(501).json({
                message: 'Get all parcels endpoint not yet implemented',
                note: 'Requires implementation of getAll method in ParcelReceiveService',
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async byId(req: Request, res: Response): Promise<void> {
        try {
            // TODO: Implement getById method in ParcelReceiveService
            const { id } = req.params;
            res.status(501).json({
                message: `Get parcel by ID (${id}) endpoint not yet implemented`,
                note: 'Requires implementation of getById method in ParcelReceiveService',
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async update(req: Request, res: Response): Promise<void> {
        try {
            // TODO: Implement update method in ParcelReceiveService
            const { id } = req.params;
            res.status(501).json({
                message: `Update parcel (${id}) endpoint not yet implemented`,
                note: 'Requires implementation of update method in ParcelReceiveService',
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async delete(req: Request, res: Response): Promise<void> {
        try {
            // TODO: Implement delete method in ParcelReceiveService
            const { id } = req.params;
            res.status(501).json({
                message: `Delete parcel (${id}) endpoint not yet implemented`,
                note: 'Requires implementation of delete method in ParcelReceiveService',
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
