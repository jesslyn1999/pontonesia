import express from 'express';

export default express
    .Router()
    .post('/', controller.create)
    .get('/', controller.all)
    .get('/:id', controller.byId);
