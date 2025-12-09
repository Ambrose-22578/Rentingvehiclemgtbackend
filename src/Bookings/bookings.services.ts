import { getDbPool } from "../db/config.js";
import nodemailer from "nodemailer";

/* 
   UPDATED BOOKING RESPONSE TYPE
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

  // VehicleSpecifications (Images added)
  manufacturer?: string;
  model?: string;
  year?: number;
  fuel_type?: string;
  engine_capacity?: string;
  transmission?: string;
  seating_capacity?: number;
  color?: string;
  features?: string;

  // ADD IMAGES HERE
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
};

/* 
   GET ALL BOOKINGS (UPDATED)
 */
export const getAllBookingsService = async (): Promise<BookingResponse[]> => {
  const db = getDbPool();

  const query = `
    SELECT 
      b.*,
      u.first_name, u.last_name, u.email, u.contact_phone, u.address, u.role,

      v.rental_rate, v.availability,

      -- UPDATED: USING SPECIFICATION IMAGES
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
   GET BOOKING BY ID (UPDATED)
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

      -- UPDATED IMAGES
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
   CREATE BOOKING (UPDATED)
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
   DELETE BOOKING
 */
export const deleteBookingService = async (booking_id: number): Promise<string> => {
  const db = getDbPool();

  const booking = await getBookingByIdService(booking_id);
  if (typeof booking === "string") return booking;

  const result = await db
    .request()
    .input("booking_id", booking_id)
    .query("DELETE FROM Bookings WHERE booking_id=@booking_id");

  if (result.rowsAffected[0] !== 1) return "Failed to delete booking";

  // Reset vehicle availability
  await db
    .request()
    .input("vehicle_id", (booking as BookingResponse).vehicle_id)
    .query(`
      UPDATE Vehicles SET availability='Available', updated_at=GETDATE()
      WHERE vehicle_id=@vehicle_id
    `);

  return "Booking deleted successfully 🎉";
};
