import { Application } from 'express';
import RouterV1 from './router.v1';
import { Container } from 'inversify';

export default function Router(app: Application, container: Container): void {
    app.use('/api/v1', RouterV1(container));
}
