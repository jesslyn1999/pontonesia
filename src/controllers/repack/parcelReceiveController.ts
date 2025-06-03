import { Request, Response } from 'express';
import { ParcelReceiveService } from 'src/services/repack/parcelReceiveService';

export class ParcelReceiveController {
    constructor(private readonly parcelReceiveService: ParcelReceiveService) {
        this.parcelReceiveService = parcelReceiveService;
    }
    async create(req: Request, res: Response): Promise<void> {
        try {
            const data = await this.parcelReceiveService.create(req.body);
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
    all(_: Request, res: Response): void {
        res.status(200).json({ message: 'Parcel received' });
    }

    byId(req: Request, res: Response): void {
        res.status(200).json({ message: 'Parcel received by Id' });
    }
}
