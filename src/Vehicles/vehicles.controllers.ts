import { type Context } from "hono";
import * as vehicleServices from "../Vehicles/vehicles.services.js";


// Get ALL Vehicles

export const getAllVehicles = async (c: Context) => {
  try {
    const vehicles = await vehicleServices.getAllVehiclesService();

    if (vehicles.length === 0) {
      return c.json({ message: "No vehicles found" }, 404);
    }

    return c.json(vehicles);
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    return c.json({ error: "Failed to fetch vehicles" }, 500);
  }
};


// Get Vehicle by ID

export const getVehicleById = async (c: Context) => {
  const vehicle_id = parseInt(c.req.param("vehicle_id"));

  try {
    const vehicle = await vehicleServices.getVehicleByIdService(vehicle_id);

    if (!vehicle) {
      return c.json({ error: "Vehicle not found" }, 404);
    }

    return c.json(vehicle);
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    return c.json({ error: "Failed to fetch vehicle" }, 500);
  }
};


// Create Vehicle (Admin Only)

export const createVehicle = async (c: Context) => {
  try {
    const body = await c.req.json();

    const { vehicle_spec_id, rental_rate, availability } = body;

    // Images come from VehicleSpecifications — NOT here
    const vehicle = await vehicleServices.createVehicleService(
      vehicle_spec_id,
      rental_rate,
      availability
    );

    return c.json(
      { message: "Vehicle created successfully", vehicle },
      201
    );
  } catch (error) {
    console.error("Error creating vehicle:", error);
    return c.json({ error: "Failed to create vehicle" }, 500);
  }
};


// Update Vehicle (Admin Only)

export const updateVehicle = async (c: Context) => {
  const vehicle_id = parseInt(c.req.param("vehicle_id"));

  try {
    const body = await c.req.json();

    const updatedVehicle = await vehicleServices.updateVehicleService(
      vehicle_id,
      body.rental_rate,
      body.availability
    );

    if (!updatedVehicle) {
      return c.json({ error: "Vehicle not found" }, 404);
    }

    return c.json({
      message: "Vehicle updated successfully",
      updatedVehicle,
    });
  } catch (error) {
    console.error("Error updating vehicle:", error);
    return c.json({ error: "Failed to update vehicle" }, 500);
  }
};


// Delete Vehicle (Admin Only)

export const deleteVehicle = async (c: Context) => {
  const vehicle_id = parseInt(c.req.param("vehicle_id"));

  try {
    const message = await vehicleServices.deleteVehicleService(vehicle_id);
    return c.json({ message });
  } catch (error) {
    console.error("Error deleting vehicle:", error);
    return c.json({ error: "Failed to delete vehicle" }, 500);
  }
};
