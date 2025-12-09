import { Hono } from 'hono';
import * as bookingControllers from './bookings.controllers.js';
import { bothRolesAuth, adminAuth } from '../middlewares/bearersAuth.js';

const bookingRoutes = new Hono();

// ✅ GET endpoints – authenticated users can view their bookings (admin sees all)
bookingRoutes.get('/bookings', bothRolesAuth, bookingControllers.getAllBookings);
bookingRoutes.get('/bookings/:booking_id', bothRolesAuth, bookingControllers.getBookingById);

// ✅ POST – authenticated users can create bookings
bookingRoutes.post('/bookings', bothRolesAuth, bookingControllers.createBooking);

// ✅ PUT/DELETE – admin only can update or delete bookings
bookingRoutes.put('/bookings/:booking_id', adminAuth, bookingControllers.updateBooking);
bookingRoutes.delete('/bookings/:booking_id', adminAuth, bookingControllers.deleteBooking);

export default bookingRoutes;
