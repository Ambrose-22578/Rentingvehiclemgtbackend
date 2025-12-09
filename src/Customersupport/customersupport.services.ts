import { getDbPool } from "../db/config.js";
import { sendTicketReplyEmail, sendTicketStatusEmail } from "../nodemailer/mailer.js"

export interface SupportTicketResponse {
  ticket_id: number;
  user_id: number;
  subject: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  contact_phone?: string;
  role?: string;
  reply_count?: number;
}

export interface TicketReplyResponse {
  reply_id: number;
  ticket_id: number;
  user_id: number;
  message: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  role?: string;
}

// Get all support tickets with user info
export const getAllSupportTicketsService = async (filters: any = {}): Promise<SupportTicketResponse[]> => {
  const db = getDbPool();
  
  let query = `
    SELECT 
      t.*, 
      u.first_name, 
      u.last_name, 
      u.email, 
      u.contact_phone, 
      u.role,
      (SELECT COUNT(*) FROM TicketReplies tr WHERE tr.ticket_id = t.ticket_id) as reply_count
    FROM SupportTickets t
    INNER JOIN Users u ON t.user_id = u.user_id
  `;
  
  const conditions: string[] = [];
  const inputs: any = {};
  
  if (filters.status && filters.status !== 'all') {
    conditions.push(`t.status = @status`);
    inputs.status = filters.status;
  }
  
  if (filters.search) {
    conditions.push(`(
      t.subject LIKE @search OR 
      t.description LIKE @search OR 
      u.first_name LIKE @search OR 
      u.last_name LIKE @search OR 
      u.email LIKE @search
    )`);
    inputs.search = `%${filters.search}%`;
  }
  
  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }
  
  if (filters.sortBy) {
    const order = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${filters.sortBy} ${order}`;
  } else {
    query += ` ORDER BY t.created_at DESC`;
  }
  
  const request = db.request();
  Object.keys(inputs).forEach(key => {
    request.input(key, inputs[key]);
  });
  
  const result = await request.query(query);
  return result.recordset;
};

// Get ticket by ID with user info and replies
export const getSupportTicketByIdService = async (
  ticket_id: number
): Promise<any> => {
  const db = getDbPool();
  
  const ticketResult = await db
    .request()
    .input("ticket_id", ticket_id)
    .query(`
      SELECT t.*, u.first_name, u.last_name, u.email, u.contact_phone, u.role
      FROM SupportTickets t
      INNER JOIN Users u ON t.user_id = u.user_id
      WHERE t.ticket_id = @ticket_id
    `);
  
  if (!ticketResult.recordset[0]) return null;
  
  const ticket = ticketResult.recordset[0];
  
  const repliesResult = await db
    .request()
    .input("ticket_id", ticket_id)
    .query(`
      SELECT tr.*, u.first_name, u.last_name, u.email, u.role
      FROM TicketReplies tr
      INNER JOIN Users u ON tr.user_id = u.user_id
      WHERE tr.ticket_id = @ticket_id
      ORDER BY tr.created_at ASC
    `);
  
  return {
    ...ticket,
    replies: repliesResult.recordset
  };
};

// Add reply to ticket
export const addTicketReplyService = async (
  ticket_id: number,
  user_id: number,
  message: string,
  is_admin: boolean = false,
  send_email_notification: boolean = true
): Promise<TicketReplyResponse> => {
  const db = getDbPool();
  
  const transaction = db.transaction();
  await transaction.begin();
  
  try {
    const replyResult = await transaction.request()
      .input("ticket_id", ticket_id)
      .input("user_id", user_id)
      .input("message", message)
      .input("is_admin", is_admin)
      .query(`
        INSERT INTO TicketReplies (ticket_id, user_id, message, is_admin)
        OUTPUT INSERTED.*
        VALUES (@ticket_id, @user_id, @message, @is_admin)
      `);
    
    const reply = replyResult.recordset[0];
    
    await transaction.request()
      .input("ticket_id", ticket_id)
      .query(`
        UPDATE SupportTickets
        SET updated_at = GETDATE()
        WHERE ticket_id = @ticket_id
      `);
    
    if (is_admin && send_email_notification) {
      const ticketResult = await transaction.request()
        .input("ticket_id", ticket_id)
        .query(`
          SELECT t.*, u.first_name, u.last_name, u.email
          FROM SupportTickets t
          INNER JOIN Users u ON t.user_id = u.user_id
          WHERE t.ticket_id = @ticket_id
        `);
      
      const ticket = ticketResult.recordset[0];
      
      if (ticket && ticket.email) {
        const adminResult = await transaction.request()
          .input("user_id", user_id)
          .query(`
            SELECT first_name, last_name FROM Users WHERE user_id = @user_id
          `);
        
        const admin = adminResult.recordset[0];
        const adminName = `${admin.first_name} ${admin.last_name}`;
        
        try {
          await sendTicketReplyEmail(
            ticket.email,
            `${ticket.first_name} ${ticket.last_name}`,
            ticket_id,
            ticket.subject,
            message,
            adminName
          );
        } catch (emailError) {
          console.error('Failed to send email notification:', emailError);
        }
      }
    }
    
    await transaction.commit();
    
    const fullReply = await db.request()
      .input("reply_id", reply.reply_id)
      .query(`
        SELECT tr.*, u.first_name, u.last_name, u.email, u.role
        FROM TicketReplies tr
        INNER JOIN Users u ON tr.user_id = u.user_id
        WHERE tr.reply_id = @reply_id
      `);
    
    return fullReply.recordset[0];
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Update ticket status with email notification
export const updateTicketStatusService = async (
  ticket_id: number,
  status: string,
  user_id?: number,
  send_email_notification: boolean = true
): Promise<SupportTicketResponse | null> => {
  const db = getDbPool();
  
  const transaction = db.transaction();
  await transaction.begin();
  
  try {
    const result = await transaction.request()
      .input("ticket_id", ticket_id)
      .input("status", status)
      .query(`
        UPDATE SupportTickets
        SET status = @status,
            updated_at = GETDATE()
        OUTPUT INSERTED.*
        WHERE ticket_id = @ticket_id
      `);
    
    const ticket = result.recordset[0];
    if (!ticket) {
      await transaction.rollback();
      return null;
    }
    
    if (send_email_notification) {
      const ticketResult = await transaction.request()
        .input("ticket_id", ticket_id)
        .query(`
          SELECT t.*, u.first_name, u.last_name, u.email
          FROM SupportTickets t
          INNER JOIN Users u ON t.user_id = u.user_id
          WHERE t.ticket_id = @ticket_id
        `);
      
      const ticket = ticketResult.recordset[0];
      
      if (ticket && ticket.email) {
        try {
          await sendTicketStatusEmail(
            ticket.email,
            `${ticket.first_name} ${ticket.last_name}`,
            ticket_id,
            ticket.subject,
            status
          );
        } catch (emailError) {
          console.error('Failed to send status email:', emailError);
        }
      }
    }
    
    await transaction.commit();
    
    const fullTicket = await getSupportTicketByIdService(ticket_id);
    return fullTicket;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

// Create new ticket
export const createSupportTicketService = async (
  user_id: number,
  subject: string,
  description: string,
  status: string = "Open"
): Promise<SupportTicketResponse> => {
  const db = getDbPool();
  const result = await db
    .request()
    .input("user_id", user_id)
    .input("subject", subject)
    .input("description", description)
    .input("status", status)
    .query(`
      INSERT INTO SupportTickets (user_id, subject, description, status)
      OUTPUT INSERTED.*
      VALUES (@user_id, @subject, @description, @status)
    `);

  const ticket = result.recordset[0];
  const fullTicket = await getSupportTicketByIdService(ticket.ticket_id);
  return fullTicket!;
};

// Update ticket
export const updateSupportTicketService = async (
  ticket_id: number,
  subject: string,
  description: string,
  status: string
): Promise<SupportTicketResponse | null> => {
  const db = getDbPool();
  const result = await db
    .request()
    .input("ticket_id", ticket_id)
    .input("subject", subject)
    .input("description", description)
    .input("status", status)
    .query(`
      UPDATE SupportTickets
      SET subject = @subject,
          description = @description,
          status = @status,
          updated_at = GETDATE()
      OUTPUT INSERTED.*
      WHERE ticket_id = @ticket_id
    `);

  const ticket = result.recordset[0];
  if (!ticket) return null;

  const fullTicket = await getSupportTicketByIdService(ticket.ticket_id);
  return fullTicket;
};

// Delete ticket
export const deleteSupportTicketService = async (ticket_id: number): Promise<boolean> => {
  const db = getDbPool();
  const result = await db
    .request()
    .input("ticket_id", ticket_id)
    .query("DELETE FROM SupportTickets WHERE ticket_id = @ticket_id");

  return result.rowsAffected[0] === 1;
};