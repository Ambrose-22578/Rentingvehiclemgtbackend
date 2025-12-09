import { Hono } from "hono";
import * as paymentControllers from "./payments.conrollers.js";
import { adminAuth, bothRolesAuth } from "../middlewares/bearersAuth.js";

const paymentRoutes = new Hono();

paymentRoutes.get("/payments", adminAuth, paymentControllers.getAllPayments);

paymentRoutes.get("/payments/:payment_id", bothRolesAuth, paymentControllers.getPaymentById);

paymentRoutes.post("/payments",bothRolesAuth, paymentControllers.createPayment);

paymentRoutes.put("/payments/:payment_id", adminAuth, paymentControllers.updatePayment);

paymentRoutes.delete("/payments/:payment_id", adminAuth, paymentControllers.deletePayment);

export default paymentRoutes;
