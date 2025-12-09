import { Hono } from "hono";
import * as vehicleSpecControllers from "./vehiclesspecification.controllers.js";
import { adminAuth } from "../middlewares/bearersAuth.js";

const vehicleSpecRoutes = new Hono();
// PUBLIC ROUTES
vehicleSpecRoutes.get("/vehicle-specs", vehicleSpecControllers.getAllVehicleSpecs);
vehicleSpecRoutes.get("/vehicle-specs/:vehicle_spec_id", vehicleSpecControllers.getVehicleSpecById);
// ADMIN ROUTES (Protected)
vehicleSpecRoutes.post("/vehicle-specs", adminAuth, vehicleSpecControllers.createVehicleSpec);
vehicleSpecRoutes.put("/vehicle-specs/:vehicle_spec_id", adminAuth, vehicleSpecControllers.updateVehicleSpec);
vehicleSpecRoutes.delete("/vehicle-specs/:vehicle_spec_id", adminAuth, vehicleSpecControllers.deleteVehicleSpec);

export default vehicleSpecRoutes;
