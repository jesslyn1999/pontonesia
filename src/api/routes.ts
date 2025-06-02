import { Application } from 'express';
import examplesRouter from '../controllers/examples/router';
import inventoryRoutes from '../routes/repack.route';

export default function routes(app: Application): void {
    app.use('/api/v1/healthcheck', examplesRouter);
    app.use('/api/v1/examples', examplesRouter);
    app.use('/api/v1/inventory', inventoryRoutes);
}
