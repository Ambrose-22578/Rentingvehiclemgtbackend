import { Hono } from 'hono';
import { 
    register, 
    login, 
    logout, 
    getCurrentUser 
} from '../controllers/auth.controllers.js';
import { 
    forgotPassword, 
    verifyResetToken, 
    resetPassword 
} from '../controllers/auth.controllers.js';
import { bothRolesAuth } from '../middlewares/bearersAuth.js';

const authRoutes = new Hono();

// ✅ POST - Register a new user
authRoutes.post('/register', register);

// ✅ POST - Login user
authRoutes.post('/login', login);

// ✅ POST - Forgot password
authRoutes.post('/forgot-password', forgotPassword);

// ✅ GET - Verify reset token
authRoutes.get('/verify-reset-token/:token', verifyResetToken);

// ✅ POST - Reset password
authRoutes.post('/reset-password', resetPassword);

// ✅ GET - Get current user (protected)
authRoutes.get('/me', bothRolesAuth, getCurrentUser);

// ✅ POST - Logout user (protected)
authRoutes.post('/logout', bothRolesAuth, logout);

export default authRoutes;