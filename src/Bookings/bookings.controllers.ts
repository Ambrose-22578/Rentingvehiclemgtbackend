import { type Context } from "hono";
import * as bookingServices from "./bookings.services.js";

interface AuthUser {
  user_id: number;
  role: string;
  user_type?: string;
  email?: string;
  first_name?: string;
}

/* 
   GET ALL BOOKINGS
 */
export const getAllBookings = async (c: Context) => {
  try {
    const authUser = c.get("user") as AuthUser;
    if (!authUser) return c.json({ error: "Authentication required" }, 401);

    const allBookings = await bookingServices.getAllBookingsService();
    const userRole = authUser.role || authUser.user_type;

    // Filter non-admin users
    const data = userRole !== "admin"
      ? allBookings.filter(b => b.user_id === authUser.user_id)
      : allBookings;

    return c.json({
      success: true,
      count: data.length,
      data,
      message: data.length === 0 ? "No bookings found" : undefined
    }, 200);

  } catch (error: any) {
    console.error("Error fetching bookings:", error.message);
    return c.json({ success: false, error: "Failed to fetch bookings" }, 500);
  }
};

/* 
   GET BOOKING BY ID
 */
export const getBookingById = async (c: Context) => {
  try {
    const booking_id = parseInt(c.req.param("booking_id"));
    const authUser = c.get("user") as AuthUser;
    if (!authUser) return c.json({ error: "Authentication required" }, 401);
    if (isNaN(booking_id) || booking_id <= 0)
      return c.json({ success: false, error: "Invalid booking ID" }, 400);

    const booking = await bookingServices.getBookingByIdService(booking_id);
    if (typeof booking === "string") return c.json({ success: false, error: booking }, 404);

    const userRole = authUser.role || authUser.user_type;
    if (userRole !== "admin" && booking.user_id !== authUser.user_id)
      return c.json({ success: false, error: "Access denied. You can only view your own bookings." }, 403);

    return c.json({ success: true, data: booking }, 200);

  } catch (error: any) {
    console.error("Error fetching booking:", error.message);
    return c.json({ success: false, error: "Failed to fetch booking" }, 500);
  }
};

/* 
   CREATE BOOKING
 */
export const createBooking = async (c: Context) => {
  try {
    const authUser = c.get("user") as AuthUser;
    if (!authUser) return c.json({ error: "Authentication required" }, 401);

    const { user_id, vehicle_id, booking_date, return_date, total_amount, booking_status = "Pending" } = await c.req.json();

    if (!user_id || !vehicle_id || !booking_date || !return_date || total_amount === undefined) {
      return c.json({ success: false, error: "Missing required fields" }, 400);
    }

    const userRole = authUser.role || authUser.user_type;
    if (userRole !== "admin" && user_id !== authUser.user_id) {
      return c.json({ success: false, error: "You can only create bookings for yourself." }, 403);
    }

    const newBooking = await bookingServices.createBookingService(
      user_id,
      vehicle_id,
      booking_date,
      return_date,
      total_amount,
      booking_status
    );

    if (typeof newBooking === "string") {
      return c.json({ success: false, error: newBooking }, 400);
    }

    return c.json({ success: true, message: "Booking created successfully", data: newBooking }, 201);

  } catch (error: any) {
    console.error("Error creating booking:", error.message);
    return c.json({ success: false, error: "Failed to create booking" }, 500);
  }
};

/* 
   UPDATE BOOKING
 */
export const updateBooking = async (c: Context) => {
  try {
    const booking_id = parseInt(c.req.param("booking_id"));
    const authUser = c.get("user") as AuthUser;
    if (!authUser) return c.json({ error: "Authentication required" }, 401);
    if (isNaN(booking_id) || booking_id <= 0)
      return c.json({ success: false, error: "Invalid booking ID" }, 400);

    const fieldsToUpdate: any = await c.req.json();

    const existingBooking = await bookingServices.getBookingByIdService(booking_id);
    if (typeof existingBooking === "string") return c.json({ success: false, error: existingBooking }, 404);

    const userRole = authUser.role || authUser.user_type;
    if (userRole !== "admin" && existingBooking.user_id !== authUser.user_id)
      return c.json({ success: false, error: "Access denied. You can only update your own bookings." }, 403);

    const updatedBooking = await bookingServices.updateBookingService(booking_id, fieldsToUpdate);
    if (typeof updatedBooking === "string") return c.json({ success: false, error: updatedBooking }, 500);

    return c.json({ success: true, message: "Booking updated successfully", data: updatedBooking }, 200);

  } catch (error: any) {
    console.error("Error updating booking:", error.message);
    return c.json({ success: false, error: "Failed to update booking" }, 500);
  }
};

