import { Hono } from 'hono';
import * as bookingControllers from './bookings.controllers.js';
import { bothRolesAuth, adminAuth } from '../middlewares/bearersAuth.js';

const bookingRoutes = new Hono();

// ✅ GET endpoints – authenticated users can view their bookings (admin sees all)
bookingRoutes.get('/bookings', bothRolesAuth, bookingControllers.getAllBookings);
bookingRoutes.get('/bookings/:booking_id', bothRolesAuth, bookingControllers.getBookingById);

// ✅ POST – authenticated users can create bookings
bookingRoutes.post('/bookings', bothRolesAuth, bookingControllers.createBooking);

// ✅ PATCH – users can cancel their own bookings (NEW ENDPOINT)
bookingRoutes.patch('/bookings/:booking_id/cancel', bothRolesAuth, bookingControllers.cancelBooking);

// ✅ PUT/DELETE – admin only can update or delete bookings
bookingRoutes.put('/bookings/:booking_id', adminAuth, bookingControllers.updateBooking);
bookingRoutes.delete('/bookings/:booking_id', adminAuth, bookingControllers.deleteBooking);

// // ✅ Optional: Get user's own bookings
// bookingRoutes.get('/my-bookings', bothRolesAuth, async (c) => {
//   try {
//     const authUser = c.get("user");
//     if (!authUser) return c.json({ error: "Authentication required" }, 401);

//     const allBookings = await bookingControllers.getAllBookings(c);
//     const response = await allBookings.json();
    
//     // Filter to only current user's bookings
//     if (response.success) {
//       const userBookings = response.data.filter((b: any) => b.user_id === authUser.user_id);
//       return c.json({
//         success: true,
//         count: userBookings.length,
//         data: userBookings
//       }, 200);
//     }
    
//     return allBookings;
//   } catch (error) {
//     return c.json({ success: false, error: "Failed to fetch user bookings" }, 500);
//   }
// });

// // ✅ Optional: Check vehicle availability
// bookingRoutes.get('/availability', bothRolesAuth, async (c) => {
//   try {
//     const { vehicle_id, booking_date, return_date } = c.req.query();
    
//     if (!vehicle_id || !booking_date || !return_date) {
//       return c.json({ 
//         success: false, 
//         error: "Missing required parameters: vehicle_id, booking_date, return_date" 
//       }, 400);
//     }

//     // Check for overlapping bookings
//     const db = getDbPool(); // You need to import getDbPool
//     const query = `
//       SELECT COUNT(*) as overlapping_bookings
//       FROM Bookings 
//       WHERE vehicle_id = @vehicle_id
//         AND booking_status != 'Cancelled'
//         AND (
//           (booking_date <= @return_date AND return_date >= @booking_date)
//         )
//     `;

//     const result = await db.request()
//       .input("vehicle_id", parseInt(vehicle_id))
//       .input("booking_date", new Date(booking_date))
//       .input("return_date", new Date(return_date))
//       .query(query);

//     const available = result.recordset[0].overlapping_bookings === 0;
    
//     return c.json({
//       success: true,
//       available,
//       message: available 
//         ? "Vehicle is available for the selected dates" 
//         : "Vehicle is not available for the selected dates"
//     }, 200);
    
//   } catch (error) {
//     console.error("Error checking availability:", error);
//     return c.json({ success: false, error: "Failed to check availability" }, 500);
//   }
// });

export default bookingRoutes;