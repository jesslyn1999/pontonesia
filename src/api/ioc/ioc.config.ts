import { Container, inject, injectable } from 'inversify';
import {
    IParcelReceiveController,
    ParcelReceiveController,
} from 'src/controllers/repack/parcelReceiveController';
import {
    FileUploadServiceFactory,
    IFileUploadService,
} from 'src/services/internal/fileUploadService';
import {
    ParcelReceiveService,
    IParcelReceiveService,
} from 'src/services/repack/parcelReceiveService';
import * as TYPES from './ioc.type';
import {
    ISourceParcelRepository,
    SourceParcelRepository,
} from 'src/repositories/SourceParcelRepository';
import { AWS_ENV } from 'src/configs/env';

export default function ioc(container: Container): void {
    // Controllers
    container
        .bind<IParcelReceiveController>(TYPES.ParcelReceiveController)
        .to(ParcelReceiveController);

    // Services
    container
        .bind<IParcelReceiveService>(TYPES.ParcelReceiveService)
        .to(ParcelReceiveService);

    // Repositories
    container
        .bind<ISourceParcelRepository>(TYPES.SourceParcelRepository)
        .to(SourceParcelRepository);

    // Internal Services
    container
        .bind<IFileUploadService>(TYPES.FileUploadService)
        .toDynamicValue(() => {
            return FileUploadServiceFactory.createWithLocalStorage();
        })
        .inSingletonScope();

    container
        .bind<IFileUploadService>(TYPES.S3FileUploadService)
        .toDynamicValue(() => {
            return FileUploadServiceFactory.createWithS3({
                bucketName: AWS_ENV.S3_BUCKET_NAME,
                region: AWS_ENV.REGION,
                accessKeyId: AWS_ENV.ACCESS_KEY_ID,
                secretAccessKey: AWS_ENV.SECRET_ACCESS_KEY,
            });
        })
        .inSingletonScope();
}
