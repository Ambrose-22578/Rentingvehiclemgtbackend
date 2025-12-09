import { getDbPool } from "../db/config.js";

interface VehicleSpec {
  vehicle_spec_id: number;
  manufacturer: string;
  model: string;
  year: number;
  fuel_type: string | null;
  engine_capacity: string | null;
  transmission: string | null;
  seating_capacity: number | null;
  color: string | null;
  features: string | null;
  image1: string | null;
  image2: string | null;
  image3: string | null;
}

interface VehicleResponse {
  vehicle_id: number;
  vehicle_spec_id: number;
  manufacturer: string;
  model: string;
  year: number;
  fuel_type: string | null;
  engine_capacity: string | null;
  transmission: string | null;
  seating_capacity: number | null;
  color: string | null;
  features: string | null;
  image1: string | null;
  image2: string | null;
  image3: string | null;
  rental_rate: number;
  availability: string;
  created_at: string;
  updated_at: string;
}


// Get ALL Vehicles with 3 images

export const getAllVehiclesService = async (): Promise<VehicleResponse[]> => {
  const db = getDbPool();
  const query = `
    SELECT 
      v.vehicle_id, v.vehicle_spec_id, v.rental_rate, v.availability,
      v.created_at, v.updated_at,
      vs.manufacturer, vs.model, vs.year, vs.fuel_type, vs.engine_capacity,
      vs.transmission, vs.seating_capacity, vs.color, vs.features,
      vs.image1, vs.image2, vs.image3
    FROM Vehicles v
    JOIN VehicleSpecifications vs 
      ON v.vehicle_spec_id = vs.vehicle_spec_id
  `;

  const result = await db.request().query(query);
  return result.recordset;
};


// Get ONE Vehicle with 3 images

export const getVehicleByIdService = async (
  vehicle_id: number
): Promise<VehicleResponse | null> => {
  const db = getDbPool();
  const query = `
    SELECT 
      v.vehicle_id, v.vehicle_spec_id, v.rental_rate, v.availability,
      v.created_at, v.updated_at,
      vs.manufacturer, vs.model, vs.year, vs.fuel_type, vs.engine_capacity,
      vs.transmission, vs.seating_capacity, vs.color, vs.features,
      vs.image1, vs.image2, vs.image3
    FROM Vehicles v
    JOIN VehicleSpecifications vs 
      ON v.vehicle_spec_id = vs.vehicle_spec_id
    WHERE v.vehicle_id = @vehicle_id
  `;

  const result = await db.request()
    .input("vehicle_id", vehicle_id)
    .query(query);

  return result.recordset[0] || null;
};


// Create Vehicle (images come from specs, NOT here)

export const createVehicleService = async (
  vehicle_spec_id: number,
  rental_rate: number,
  availability: string = "Available"
): Promise<VehicleResponse | string> => {
  const db = getDbPool();

  const insertQuery = `
    INSERT INTO Vehicles (vehicle_spec_id, rental_rate, availability)
    OUTPUT INSERTED.*
    VALUES (@vehicle_spec_id, @rental_rate, @availability)
  `;

  const inserted = await db.request()
    .input("vehicle_spec_id", vehicle_spec_id)
    .input("rental_rate", rental_rate)
    .input("availability", availability)
    .query(insertQuery);

  if (!inserted.recordset[0]) return "Failed to create vehicle";

  const vehicle_id = inserted.recordset[0].vehicle_id;

  return await getVehicleByIdService(vehicle_id) as VehicleResponse;
};


// Update Vehicle

export const updateVehicleService = async (
  vehicle_id: number,
  rental_rate?: number,
  availability?: string
): Promise<VehicleResponse | null> => {
  const db = getDbPool();

  const updateQuery = `
    UPDATE Vehicles
    SET
      rental_rate = COALESCE(@rental_rate, rental_rate),
      availability = COALESCE(@availability, availability),
      updated_at = GETDATE()
    OUTPUT INSERTED.*
    WHERE vehicle_id = @vehicle_id
  `;

  const updated = await db.request()
    .input("vehicle_id", vehicle_id)
    .input("rental_rate", rental_rate ?? null)
    .input("availability", availability ?? null)
    .query(updateQuery);

  if (!updated.recordset[0]) return null;

  return await getVehicleByIdService(vehicle_id);
};


// Delete Vehicle

export const deleteVehicleService = async (vehicle_id: number): Promise<string> => {
  const db = getDbPool();

  const result = await db.request()
    .input("vehicle_id", vehicle_id)
    .query("DELETE FROM Vehicles WHERE vehicle_id = @vehicle_id");

  return result.rowsAffected[0] === 1
    ? "Vehicle deleted successfully 🎉"
    : "Failed to delete vehicle";
};
