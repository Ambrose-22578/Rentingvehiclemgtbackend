// controllers/payments.controllers.ts
import  type { Context } from "hono";
import { getDbPool } from "../db/config.js";

/* 
   GET ALL PAYMENTS (Admin only)
   Includes vehicle images from VehicleSpecifications (image1, image2, image3)
    */
export const getAllPayments = async (c: Context) => {
  try {
    const db = getDbPool();
    const result = await db.request().query(`
      SELECT 
        p.*,

        -- Booking details
        b.booking_date, b.return_date, b.total_amount, b.booking_status,

        -- User
        u.user_id AS u_id, u.first_name, u.last_name, u.email,

        -- Vehicle 
        v.vehicle_id AS v_id, v.rental_rate, v.availability,

        -- Vehicle specs (INCLUDES IMAGES)
        vs.manufacturer, vs.model, vs.year,
        vs.image1, vs.image2, vs.image3

      FROM Payments p
      INNER JOIN Bookings b ON p.booking_id = b.booking_id
      INNER JOIN Users u ON b.user_id = u.user_id
      INNER JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
      INNER JOIN VehicleSpecifications vs ON v.vehicle_spec_id = vs.vehicle_spec_id
      ORDER BY p.payment_id DESC
    `);

    return c.json(result.recordset, 200);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return c.json({ error: "Failed to fetch payments" }, 500);
  }
};

/* 
   GET PAYMENT BY ID (Admin only)
    */
export const getPaymentById = async (c: Context) => {
  try {
    const payment_id = parseInt(c.req.param("payment_id"));
    const db = getDbPool();

    const result = await db.request()
      .input("payment_id", payment_id)
      .query(`
        SELECT 
          p.*,
          b.booking_date, b.return_date, b.total_amount, b.booking_status,
          u.user_id AS u_id, u.first_name, u.last_name, u.email,
          v.vehicle_id AS v_id, v.rental_rate, v.availability,
          vs.manufacturer, vs.model, vs.year,
          vs.image1, vs.image2, vs.image3
        FROM Payments p
        INNER JOIN Bookings b ON p.booking_id = b.booking_id
        INNER JOIN Users u ON b.user_id = u.user_id
        INNER JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
        INNER JOIN VehicleSpecifications vs ON v.vehicle_spec_id = vs.vehicle_spec_id
        WHERE p.payment_id = @payment_id
      `);

    if (result.recordset.length === 0)
      return c.json({ error: "Payment not found" }, 404);

    return c.json(result.recordset[0], 200);

  } catch (error) {
    console.error("Error fetching payment:", error);
    return c.json({ error: "Failed to fetch payment" }, 500);
  }
};

/* 
   CREATE PAYMENT (User/Admin)
    */
export const createPayment = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { booking_id, amount, payment_method, transaction_id, payment_status } = body;

    const db = getDbPool();

    const result = await db.request()
      .input("booking_id", booking_id)
      .input("amount", amount)
      .input("payment_method", payment_method)
      .input("transaction_id", transaction_id)
      .input("payment_status", payment_status || "Completed")
      .query(`
        INSERT INTO Payments (booking_id, amount, payment_method, transaction_id, payment_status)
        OUTPUT INSERTED.*
        VALUES (@booking_id, @amount, @payment_method, @transaction_id, @payment_status)
      `);

    return c.json({
      message: "Payment created successfully",
      payment: result.recordset[0]
    }, 201);

  } catch (error) {
    console.error("Error creating payment:", error);
    return c.json({ error: "Failed to create payment" }, 500);
  }
};

/* 
   UPDATE PAYMENT (Admin only)
    */
export const updatePayment = async (c: Context) => {
  try {
    const payment_id = parseInt(c.req.param("payment_id"));
    const body = await c.req.json();

    const updates: string[] = [];
    const db = getDbPool();
    const req = db.request().input("payment_id", payment_id);

    if (body.payment_status) {
      updates.push("payment_status=@payment_status");
      req.input("payment_status", body.payment_status);
    }

    if (body.payment_method) {
      updates.push("payment_method=@payment_method");
      req.input("payment_method", body.payment_method);
    }

    if (body.transaction_id) {
      updates.push("transaction_id=@transaction_id");
      req.input("transaction_id", body.transaction_id);
    }

    if (updates.length === 0)
      return c.json({ error: "No fields to update" }, 400);

    const result = await req.query(`
      UPDATE Payments 
      SET ${updates.join(", ")}, updated_at=GETDATE()
      OUTPUT INSERTED.*
      WHERE payment_id=@payment_id
    `);

    if (result.recordset.length === 0)
      return c.json({ error: "Payment not found" }, 404);

    return c.json({
      message: "Payment updated successfully",
      payment: result.recordset[0]
    }, 200);

  } catch (error) {
    console.error("Error updating payment:", error);
    return c.json({ error: "Failed to update payment" }, 500);
  }
};

/* 
   DELETE PAYMENT (Admin only)
    */
export const deletePayment = async (c: Context) => {
  try {
    const payment_id = parseInt(c.req.param("payment_id"));

    const db = getDbPool();
    const result = await db.request()
      .input("payment_id", payment_id)
      .query(`DELETE FROM Payments WHERE payment_id=@payment_id`);

    if (result.rowsAffected[0] === 0)
      return c.json({ error: "Payment not found" }, 404);

    return c.json({ message: "Payment deleted successfully" }, 200);

  } catch (error) {
    console.error("Error deleting payment:", error);
    return c.json({ error: "Failed to delete payment" }, 500);
  }
};
