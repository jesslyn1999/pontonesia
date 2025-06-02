import express from 'express';
import controller from './controller';

export default express
  .Router()
  .post('/login', controller.login)
  .post('/register', controller.register)
  .post('/logout', controller.logout)
  .get('/current-user', controller.getCurrentUser)
  .get('/check-auth', controller.checkAuth)
  .get('/google', controller.googleAuth)
  .get('/google/callback', controller.googleCallback)
