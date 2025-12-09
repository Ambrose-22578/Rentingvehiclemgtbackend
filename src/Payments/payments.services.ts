import { getDbPool } from "../db/config.js";

export interface PaymentResponse {
  payment_id: number;
  booking_id: number;
  amount: number;
  payment_status: string;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  created_at: string;
  updated_at: string;
  booking?: any;
}

/* 
   GET ALL PAYMENTS
*/
export const getAllPaymentsService = async (): Promise<PaymentResponse[]> => {
  const db = getDbPool();

  const query = `
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
  `;

  const result = await db.request().query(query);

  return result.recordset.map(row => ({
    payment_id: row.payment_id,
    booking_id: row.booking_id,
    amount: row.amount,
    payment_status: row.payment_status,
    payment_date: row.payment_date,
    payment_method: row.payment_method,
    transaction_id: row.transaction_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    booking: {
      booking_id: row.booking_id,
      booking_date: row.booking_date,
      return_date: row.return_date,
      total_amount: row.total_amount,
      booking_status: row.booking_status,
      user: {
        user_id: row.u_id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
      },
      vehicle: {
        vehicle_id: row.v_id,
        rental_rate: row.rental_rate,
        availability: row.availability,
        spec: {
          manufacturer: row.manufacturer,
          model: row.model,
          year: row.year,
          images: {
            image1: row.image1,
            image2: row.image2,
            image3: row.image3
          }
        },
      },
    }
  }));
};

/* 
   GET PAYMENT BY ID
*/
export const getPaymentByIdService = async (
  payment_id: number
): Promise<PaymentResponse | null> => {
  const db = getDbPool();

  const query = `
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
  `;

  const result = await db.request().input("payment_id", payment_id).query(query);
  if (result.recordset.length === 0) return null;

  const row = result.recordset[0];

  return {
    payment_id: row.payment_id,
    booking_id: row.booking_id,
    amount: row.amount,
    payment_status: row.payment_status,
    payment_date: row.payment_date,
    payment_method: row.payment_method,
    transaction_id: row.transaction_id,
    created_at: row.created_at,
    updated_at: row.updated_at,
    booking: {
      booking_id: row.booking_id,
      booking_date: row.booking_date,
      return_date: row.return_date,
      total_amount: row.total_amount,
      booking_status: row.booking_status,
      user: {
        user_id: row.u_id,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
      },
      vehicle: {
        vehicle_id: row.v_id,
        rental_rate: row.rental_rate,
        availability: row.availability,
        spec: {
          manufacturer: row.manufacturer,
          model: row.model,
          year: row.year,
          images: {
            image1: row.image1,
            image2: row.image2,
            image3: row.image3
          }
        },
      },
    }
  };
};
