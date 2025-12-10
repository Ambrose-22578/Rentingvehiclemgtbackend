import { getDbPool } from "../db/config.js";
import nodemailer from "nodemailer";

/* 
   UPDATED BOOKING RESPONSE TYPE WITH CANCELLATION FIELDS
 */
export interface BookingResponse {
  booking_id: number;
  user_id: number;
  vehicle_id: number;
  booking_date: string;
  return_date: string;
  total_amount: number;
  booking_status: string;
  created_at: string;
  updated_at: string;
  
  // NEW CANCELLATION FIELDS
  cancellation_reason?: string;
  cancelled_at?: string;
  refund_amount?: number;
  refund_status?: string;

  // Users
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_phone?: string;
  address?: string;
  role?: string;

  // Vehicles
  rental_rate?: number;
  availability?: string;

  // VehicleSpecifications
  manufacturer?: string;
  model?: string;
  year?: number;
  fuel_type?: string;
  engine_capacity?: string;
  transmission?: string;
  seating_capacity?: number;
  color?: string;
  features?: string;
  image1?: string;
  image2?: string;
  image3?: string;

  // Payments
  payment_id?: number;
  payment_status?: string;
  payment_date?: string;
  payment_method?: string;
  transaction_id?: string;
}

/* 
   EMAIL (Booking Confirmation)
 */
export const sendBookingEmail = async (
  email: string,
  firstName: string,
  bookingId: number,
  booking_date: string,
  return_date: string,
  total_amount: number
) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `"Vehicle Rental" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "🚗 Booking Confirmed – Vehicle Rental",
      html: `
        <h2>Hello ${firstName},</h2>
        <p>Your booking has been successfully created 🎉</p>

        <h3>Booking Details</h3>
        <p><strong>Booking ID:</strong> ${bookingId}</p>
        <p><strong>Pickup Date:</strong> ${booking_date}</p>
        <p><strong>Return Date:</strong> ${return_date}</p>
        <p><strong>Total Amount:</strong> KES ${total_amount}</p>

        <br/>
        <p>Thank you for choosing our vehicle rental service 🚗💨</p>
      `,
    });
  } catch (error) {
    console.error("Error sending booking email:", error);
  }
};

/* 
   SEND CANCELLATION EMAIL
 */
export const sendCancellationEmail = async (
  user_id: number,
  booking_id: number,
  cancellation_reason: string,
  refund_amount: number
) => {
  try {
    const db = getDbPool();
    
    // Get user and booking details
    const query = `
      SELECT 
        u.email, u.first_name,
        b.booking_date, b.total_amount,
        vs.manufacturer, vs.model
      FROM Users u
      INNER JOIN Bookings b ON u.user_id = b.user_id
      INNER JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
      INNER JOIN VehicleSpecifications vs ON v.vehicle_spec_id = vs.vehicle_spec_id
      WHERE b.booking_id = @booking_id AND u.user_id = @user_id
    `;
    
    const result = await db.request()
      .input("booking_id", booking_id)
      .input("user_id", user_id)
      .query(query);
    
    if (result.recordset.length === 0) return;
    
    const { email, first_name, booking_date, total_amount, manufacturer, model } = result.recordset[0];
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    
    // Email content
    const subject = "🚗 Booking Cancelled – Vehicle Rental";
    const html = `
      <h2>Hello ${first_name},</h2>
      <p>Your booking has been cancelled.</p>
      
      <h3>Booking Details</h3>
      <p><strong>Booking ID:</strong> ${booking_id}</p>
      <p><strong>Vehicle:</strong> ${manufacturer} ${model}</p>
      <p><strong>Original Booking Date:</strong> ${new Date(booking_date).toLocaleDateString()}</p>
      <p><strong>Original Amount:</strong> KES ${total_amount}</p>
      <p><strong>Cancellation Reason:</strong> ${cancellation_reason}</p>
      
      <h3>Refund Information</h3>
      <p><strong>Refund Amount:</strong> KES ${refund_amount.toFixed(2)}</p>
      ${refund_amount > 0 
        ? `<p>Your refund will be processed within 5-7 business days.</p>` 
        : `<p>No refund applicable based on cancellation policy.</p>`}
      
      <br/>
      <p>We hope to serve you again in the future! 🚗</p>
    `;
    
    await transporter.sendMail({
      from: `"Vehicle Rental" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html,
    });
    
  } catch (error) {
    console.error("Error sending cancellation email:", error);
  }
};

