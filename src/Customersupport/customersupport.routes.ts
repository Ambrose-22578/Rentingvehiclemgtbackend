import { Hono } from "hono";
import * as supportControllers from "../Customersupport/customersupport.controllers.js";
import { adminAuth, bothRolesAuth } from "../middlewares/bearersAuth.js";

const supportRoutes = new Hono();

// Original routes
supportRoutes.get("/support-tickets", bothRolesAuth, supportControllers.getAllSupportTickets);
supportRoutes.get("/support-tickets/:ticket_id", bothRolesAuth, supportControllers.getSupportTicketById);
supportRoutes.post("/support-tickets", bothRolesAuth, supportControllers.createSupportTicket);
supportRoutes.put("/support-tickets/:ticket_id", adminAuth, supportControllers.updateSupportTicket);
supportRoutes.delete("/support-tickets/:ticket_id", adminAuth, supportControllers.deleteSupportTicket);

// New routes for replies and status updates
supportRoutes.post("/support-tickets/:ticket_id/replies", bothRolesAuth, supportControllers.addTicketReply);
supportRoutes.patch("/support-tickets/:ticket_id/status", adminAuth, supportControllers.updateTicketStatus);

// For frontend API compatibility (this is what your frontend is calling)
supportRoutes.get("/support-tickets/with-user", bothRolesAuth, supportControllers.getAllSupportTickets);

export default supportRoutes;