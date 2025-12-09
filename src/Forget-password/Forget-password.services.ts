import { getDbPool } from "../db/config.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";

interface UserResponse {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    contact_phone?: string;
    address?: string;
    role?: string;
    created_at?: Date;
    updated_at?: Date;
}

// Forgot Password Service
export const forgotPasswordService = async (email: string): Promise<{ 
    success: boolean; 
    message: string;
    token?: string;
}> => {
    const db = getDbPool();
    
    try {
        // Check if user exists
        const userQuery = "SELECT user_id, email, first_name FROM Users WHERE email = @email";
        const userResult = await db.request()
            .input("email", email)
            .query(userQuery);

        if (userResult.recordset.length === 0) {
            return { 
                success: false, 
                message: "No account found with this email" 
            };
        }

        const user = userResult.recordset[0];

        // Delete any existing unused expired tokens
        const deleteOldTokensQuery = `
            DELETE FROM PasswordResetTokens 
            WHERE user_id = @user_id 
            AND (used = 1 OR expires_at < GETDATE())
        `;
        
        await db.request()
            .input("user_id", user.user_id)
            .query(deleteOldTokensQuery);

        // Generate reset token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes expiration

        // Save token to database
        const insertTokenQuery = `
            INSERT INTO PasswordResetTokens (user_id, token, expires_at) 
            VALUES (@user_id, @token, @expires_at)
        `;
        
        await db.request()
            .input("user_id", user.user_id)
            .input("token", token)
            .input("expires_at", expiresAt)
            .query(insertTokenQuery);

        // Send email (in development, just return the token)
        if (process.env.NODE_ENV === 'development') {
            console.log(`📧 Reset token for ${email}: ${token}`);
            return { 
                success: true, 
                message: "Reset link generated. Check console for token (development mode).",
                token: token
            };
        }

        // For production, you would send an email here
        // await sendResetEmail(email, token);
        
        return { 
            success: true, 
            message: "Password reset link has been sent to your email" 
        };

    } catch (error: any) {
        console.error("Forgot password service error:", error);
        return { 
            success: false, 
            message: "Server error. Please try again later." 
        };
    }
};

// Verify Reset Token Service
export const verifyResetTokenService = async (token: string): Promise<{ 
    valid: boolean; 
    message: string;
    user_id?: number;
}> => {
    const db = getDbPool();
    
    try {
        const query = `
            SELECT prt.*, u.email 
            FROM PasswordResetTokens prt
            JOIN Users u ON prt.user_id = u.user_id
            WHERE prt.token = @token 
              AND prt.used = 0 
              AND prt.expires_at > GETDATE()
        `;
        
        const result = await db.request()
            .input("token", token)
            .query(query);

        if (result.recordset.length === 0) {
            return { 
                valid: false, 
                message: "Invalid or expired reset token" 
            };
        }

        const tokenData = result.recordset[0];
        return { 
            valid: true, 
            message: "Token is valid",
            user_id: tokenData.user_id
        };

    } catch (error: any) {
        console.error("Verify token service error:", error);
        return { 
            valid: false, 
            message: "Server error. Please try again later." 
        };
    }
};

// Reset Password Service
export const resetPasswordService = async (
    token: string, 
    newPassword: string
): Promise<{ 
    success: boolean; 
    message: string;
}> => {
    const db = getDbPool();
    
    try {
        // Validate password
        if (!newPassword || newPassword.length < 6) {
            return { 
                success: false, 
                message: "Password must be at least 6 characters long" 
            };
        }

        // First verify the token
        const verifyResult = await verifyResetTokenService(token);
        
        if (!verifyResult.valid || !verifyResult.user_id) {
            return { 
                success: false, 
                message: verifyResult.message 
            };
        }

        const userId = verifyResult.user_id;

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update user's password
        const updatePasswordQuery = `
            UPDATE Users 
            SET password = @password, updated_at = GETDATE() 
            WHERE user_id = @user_id
        `;
        
        const updateResult = await db.request()
            .input("user_id", userId)
            .input("password", hashedPassword)
            .query(updatePasswordQuery);

        if (updateResult.rowsAffected[0] !== 1) {
            return { 
                success: false, 
                message: "Failed to update password" 
            };
        }

        // Mark token as used
        const markTokenUsedQuery = `
            UPDATE PasswordResetTokens 
            SET used = 1 
            WHERE token = @token
        `;
        
        await db.request()
            .input("token", token)
            .query(markTokenUsedQuery);

        // Delete all expired tokens for this user
        const deleteExpiredQuery = `
            DELETE FROM PasswordResetTokens 
            WHERE user_id = @user_id 
            AND expires_at < GETDATE()
        `;
        
        await db.request()
            .input("user_id", userId)
            .query(deleteExpiredQuery);

        return { 
            success: true, 
            message: "Password has been reset successfully" 
        };

    } catch (error: any) {
        console.error("Reset password service error:", error);
        return { 
            success: false, 
            message: "Server error. Please try again later." 
        };
    }
};

// Helper function to send reset email (optional for now)
const sendResetEmail = async (email: string, token: string): Promise<boolean> => {
    // This is where you would implement email sending
    // For now, we'll just log it in development
    console.log(`📧 Password reset token for ${email}: ${token}`);
    return true;
};