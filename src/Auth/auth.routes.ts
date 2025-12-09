// server/routes/auth.routes.ts
import { Hono } from 'hono'
import * as authControllers from '../../src/Auth/auth.controllers.js'

const authRoutes = new Hono()

// Register and login routes
authRoutes.post('/auth/register', authControllers.registerUser)
authRoutes.post('/auth/login', authControllers.loginUser)

// Forgot password routes
authRoutes.post('/auth/forgot-password', authControllers.forgotPassword)
authRoutes.get('/auth/verify-reset-token/:token', authControllers.verifyResetToken)
authRoutes.post('/auth/reset-password', authControllers.resetPassword)

// Protected routes (optional - if you need them)
// authRoutes.get('/auth/me', authControllers.getCurrentUser)
// authRoutes.post('/auth/logout', authControllers.logout)

export default authRoutes