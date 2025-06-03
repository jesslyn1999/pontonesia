import { Container, inject, injectable } from 'inversify';
import { ParcelReceiveController } from 'src/controllers/repack/parcelReceiveController';
import { ParcelRepackModel } from 'src/models/repack/parcel';
import { FileUploadService } from 'src/services/internal/fileUploadService';
import { ParcelReceiveService } from 'src/services/repack/parcelReceiveService';

export default function routes(container: Container): void {
    // Controllers
    container.bind(ParcelReceiveController).toSelf();

    // Services
    container.bind(ParcelReceiveService).toSelf();

    // Models
    container.bind(ParcelRepackModel).toSelf();

    // Internal Services
    container.bind(FileUploadService).toSelf();
}