/* 
   GET ALL BOOKINGS
 */
export const getAllBookingsService = async (): Promise<BookingResponse[]> => {
  const db = getDbPool();

  const query = `
    SELECT 
      b.*,
      u.first_name, u.last_name, u.email, u.contact_phone, u.address, u.role,
      v.rental_rate, v.availability,
      vs.manufacturer, vs.model, vs.year,
      vs.fuel_type, vs.engine_capacity, vs.transmission, vs.seating_capacity, vs.color, vs.features,
      vs.image1, vs.image2, vs.image3,
      p.payment_id, p.payment_status, p.payment_date, p.payment_method, p.transaction_id
    FROM Bookings b
    INNER JOIN Users u ON b.user_id = u.user_id
    INNER JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
    INNER JOIN VehicleSpecifications vs ON v.vehicle_spec_id = vs.vehicle_spec_id
    LEFT JOIN Payments p ON b.booking_id = p.booking_id
    ORDER BY b.created_at DESC
  `;

  const result = await db.request().query(query);
  return result.recordset;
};

/* 
   GET BOOKING BY ID
 */
export const getBookingByIdService = async (
  booking_id: number
): Promise<BookingResponse | string> => {
  const db = getDbPool();

  const query = `
    SELECT 
      b.*,
      u.first_name, u.last_name, u.email, u.contact_phone, u.address, u.role,
      v.rental_rate, v.availability,
      vs.manufacturer, vs.model, vs.year,
      vs.fuel_type, vs.engine_capacity, vs.transmission, vs.seating_capacity, vs.color, vs.features,
      vs.image1, vs.image2, vs.image3,
      p.payment_id, p.payment_status, p.payment_date, p.payment_method, p.transaction_id
    FROM Bookings b
    INNER JOIN Users u ON b.user_id = u.user_id
    INNER JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
    INNER JOIN VehicleSpecifications vs ON v.vehicle_spec_id = vs.vehicle_spec_id
    LEFT JOIN Payments p ON b.booking_id = p.booking_id
    WHERE b.booking_id = @booking_id
  `;

  const result = await db.request().input("booking_id", booking_id).query(query);
  return result.recordset[0] || "Booking not found";
};

/* 
   CREATE BOOKING
 */
export const createBookingService = async (
  user_id: number,
  vehicle_id: number,
  booking_date: string,
  return_date: string,
  total_amount: number,
  booking_status: string = "Pending"
): Promise<BookingResponse | string> => {
  const db = getDbPool();

  // Check vehicle availability
  const vehicleCheck = await db
    .request()
    .input("vehicle_id", vehicle_id)
    .query(`
      SELECT v.availability, vs.manufacturer, vs.model 
      FROM Vehicles v
      INNER JOIN VehicleSpecifications vs ON v.vehicle_spec_id = vs.vehicle_spec_id
      WHERE v.vehicle_id=@vehicle_id
    `);

  if (!vehicleCheck.recordset[0]) return "Vehicle not found";

  if (vehicleCheck.recordset[0].availability !== "Available") {
    return `Vehicle ${vehicleCheck.recordset[0].manufacturer} ${vehicleCheck.recordset[0].model} is not available`;
  }

  // Insert booking
  const result = await db
    .request()
    .input("user_id", user_id)
    .input("vehicle_id", vehicle_id)
    .input("booking_date", booking_date)
    .input("return_date", return_date)
    .input("total_amount", total_amount)
    .input("booking_status", booking_status)
    .query(`
      INSERT INTO Bookings (user_id, vehicle_id, booking_date, return_date, total_amount, booking_status)
      OUTPUT INSERTED.*
      VALUES (@user_id, @vehicle_id, @booking_date, @return_date, @total_amount, @booking_status)
    `);

  const newBooking = result.recordset[0];
  if (!newBooking) return "Failed to create booking";

  // Mark vehicle unavailable
  await db
    .request()
    .input("vehicle_id", vehicle_id)
    .query(`
      UPDATE Vehicles SET availability='Unavailable', updated_at=GETDATE()
      WHERE vehicle_id=@vehicle_id
    `);

  // Create initial payment
  await db
    .request()
    .input("booking_id", newBooking.booking_id)
    .input("amount", total_amount)
    .input("payment_status", "Pending")
    .query(`
      INSERT INTO Payments (booking_id, amount, payment_status)
      VALUES (@booking_id, @amount, @payment_status)
    `);

  // Email
  const userResult = await db
    .request()
    .input("user_id", user_id)
    .query("SELECT email, first_name FROM Users WHERE user_id=@user_id");

  const user = userResult.recordset[0];
  if (user) {
    await sendBookingEmail(
      user.email,
      user.first_name,
      newBooking.booking_id,
      newBooking.booking_date,
      newBooking.return_date,
      newBooking.total_amount
    );
  }

  return getBookingByIdService(newBooking.booking_id);
};

