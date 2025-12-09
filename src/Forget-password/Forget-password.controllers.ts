import { type Context } from "hono";
import * as authServices from "../../src/Forget-password/Forget-password.services.js"

// Forgot Password Controller
export const forgotPassword = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { email } = body;

        if (!email) {
            return c.json({ 
                success: false, 
                message: "Email is required" 
            }, 400);
        }

        const result = await authServices.forgotPasswordService(email);

        if (!result.success) {
            // Return 404 for "user not found", 500 for server errors
            const status = result.message.includes("No account found") ? 404 : 500;
            return c.json(result, status);
        }

        return c.json(result, 200);

    } catch (error: any) {
        console.error("Forgot password controller error:", error);
        return c.json({ 
            success: false, 
            message: "Server error. Please try again later." 
        }, 500);
    }
};

// Verify Reset Token Controller
export const verifyResetToken = async (c: Context) => {
    try {
        const token = c.req.param("token");

        if (!token) {
            return c.json({ 
                valid: false, 
                message: "Token is required" 
            }, 400);
        }

        const result = await authServices.verifyResetTokenService(token);

        // Return 400 for invalid token, 200 for valid
        if (!result.valid) {
            return c.json(result, 400);
        }

        return c.json(result, 200);

    } catch (error: any) {
        console.error("Verify token controller error:", error);
        return c.json({ 
            valid: false, 
            message: "Server error. Please try again later." 
        }, 500);
    }
};

// Reset Password Controller
export const resetPassword = async (c: Context) => {
    try {
        const body = await c.req.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return c.json({ 
                success: false, 
                message: "Token and new password are required" 
            }, 400);
        }

        const result = await authServices.resetPasswordService(token, newPassword);

        if (!result.success) {
            // Return 400 for invalid token, 500 for server errors
            const status = result.message.includes("Invalid") || 
                          result.message.includes("Password must be") ? 400 : 500;
            return c.json(result, status);
        }

        return c.json(result, 200);

    } catch (error: any) {
        console.error("Reset password controller error:", error);
        return c.json({ 
            success: false, 
            message: "Server error. Please try again later." 
        }, 500);
    }
};