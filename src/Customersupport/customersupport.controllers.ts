import { type Context } from "hono";
import * as supportServices from "./customersupport.services.js";

// Get all tickets
export const getAllSupportTickets = async (c: Context) => {
  try {
    const authUser: any = c.get("user");

    if (!authUser) {
      return c.json({ message: "Unauthorized - User not found" }, 401);
    }

    const filters = {
      status: c.req.query("status"),
      search: c.req.query("search"),
      sortBy: c.req.query("sortBy"),
      sortOrder: c.req.query("sortOrder")
    };

    let result = await supportServices.getAllSupportTicketsService(filters);

    if (authUser.role !== "admin") {
      result = result.filter(ticket => ticket.user_id === authUser.user_id);
    }

    if (result.length === 0) return c.json({ message: "No tickets found" }, 404);
    return c.json(result, 200);
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return c.json({ error: "Failed to fetch tickets" }, 500);
  }
};

// Get ticket by ID
export const getSupportTicketById = async (c: Context) => {
  const ticket_id = parseInt(c.req.param("ticket_id"));
  const authUser: any = c.get("user");

  if (!authUser) {
    return c.json({ message: "Unauthorized - User not found" }, 401);
  }

  try {
    const ticket = await supportServices.getSupportTicketByIdService(ticket_id);
    if (!ticket) return c.json({ error: "Ticket not found" }, 404);

    if (authUser.role !== "admin" && ticket.user_id !== authUser.user_id) {
      return c.json({ error: "Access denied" }, 403);
    }

    return c.json(ticket, 200);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return c.json({ error: "Failed to fetch ticket" }, 500);
  }
};

// Add reply to ticket
export const addTicketReply = async (c: Context) => {
  const authUser: any = c.get("user");
  if (!authUser) return c.json({ message: "Unauthorized - User not found" }, 401);

  try {
    const ticket_id = parseInt(c.req.param("ticket_id"));
    const body = await c.req.json();
    
    const ticket = await supportServices.getSupportTicketByIdService(ticket_id);
    if (!ticket) return c.json({ error: "Ticket not found" }, 404);
    
    if (authUser.role !== "admin" && ticket.user_id !== authUser.user_id) {
      return c.json({ error: "Access denied" }, 403);
    }
    
    const is_admin = authUser.role === "admin";
    const send_email_notification = body.send_email_notification !== false;
    
    const reply = await supportServices.addTicketReplyService(
      ticket_id,
      authUser.user_id,
      body.message,
      is_admin,
      send_email_notification
    );

    return c.json({ 
      message: "Reply added successfully", 
      reply 
    }, 201);
  } catch (error) {
    console.error("Error adding reply:", error);
    return c.json({ error: "Failed to add reply" }, 500);
  }
};

// Update ticket status
export const updateTicketStatus = async (c: Context) => {
  const authUser: any = c.get("user");
  if (!authUser) return c.json({ message: "Unauthorized - User not found" }, 401);

  if (authUser.role !== "admin") {
    return c.json({ message: "Access denied. Admins only." }, 403);
  }

  try {
    const ticket_id = parseInt(c.req.param("ticket_id"));
    const body = await c.req.json();
    
    const send_email_notification = body.send_email_notification !== false;
    
    const ticket = await supportServices.updateTicketStatusService(
      ticket_id,
      body.status,
      authUser.user_id,
      send_email_notification
    );

    if (!ticket) return c.json({ error: "Ticket not found" }, 404);
    return c.json({ message: "Ticket status updated", ticket });
  } catch (error) {
    console.error("Error updating ticket status:", error);
    return c.json({ error: "Failed to update ticket status" }, 500);
  }
};

// Create ticket
export const createSupportTicket = async (c: Context) => {
  const authUser: any = c.get("user");
  if (!authUser) return c.json({ message: "Unauthorized - User not found" }, 401);

  try {
    const body = await c.req.json();
    const ticket = await supportServices.createSupportTicketService(
      authUser.user_id,
      body.subject,
      body.description
    );

    return c.json({ message: "Ticket created", ticket }, 201);
  } catch (error) {
    console.error("Error creating ticket:", error);
    return c.json({ error: "Failed to create ticket" }, 500);
  }
};

// Update ticket
export const updateSupportTicket = async (c: Context) => {
  const authUser: any = c.get("user");
  if (!authUser) return c.json({ message: "Unauthorized - User not found" }, 401);

  if (authUser.role !== "admin") {
    return c.json({ message: "Access denied. Admins only." }, 403);
  }

  try {
    const ticket_id = parseInt(c.req.param("ticket_id"));
    const body = await c.req.json();

    const ticket = await supportServices.updateSupportTicketService(
      ticket_id,
      body.subject,
      body.description,
      body.status
    );

    if (!ticket) return c.json({ error: "Ticket not found" }, 404);
    return c.json({ message: "Ticket updated", ticket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return c.json({ error: "Failed to update ticket" }, 500);
  }
};

// Delete ticket
export const deleteSupportTicket = async (c: Context) => {
  const authUser: any = c.get("user");
  if (!authUser) return c.json({ message: "Unauthorized - User not found" }, 401);

  if (authUser.role !== "admin") {
    return c.json({ message: "Access denied. Admins only." }, 403);
  }

  try {
    const ticket_id = parseInt(c.req.param("ticket_id"));
    const success = await supportServices.deleteSupportTicketService(ticket_id);

    if (!success) return c.json({ error: "Ticket not found" }, 404);
    return c.json({ message: "Ticket deleted successfully" });
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return c.json({ error: "Failed to delete ticket" }, 500);
  }
};