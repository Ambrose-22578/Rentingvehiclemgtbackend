import { type Context, type Next } from 'hono';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

// Middleware for both admin and regular users (authentication required)
export const bothRolesAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ message: 'Authorization header missing or invalid' }, 401);
    }

    const token = authHeader.split(' ')[1]; // Extract token
    const decoded = jwt.verify(token, JWT_SECRET); // Verify token

    // Attach decoded user info to context
    c.set('user', decoded);

    await next(); // Continue to the next middleware/handler
  } catch (error: any) {
    console.error('Token verification failed:', error.message);
    return c.json({ message: 'Invalid or expired token' }, 403);
  }
};

// Middleware for admin-only endpoints
export const adminAuth = async (c: Context, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ message: 'Authorization header missing or invalid' }, 401);
    }

    const token = authHeader.split(' ')[1]; // Extract token
    const decoded: any = jwt.verify(token, JWT_SECRET); // Verify token

    // Check if user is admin
    if (decoded.role !== 'admin') {
      return c.json({ message: 'Access denied. Admin privileges required.' }, 403);
    }

    // Attach decoded user info to context
    c.set('user', decoded);

    await next(); // Continue to the next middleware/handler
  } catch (error: any) {
    console.error('Token verification failed:', error.message);
    return c.json({ message: 'Invalid or expired token' }, 403);
  }
};
