// server/controllers/auth.controllers.ts
import type { Context } from "hono";
import * as userServices from "../Users/users.services.js";
import * as authServices from "../../src/Auth/auth.services.js"; // ✅ Correct import
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

dotenv.config();

// Request body interfaces
interface RegisterRequest {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    contact_phone?: string;
    address?: string;
}

interface LoginRequest {
    email: string;
    password: string;
}

interface ForgotPasswordRequest {
    email: string;
}

interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

// Type-safe User Payload for JWT
interface UserPayload {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    role: "admin" | "user";
}

// Send welcome email
const sendWelcomeEmail = async (email: string, firstName: string) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log("Email credentials not configured. Skipping welcome email.");
            return;
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        await transporter.sendMail({
            from: `"Vehicle Rental" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Welcome to Vehicle Rental System! 🎉",
            html: `
                <h2>Hello ${firstName},</h2>
                <p>Welcome to our Vehicle Renting System!</p>
                <p>Your account has been created successfully 🎉</p>
                <p>We are happy to have you with us.</p>
                <br/>
                <p>Regards,<br/>Vehicle Rental Team</p>
            `,
        });
    } catch (error) {
        console.error("Error sending welcome email:", error);
    }
};

// Send reset password email
const sendResetEmail = async (email: string, token: string, firstName: string) => {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
            console.log("Email credentials not configured. Skipping reset email.");
            return;
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        const resetLink = `http://localhost:5173/forgot-password?token=${token}`;

        await transporter.sendMail({
            from: `"Vehicle Rental" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Password Reset Request - Vehicle Rental",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Hello ${firstName},</h2>
                    <p>We received a request to reset your password for your Vehicle Rental account.</p>
                    <p>Click the button below to reset your password:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" 
                           style="background-color: #2563eb; color: white; padding: 12px 30px; 
                                  text-decoration: none; border-radius: 6px; font-size: 16px; 
                                  font-weight: bold; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="color: #2563eb; word-break: break-all;">${resetLink}</p>
                    
                    <p><strong>Important:</strong> This link will expire in 15 minutes.</p>
                    <p>If you didn't request a password reset, please ignore this email.</p>
                    
                    <br/>
                    <p>Regards,<br/>Vehicle Rental Team</p>
                </div>
            `,
        });
    } catch (error) {
        console.error("Error sending reset email:", error);
    }
};

/*  REGISTER USER  */
export const registerUser = async (c: Context) => {
    try {
        const body = await c.req.json() as RegisterRequest;

        // Validate required fields
        if (!body.first_name || !body.last_name || !body.email || !body.password) {
            return c.json({ error: "All required fields must be provided" }, 400);
        }

        // Check if email already exists
        const emailCheck = await userServices.getUserByEmailService(body.email);
        if (emailCheck !== null) {
            return c.json({ error: "Email already exists" }, 400);
        }

        // Hash password
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(body.password, salt);

        // Register user to database
        const result = await authServices.registerUserService(
            body.first_name,
            body.last_name,
            body.email,
            hashedPassword,
            body.contact_phone,
            body.address
        );

        // Send welcome email (don't wait for it)
        sendWelcomeEmail(body.email, body.first_name).catch(console.error);

        return c.json({ 
            success: true,
            message: result 
        }, 201);

    } catch (error: any) {
        console.error("Error creating user:", error);
        return c.json({ error: "Server error. Please try again later." }, 500);
    }
};

/*  LOGIN USER  */
export const loginUser = async (c: Context) => {
    try {
        const body = await c.req.json() as LoginRequest;

        // Validate required fields
        if (!body.email || !body.password) {
            return c.json({ error: "Email and password are required" }, 400);
        }

        // Check if user exists
        const existingUser = await userServices.getUserByEmailService(body.email);
        if (!existingUser) {
            return c.json({ error: "Invalid email or password" }, 400);
        }

        // Compare passwords
        const isPasswordValid = bcrypt.compareSync(
            body.password,
            existingUser.password
        );

        if (!isPasswordValid) {
            return c.json({ error: "Invalid email or password" }, 400);
        }

        // Normalize the role
        const userRole: UserPayload["role"] =
            existingUser.role === "admin" ? "admin" : "user";

        // Create JWT payload
        const payload: UserPayload = {
            user_id: existingUser.user_id,
            first_name: existingUser.first_name,
            last_name: existingUser.last_name,
            email: existingUser.email,
            role: userRole,
        };

        const secretKey = process.env.JWT_SECRET;
        if (!secretKey) {
            throw new Error("JWT_SECRET is not configured");
        }

        // Generate JWT token (1 hour expiry)
        const token = jwt.sign(payload, secretKey, { expiresIn: "1h" });

        // Remove password from user info
        const { password, ...userInfo } = existingUser;

        return c.json({
            success: true,
            message: "Login successful",
            token,
            user: userInfo,
        }, 200);

    } catch (error: any) {
        console.error("Error logging in user:", error);
        return c.json({ error: "Server error. Please try again later." }, 500);
    }
};

/*  FORGOT PASSWORD  */
export const forgotPassword = async (c: Context) => {
    try {
        const body = await c.req.json() as ForgotPasswordRequest;
        const { email } = body;

        if (!email) {
            return c.json({ success: false, message: "Email is required" }, 400);
        }

        // Call the forgot password service
        const result = await authServices.forgotPasswordService(email);

        if (!result.success) {
            const status = result.message.includes("No account found") ? 404 : 500;
            return c.json(result, status);
        }

        // Try to send email if credentials are configured
        if (result.token) {
            const user = await userServices.getUserByEmailService(email);
            if (user) {
                sendResetEmail(email, result.token, user.first_name).catch(console.error);
            }
        }

        return c.json({
            success: true,
            message: result.message
        }, 200);

    } catch (error: any) {
        console.error("Forgot password controller error:", error);
        return c.json({ success: false, message: "Server error. Please try again later." }, 500);
    }
};

/*  VERIFY RESET TOKEN  */
export const verifyResetToken = async (c: Context) => {
    try {
        const token = c.req.param("token");

        if (!token) {
            return c.json({ valid: false, message: "Token is required" }, 400);
        }

        const result = await authServices.verifyResetTokenService(token);

        if (!result.valid) {
            return c.json(result, 400);
        }

        return c.json(result, 200);

    } catch (error: any) {
        console.error("Verify token controller error:", error);
        return c.json({ valid: false, message: "Server error. Please try again later." }, 500);
    }
};

/*  RESET PASSWORD  */
export const resetPassword = async (c: Context) => {
    try {
        const body = await c.req.json() as ResetPasswordRequest;
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return c.json({ success: false, message: "Token and new password are required" }, 400);
        }

        const result = await authServices.resetPasswordService(token, newPassword);

        if (!result.success) {
            const status = result.message.includes("Invalid") || 
                          result.message.includes("Password must be") ? 400 : 500;
            return c.json(result, status);
        }

        return c.json({
            success: true,
            message: "Password has been reset successfully"
        }, 200);

    } catch (error: any) {
        console.error("Reset password controller error:", error);
        return c.json({ success: false, message: "Server error. Please try again later." }, 500);
    }
};