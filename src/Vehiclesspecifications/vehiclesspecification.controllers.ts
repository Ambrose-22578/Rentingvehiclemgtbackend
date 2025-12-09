import { type Context } from "hono";
import * as vehicleSpecServices from "./vehiclesspecification.services.js";

// ==============================
// GET ALL VEHICLE SPECS
// ==============================
export const getAllVehicleSpecs = async (c: Context) => {
  try {
    const result = await vehicleSpecServices.getAllVehicleSpecsService();
    if (result.length === 0) {
      return c.json({ message: "No vehicle specifications found" }, 404);
    }
    return c.json(result);
  } catch (error: any) {
    console.error("Error fetching vehicle specs:", error.message);
    return c.json({ error: "Failed to fetch vehicle specifications" }, 500);
  }
};

// ==============================
// GET VEHICLE SPEC BY ID
// ==============================
export const getVehicleSpecById = async (c: Context) => {
  const vehicle_spec_id = parseInt(c.req.param("vehicle_spec_id"));
  try {
    const result = await vehicleSpecServices.getVehicleSpecByIdService(vehicle_spec_id);
    if (!result) return c.json({ error: "Vehicle specification not found" }, 404);
    return c.json(result);
  } catch (error) {
    console.error("Error fetching vehicle spec:", error);
    return c.json({ error: "Failed to fetch vehicle specification" }, 500);
  }
};

// ==============================
// CREATE NEW VEHICLE SPEC
// ==============================
export const createVehicleSpec = async (c: Context) => {
  try {
    const body = await c.req.json();
    const result = await vehicleSpecServices.createVehicleSpecService(
      body.manufacturer,
      body.model,
      body.year,
      body.fuel_type,
      body.engine_capacity,
      body.transmission,
      body.seating_capacity,
      body.color,
      body.features,
      body.image1 ?? null,
      body.image2 ?? null,
      body.image3 ?? null
    );
    return c.json({ message: "Vehicle specification created", vehicle_spec: result }, 201);
  } catch (error) {
    console.error("Error creating vehicle spec:", error);
    return c.json({ error: "Failed to create vehicle specification" }, 500);
  }
};

// ==============================
// UPDATE VEHICLE SPEC
// ==============================
export const updateVehicleSpec = async (c: Context) => {
  const vehicle_spec_id = parseInt(c.req.param("vehicle_spec_id"));
  try {
    const body = await c.req.json();
    const result = await vehicleSpecServices.updateVehicleSpecService(
      vehicle_spec_id,
      body.manufacturer,
      body.model,
      body.year,
      body.fuel_type,
      body.engine_capacity,
      body.transmission,
      body.seating_capacity,
      body.color,
      body.features,
      body.image1 ?? null,
      body.image2 ?? null,
      body.image3 ?? null
    );
    if (!result) return c.json({ error: "Vehicle specification not found" }, 404);
    return c.json({ message: "Vehicle specification updated", vehicle_spec: result });
  } catch (error) {
    console.error("Error updating vehicle spec:", error);
    return c.json({ error: "Failed to update vehicle specification" }, 500);
  }
};

// ==============================
// DELETE VEHICLE SPEC
// ==============================
export const deleteVehicleSpec = async (c: Context) => {
  const vehicle_spec_id = parseInt(c.req.param("vehicle_spec_id"));
  try {
    const success = await vehicleSpecServices.deleteVehicleSpecService(vehicle_spec_id);
    if (!success) return c.json({ error: "Vehicle specification not found" }, 404);
    return c.json({ message: "Vehicle specification deleted successfully" });
  } catch (error) {
    console.error("Error deleting vehicle spec:", error);
    return c.json({ error: "Failed to delete vehicle specification" }, 500);
  }
};