/* 
   UPDATE BOOKING
 */
export const updateBookingService = async (
  booking_id: number,
  fieldsToUpdate: Partial<{
    booking_status: string;
    total_amount: number;
    return_date: string;
  }>
): Promise<BookingResponse | string> => {
  const db = getDbPool();

  const updates: string[] = [];
  const request = db.request().input("booking_id", booking_id);

  if (fieldsToUpdate.booking_status) {
    updates.push("booking_status=@booking_status");
    request.input("booking_status", fieldsToUpdate.booking_status);
  }
  if (fieldsToUpdate.total_amount !== undefined) {
    updates.push("total_amount=@total_amount");
    request.input("total_amount", fieldsToUpdate.total_amount);
  }
  if (fieldsToUpdate.return_date) {
    updates.push("return_date=@return_date");
    request.input("return_date", fieldsToUpdate.return_date);
  }

  if (updates.length === 0) return "No fields to update";

  const result = await request.query(`
    UPDATE Bookings 
    SET ${updates.join(",")}, updated_at=GETDATE()
    OUTPUT INSERTED.*
    WHERE booking_id=@booking_id
  `);

  if (!result.recordset[0]) return "Booking not found";

  return getBookingByIdService(booking_id);
};

/* 
   CANCEL BOOKING SERVICE 
 */
