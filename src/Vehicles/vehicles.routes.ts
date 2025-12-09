import { Hono } from "hono";
import * as vehicleControllers from "./vehicles.controllers.js";
import { bothRolesAuth, adminAuth } from "../middlewares/bearersAuth.js";

const vehicleRoutes = new Hono();

// ✅ GET endpoints - all authenticated users can view vehicles
vehicleRoutes.get("/vehicles", vehicleControllers.getAllVehicles);
vehicleRoutes.get("/vehicles/:vehicle_id", bothRolesAuth, vehicleControllers.getVehicleById);

// ✅ POST, PUT, DELETE - admin only
vehicleRoutes.post("/vehicles", adminAuth, vehicleControllers.createVehicle);
vehicleRoutes.put("/vehicles/:vehicle_id", adminAuth, vehicleControllers.updateVehicle);
vehicleRoutes.delete("/vehicles/:vehicle_id", adminAuth, vehicleControllers.deleteVehicle);

export default vehicleRoutes;
