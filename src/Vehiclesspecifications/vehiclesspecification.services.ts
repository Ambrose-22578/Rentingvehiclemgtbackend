import { getDbPool } from "../db/config.js";

interface VehicleSpecResponse {
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

  // NEW
  image1: string | null;
  image2: string | null;
  image3: string | null;
}

// ==============================
// GET ALL VEHICLE SPECIFICATIONS
// ==============================
export const getAllVehicleSpecsService = async (): Promise<VehicleSpecResponse[]> => {
  const db = getDbPool();
  const result = await db.request().query(`
    SELECT 
      vehicle_spec_id, manufacturer, model, year, fuel_type, engine_capacity,
      transmission, seating_capacity, color, features,
      image1, image2, image3
    FROM VehicleSpecifications
  `);
  return result.recordset;
};

// ==============================
// GET SPECIFICATION BY ID
// ==============================
export const getVehicleSpecByIdService = async (
  vehicle_spec_id: number
): Promise<VehicleSpecResponse | null> => {
  const db = getDbPool();
  const result = await db
    .request()
    .input("vehicle_spec_id", vehicle_spec_id)
    .query(`
      SELECT 
        vehicle_spec_id, manufacturer, model, year, fuel_type, engine_capacity,
        transmission, seating_capacity, color, features,
        image1, image2, image3
      FROM VehicleSpecifications
      WHERE vehicle_spec_id = @vehicle_spec_id
    `);

  return result.recordset[0] || null;
};

// ==============================
// CREATE VEHICLE SPECIFICATION
// ==============================
export const createVehicleSpecService = async (
  manufacturer: string,
  model: string,
  year: number,
  fuel_type: string,
  engine_capacity: string,
  transmission: string,
  seating_capacity: number,
  color: string,
  features: string,
  image1: string | null,
  image2: string | null,
  image3: string | null
): Promise<VehicleSpecResponse> => {
  const db = getDbPool();
  const result = await db
    .request()
    .input("manufacturer", manufacturer)
    .input("model", model)
    .input("year", year)
    .input("fuel_type", fuel_type)
    .input("engine_capacity", engine_capacity)
    .input("transmission", transmission)
    .input("seating_capacity", seating_capacity)
    .input("color", color)
    .input("features", features)

    // NEW IMAGE INPUTS
    .input("image1", image1)
    .input("image2", image2)
    .input("image3", image3)

    .query(`
      INSERT INTO VehicleSpecifications 
      (manufacturer, model, year, fuel_type, engine_capacity, transmission, seating_capacity, color, features, image1, image2, image3)
      OUTPUT INSERTED.*
      VALUES 
      (@manufacturer, @model, @year, @fuel_type, @engine_capacity, @transmission, @seating_capacity, @color, @features, @image1, @image2, @image3)
    `);

  return result.recordset[0];
};

// ==============================
// UPDATE VEHICLE SPECIFICATION
// ==============================
export const updateVehicleSpecService = async (
  vehicle_spec_id: number,
  manufacturer: string,
  model: string,
  year: number,
  fuel_type: string,
  engine_capacity: string,
  transmission: string,
  seating_capacity: number,
  color: string,
  features: string,
  image1: string | null,
  image2: string | null,
  image3: string | null
): Promise<VehicleSpecResponse | null> => {
  const db = getDbPool();
  const result = await db
    .request()
    .input("vehicle_spec_id", vehicle_spec_id)
    .input("manufacturer", manufacturer)
    .input("model", model)
    .input("year", year)
    .input("fuel_type", fuel_type)
    .input("engine_capacity", engine_capacity)
    .input("transmission", transmission)
    .input("seating_capacity", seating_capacity)
    .input("color", color)
    .input("features", features)

    // NEW IMAGE INPUTS
    .input("image1", image1)
    .input("image2", image2)
    .input("image3", image3)

    .query(`
      UPDATE VehicleSpecifications
      SET 
        manufacturer = @manufacturer,
        model = @model,
        year = @year,
        fuel_type = @fuel_type,
        engine_capacity = @engine_capacity,
        transmission = @transmission,
        seating_capacity = @seating_capacity,
        color = @color,
        features = @features,
        image1 = @image1,
        image2 = @image2,
        image3 = @image3
      OUTPUT INSERTED.*
      WHERE vehicle_spec_id = @vehicle_spec_id
    `);

  return result.recordset[0] || null;
};

// ==============================
// DELETE VEHICLE SPECIFICATION
// ==============================
export const deleteVehicleSpecService = async (
  vehicle_spec_id: number
): Promise<boolean> => {
  const db = getDbPool();
  const result = await db
    .request()
    .input("vehicle_spec_id", vehicle_spec_id)
    .query("DELETE FROM VehicleSpecifications WHERE vehicle_spec_id = @vehicle_spec_id");

  return result.rowsAffected[0] === 1;
};