export const cancelBookingService = async (
  booking_id: number,
  cancellation_reason: string,
  refund_amount: number,
  refund_status: string
): Promise<BookingResponse | string> => {
  const db = getDbPool();

  console.log(`Starting cancellation for booking ${booking_id}...`);

  try {
    // First, get the booking details with a simpler query
    console.log('1. Getting booking details...');
    const bookingResult = await db.request()
      .input("booking_id", booking_id)
      .query(`
        SELECT b.*, v.vehicle_id as db_vehicle_id, u.email, u.first_name
        FROM Bookings b
        INNER JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
        INNER JOIN Users u ON b.user_id = u.user_id
        WHERE b.booking_id = @booking_id
      `);
    
    if (bookingResult.recordset.length === 0) {
      console.log('Booking not found');
      return "Booking not found";
    }
    
    const booking = bookingResult.recordset[0];
    
    
    let vehicleId = booking.db_vehicle_id || booking.vehicle_id;
    
    // Handle if vehicle_id is an array or weird format
    if (Array.isArray(vehicleId)) {
      console.log('Vehicle ID is an array, extracting first value:', vehicleId);
      vehicleId = vehicleId[0]; // Take the first element
    } else if (typeof vehicleId === 'object' && vehicleId !== null) {
      console.log('Vehicle ID is an object, converting:', vehicleId);
      vehicleId = parseInt(vehicleId.toString());
    }
    
    // Ensure it's a number
    vehicleId = parseInt(vehicleId);
    
    if (isNaN(vehicleId)) {
      console.error('Invalid vehicle_id:', vehicleId);
      return "Invalid vehicle ID in booking record";
    }
    
    console.log('Found booking:', {
      id: booking.booking_id,
      status: booking.booking_status,
      vehicle_id: vehicleId,
      user_id: booking.user_id
    });

    // Check if booking can be cancelled
    if (booking.booking_status === 'Cancelled') {
      return "Booking is already cancelled";
    }

    if (booking.booking_status === 'Completed') {
      return "Cannot cancel a completed booking";
    }

    // 1. Update booking status to Cancelled
    console.log('2. Updating booking status to Cancelled...');
    const updateBookingResult = await db.request()
      .input("booking_id", booking_id)
      .input("cancellation_reason", cancellation_reason)
      .input("refund_amount", refund_amount)
      .input("refund_status", refund_status)
      .query(`
        UPDATE Bookings 
        SET 
          booking_status = 'Cancelled',
          cancellation_reason = @cancellation_reason,
          cancelled_at = GETDATE(),
          refund_amount = @refund_amount,
          refund_status = @refund_status,
          updated_at = GETDATE()
        WHERE booking_id = @booking_id
      `);
    
    console.log('Booking updated, rows affected:', updateBookingResult.rowsAffected[0]);

    // 2. Update vehicle availability to Available
    console.log('3. Updating vehicle availability for vehicle_id:', vehicleId);
    const updateVehicleResult = await db.request()
      .input("vehicle_id", vehicleId)  // Use the corrected vehicle_id
      .query(`
        UPDATE Vehicles 
        SET 
          availability = 'Available',
          updated_at = GETDATE()
        WHERE vehicle_id = @vehicle_id
      `);
    
    console.log('Vehicle availability updated, rows affected:', updateVehicleResult.rowsAffected[0]);

    // 3. Update payment status
    console.log('4. Updating payment status...');
    const updatePaymentResult = await db.request()
      .input("booking_id", booking_id)
      .input("refund_amount", refund_amount)
      .query(`
        UPDATE Payments 
        SET 
          payment_status = CASE 
            WHEN @refund_amount > 0 THEN 'Refunded' 
            ELSE 'Cancelled' 
          END,
          updated_at = GETDATE()
        WHERE booking_id = @booking_id
      `);
    
    console.log('Payment status updated, rows affected:', updatePaymentResult.rowsAffected[0]);

    // 4. Get updated booking with all details
    console.log('5. Fetching updated booking details...');
    const updatedBooking = await getBookingByIdService(booking_id);
    
    if (typeof updatedBooking === "string") {
      console.log('Failed to get updated booking:', updatedBooking);
      return updatedBooking;
    }

    // 5. Send cancellation email
    console.log('6. Sending cancellation email...');
    try {
      await sendCancellationEmail(
        booking.user_id,
        booking_id,
        cancellation_reason,
        refund_amount
      );
      console.log('Cancellation email sent successfully');
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the cancellation if email fails
    }

    console.log('7. Cancellation completed successfully!');
    return updatedBooking;
    
  } catch (error: any) {
    console.error("Error in cancelBookingService:", error.message);
    console.error("Full error stack:", error);
    return "Failed to cancel booking: " + error.message;
  }
};

/* 
   DELETE BOOKING
 */
export const deleteBookingService = async (booking_id: number): Promise<string> => {
  const db = getDbPool();

  const booking = await getBookingByIdService(booking_id);
  if (typeof booking === "string") return booking;

  // Extract vehicle_id properly
  let vehicleId = booking.vehicle_id;
  if (Array.isArray(vehicleId)) {
    vehicleId = vehicleId[0];
  }

  const result = await db
    .request()
    .input("booking_id", booking_id)
    .query("DELETE FROM Bookings WHERE booking_id=@booking_id");

  if (result.rowsAffected[0] !== 1) return "Failed to delete booking";

  // Reset vehicle availability
  await db
    .request()
    .input("vehicle_id", vehicleId)
    .query(`
      UPDATE Vehicles SET availability='Available', updated_at=GETDATE()
      WHERE vehicle_id=@vehicle_id
    `);

  return "Booking deleted successfully 🎉";
};