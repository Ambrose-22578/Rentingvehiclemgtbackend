import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  return transporter.sendMail({
    from: `"Car Booking System" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// Send ticket reply email
export const sendTicketReplyEmail = async (
  userEmail: string,
  userName: string,
  ticketId: number,
  ticketSubject: string,
  replyMessage: string,
  adminName: string
) => {
  const subject = `New Reply to Your Support Ticket #${ticketId}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .ticket-info { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border: 1px solid #e5e7eb; }
        .reply-box { background: #f0f9ff; padding: 15px; border-radius: 6px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Reply to Your Support Ticket</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>A support representative has responded to your support ticket.</p>
          
          <div class="ticket-info">
            <h3>Ticket Details</h3>
            <p><strong>Ticket ID:</strong> #${ticketId}</p>
            <p><strong>Subject:</strong> ${ticketSubject}</p>
          </div>
          
          <div class="reply-box">
            <h4>New Reply from ${adminName}:</h4>
            <p>${replyMessage}</p>
          </div>
          
          <p>You can view the full conversation by visiting your support dashboard.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support" class="btn">
              View Ticket
            </a>
          </div>
          
          <p>Best regards,<br>Support Team<br>Car Booking System</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(userEmail, subject, html);
};

// Send ticket status update email
export const sendTicketStatusEmail = async (
  userEmail: string,
  userName: string,
  ticketId: number,
  ticketSubject: string,
  status: string
) => {
  const subject = `Support Ticket #${ticketId} Status Updated`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .status-box { 
          padding: 15px; 
          border-radius: 6px; 
          margin: 15px 0; 
          text-align: center;
          font-weight: bold;
          font-size: 16px;
        }
        .status-open { background: #fee2e2; color: #991b1b; }
        .status-progress { background: #fef3c7; color: #92400e; }
        .status-closed { background: #d1fae5; color: #065f46; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 6px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Support Ticket Status Update</h1>
        </div>
        <div class="content">
          <p>Hello ${userName},</p>
          <p>The status of your support ticket has been updated.</p>
          
          <div class="ticket-info">
            <h3>Ticket Details</h3>
            <p><strong>Ticket ID:</strong> #${ticketId}</p>
            <p><strong>Subject:</strong> ${ticketSubject}</p>
          </div>
          
          <div class="status-box ${status.toLowerCase() === 'open' ? 'status-open' : status.toLowerCase() === 'in progress' ? 'status-progress' : 'status-closed'}">
            New Status: ${status}
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/support" class="btn">
              View Ticket
            </a>
          </div>
          
          <p>Best regards,<br>Support Team<br>Car Booking System</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return sendEmail(userEmail, subject, html);
};

export default transporter;