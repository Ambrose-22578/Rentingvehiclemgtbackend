import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import initDatabaseConnection from './db/config.js';
import { logger } from 'hono/logger';
import { prometheus } from '@hono/prometheus';
import userRoutes from './Users/users.routes.js';
import authRoutes from "../src/Auth/auth.routes.js"; // ✅ auth route
import { cors } from 'hono/cors';
import * as authController from './Auth/auth.controllers.js';
import bookingRoutes from './Bookings/bookings.routes.js';
import vehiclesRoutes from './Vehicles/vehicles.routes.js';
import vehicleSpecRoutes from './Vehiclesspecifications/vehiclesspecifications.routes.js';
import customersupportRoutes from './Customersupport/customersupport.routes.js';
import paymentRoutes from './Payments/payments.routes.js';
import dotenv from 'dotenv';


const app = new Hono();
const { printMetrics, registerMetrics } = prometheus();


// Middleware
app.use('*', logger());
app.use('*', registerMetrics);
app.use(cors());

// Prometheus metrics
app.get('/metrics', printMetrics);

// Root route
app.get('/', (c) => c.text('Welcome Restaurant MGNT API'));
app.post('/api/auth/register', authController.registerUser);
app.post('/api/auth/login', authController.loginUser);


// ✅ Mount routes
// app.route('/api', authRoutes);      
app.route('/api', bookingRoutes);
app.route('/api', userRoutes);
app.route('/api', vehiclesRoutes);
app.route('/api', vehicleSpecRoutes);
app.route('/api', customersupportRoutes);
app.route('/api', paymentRoutes);
app.route('/api', authRoutes);

// 404 handler
app.notFound((c) =>
  c.json(
    {
      success: false,
      message: 'Route not found',
      path: c.req.path,
    },
    404
  )
);

// ✅ Initialize DB and start server
initDatabaseConnection()
  .then(() => {
    serve(
      {
        fetch: app.fetch,
        port: 3000,
      },
      (info) => {
        console.log(`✅ Server is running on http://localhost:${info.port}`);
      }
    );
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
  });
