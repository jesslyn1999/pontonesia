import express from 'express';
import AuthController from '../../controllers/auth/controller';

const router = express.Router();

// Registration and login
router.post('/register', AuthController.register.bind(AuthController));
router.post('/login', AuthController.login.bind(AuthController));
router.post('/logout', AuthController.logout.bind(AuthController));

// Google OAuth routes
router.get('/google', AuthController.googleAuth.bind(AuthController));
router.get('/google/callback', AuthController.googleCallback.bind(AuthController));

// User information
router.get('/user', AuthController.getCurrentUser.bind(AuthController));
router.get('/check', AuthController.checkAuth.bind(AuthController));

export default router; 