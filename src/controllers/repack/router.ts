import express from 'express';
import ParcelReceiveController from './parcelReceiveController';


export default express
    .Router()
    .post('/', controller.create)
    .get('/', controller.all)
    .get('/:id', controller.byId);
