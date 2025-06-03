import express from 'express';
import { Container } from 'inversify';
import examplesRouter from 'src/controllers/examples/router';
import repackRouter from 'src/routers/repack.route';

export default function RouterV1(container: Container): express.Router {
    const router = express.Router();
    router
        .use('/healthcheck', examplesRouter)
        .use('/examples', examplesRouter)
        .use('/repack', repackRouter(container));

    return router;
}