/* 
   CANCEL BOOKING (NEW)
 */
export const cancelBooking = async (c: Context) => {
  try {
    const booking_id = parseInt(c.req.param("booking_id"));
    const authUser = c.get("user") as AuthUser;
    
    if (!authUser) return c.json({ error: "Authentication required" }, 401);
    if (isNaN(booking_id) || booking_id <= 0)
      return c.json({ success: false, error: "Invalid booking ID" }, 400);

    const { cancellation_reason } = await c.req.json();
    
    if (!cancellation_reason || cancellation_reason.trim() === "") {
      return c.json({ success: false, error: "Cancellation reason is required" }, 400);
    }

    // Get existing booking
    const existingBooking = await bookingServices.getBookingByIdService(booking_id);
    if (typeof existingBooking === "string") {
      return c.json({ success: false, error: existingBooking }, 404);
    }

    // Check ownership (users can only cancel their own bookings)
    if (existingBooking.user_id !== authUser.user_id) {
      return c.json({ 
        success: false, 
        error: "Access denied. You can only cancel your own bookings." 
      }, 403);
    }

    // Check if already cancelled
    if (existingBooking.booking_status === 'Cancelled') {
      return c.json({ 
        success: false, 
        error: "Booking is already cancelled" 
      }, 400);
    }

    // Check if completed (can't cancel completed bookings)
    if (existingBooking.booking_status === 'Completed') {
      return c.json({ 
        success: false, 
        error: "Cannot cancel a completed booking" 
      }, 400);
    }

    // Calculate refund based on cancellation policy
    const bookingDate = new Date(existingBooking.booking_date);
    const now = new Date();
    const hoursDifference = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    let refundAmount = 0;
    let refundStatus = 'pending';

    // Refund policy:
    // - 100% refund if cancelled 48+ hours before start
    // - 50% refund if cancelled 24-48 hours before start
    // - No refund if cancelled < 24 hours before start
    if (hoursDifference >= 48) {
      refundAmount = existingBooking.total_amount;
    } else if (hoursDifference >= 24) {
      refundAmount = existingBooking.total_amount * 0.5;
    } else {
      refundAmount = 0;
      refundStatus = 'none';
    }

    // Update booking with cancellation details
    const updatedBooking = await bookingServices.cancelBookingService(
      booking_id,
      cancellation_reason,
      refundAmount,
      refundStatus
    );

    if (typeof updatedBooking === "string") {
      return c.json({ success: false, error: updatedBooking }, 500);
    }

    return c.json({
      success: true,
      message: "Booking cancelled successfully",
      data: updatedBooking,
      refund_amount: refundAmount,
      refund_status: refundStatus
    }, 200);

  } catch (error: any) {
    console.error("Error cancelling booking:", error.message);
    return c.json({ success: false, error: "Failed to cancel booking" }, 500);
  }
};

/* 
   DELETE BOOKING
 */
export const deleteBooking = async (c: Context) => {
  try {
    const booking_id = parseInt(c.req.param("booking_id"));
    const authUser = c.get("user") as AuthUser;
    if (!authUser) return c.json({ error: "Authentication required" }, 401);
    if (isNaN(booking_id) || booking_id <= 0)
      return c.json({ success: false, error: "Invalid booking ID" }, 400);

    const existingBooking = await bookingServices.getBookingByIdService(booking_id);
    if (typeof existingBooking === "string") return c.json({ success: false, error: existingBooking }, 404);

    const userRole = authUser.role || authUser.user_type;
    if (userRole !== "admin" && existingBooking.user_id !== authUser.user_id)
      return c.json({ success: false, error: "Access denied. You can only delete your own bookings." }, 403);

    const result = await bookingServices.deleteBookingService(booking_id);
    if (result.includes("Failed")) return c.json({ success: false, error: result }, 500);

    return c.json({ success: true, message: result }, 200);

  } catch (error: any) {
    console.error("Error deleting booking:", error.message);
    return c.json({ success: false, error: "Failed to delete booking" }, 500);
  }
};