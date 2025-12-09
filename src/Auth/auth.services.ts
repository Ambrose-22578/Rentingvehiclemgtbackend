// src/Auth/auth.services.ts (or wherever it is)
import { getDbPool } from "../db/config.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";

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

// ✅ Register User Service
export const registerUserService = async (
    first_name: string,
    last_name: string,
    email: string,
    password: string,
    contact_phone?: string,
    address?: string
): Promise<string> => {
    const db = getDbPool();
    
    try {
        const query = `
            INSERT INTO Users (first_name, last_name, email, password, contact_phone, address, role) 
            OUTPUT INSERTED.user_id 
            VALUES (@first_name, @last_name, @email, @password, @contact_phone, @address, 'user')
        `;
        
        const result = await db.request()
            .input('first_name', first_name)
            .input('last_name', last_name)
            .input('email', email)
            .input('password', password)
            .input('contact_phone', contact_phone || null)
            .input('address', address || null)
            .query(query);
            
        return result.rowsAffected[0] === 1 
            ? "User created successfully 🎊" 
            : "Failed to create user";
    } catch (error: any) {
        console.error("Register service error:", error.message);
        throw error;
    }
}

// Forgot Password Service
export const forgotPasswordService = async (email: string): Promise<{ 
    success: boolean; 
    message: string;
    token?: string;
}> => {
    const db = getDbPool();
    
    try {
        console.log(`\n🔍 [FORGOT PASSWORD] Looking for user with email: ${email}`);
        
        // Check if user exists
        const userQuery = "SELECT user_id, email, first_name FROM Users WHERE email = @email";
        const userResult = await db.request()
            .input("email", email)
            .query(userQuery);

        console.log(`🔍 [FORGOT PASSWORD] User query result: ${userResult.recordset.length} user(s) found`);

        if (userResult.recordset.length === 0) {
            return { 
                success: false, 
                message: "No account found with this email" 
            };
        }

        const user = userResult.recordset[0];
        console.log(`✅ [FORGOT PASSWORD] Found user: ${user.first_name} (ID: ${user.user_id})`);

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
        
        // Get current time from SQL Server to ensure consistency
        const getCurrentTimeQuery = "SELECT GETDATE() as sql_time";
        const timeResult = await db.request().query(getCurrentTimeQuery);
        const sqlTime = new Date(timeResult.recordset[0].sql_time);
        
        // Calculate expiry (15 minutes from now)
        const expiresAt = new Date(sqlTime);
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);

        console.log(`🔑 [FORGOT PASSWORD] Generated token: ${token}`);
        console.log(`⏰ [FORGOT PASSWORD] SQL Server time: ${sqlTime.toISOString()}`);
        console.log(`⏰ [FORGOT PASSWORD] Expires at: ${expiresAt.toISOString()}`);
        console.log(`⏰ [FORGOT PASSWORD] JavaScript local time: ${new Date().toISOString()}`);

        // Save token to database
        const insertTokenQuery = `
            INSERT INTO PasswordResetTokens (user_id, token, expires_at) 
            VALUES (@user_id, @token, @expires_at)
        `;
        
        const insertResult = await db.request()
            .input("user_id", user.user_id)
            .input("token", token)
            .input("expires_at", expiresAt)
            .query(insertTokenQuery);

        console.log(`💾 [FORGOT PASSWORD] Token saved. Rows affected: ${insertResult.rowsAffected[0]}`);

        // Verify the token was saved correctly
        const verifySaveQuery = `
            SELECT token, expires_at, used 
            FROM PasswordResetTokens 
            WHERE token = @token
        `;
        
        const verifySaveResult = await db.request()
            .input("token", token)
            .query(verifySaveQuery);

        console.log(`🔎 [FORGOT PASSWORD] Token verification in DB:`, verifySaveResult.recordset[0]);

        // In development, log the token
        console.log(`\n📧 ============================================`);
        console.log(`📧 [FORGOT PASSWORD] Reset token for ${email}:`);
        console.log(`   Token: ${token}`);
        console.log(`   Reset link: http://localhost:5173/forgot-password?token=${token}`);
        console.log(`   Expires at: ${expiresAt.toLocaleString()}`);
        console.log(`📧 ============================================\n`);

        return { 
            success: true, 
            message: "Password reset link has been sent to your email",
            token: token
        };

    } catch (error: any) {
        console.error("❌ [FORGOT PASSWORD] Service error:", error);
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
        console.log(`\n🔍 [VERIFY TOKEN] Verifying token: ${token}`);
        
        // First get current SQL Server time
        const getCurrentTimeQuery = "SELECT GETDATE() as sql_time";
        const timeResult = await db.request().query(getCurrentTimeQuery);
        const currentSqlTime = new Date(timeResult.recordset[0].sql_time);
        
        console.log(`⏰ [VERIFY TOKEN] Current SQL Server time: ${currentSqlTime.toISOString()}`);
        console.log(`⏰ [VERIFY TOKEN] Current JavaScript time: ${new Date().toISOString()}`);

        // Get token details without expiration check first
        const debugQuery = `
            SELECT 
                prt.*, 
                u.email,
                DATEDIFF(SECOND, GETDATE(), prt.expires_at) as seconds_until_expiry,
                CASE 
                    WHEN prt.expires_at > GETDATE() THEN 'NOT_EXPIRED'
                    ELSE 'EXPIRED'
                END as expiry_status
            FROM PasswordResetTokens prt
            LEFT JOIN Users u ON prt.user_id = u.user_id
            WHERE prt.token = @token
        `;
        
        const debugResult = await db.request()
            .input("token", token)
            .query(debugQuery);

        console.log(`🔍 [VERIFY TOKEN] Debug query result:`, debugResult.recordset);

        if (debugResult.recordset.length === 0) {
            console.log(`❌ [VERIFY TOKEN] Token not found in database`);
            return { 
                valid: false, 
                message: "Invalid or expired reset token" 
            };
        }

        const tokenData = debugResult.recordset[0];
        
        console.log(`📊 [VERIFY TOKEN] Token details:`);
        console.log(`   - Used: ${tokenData.used}`);
        console.log(`   - Expires at (from DB): ${tokenData.expires_at}`);
        console.log(`   - Expires at (ISO): ${new Date(tokenData.expires_at).toISOString()}`);
        console.log(`   - Seconds until expiry: ${tokenData.seconds_until_expiry}`);
        console.log(`   - Expiry status: ${tokenData.expiry_status}`);
        console.log(`   - User ID: ${tokenData.user_id}`);
        console.log(`   - User email: ${tokenData.email || 'No user found'}`);

        // Now do the actual verification
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

        console.log(`✅ [VERIFY TOKEN] Verification query result count: ${result.recordset.length}`);

        if (result.recordset.length === 0) {
            console.log(`❌ [VERIFY TOKEN] Token failed verification. Reasons:`);
            console.log(`   - Is used? ${tokenData.used === 1}`);
            console.log(`   - Is expired? ${tokenData.expiry_status === 'EXPIRED'}`);
            
            // Check if it's a timezone issue
            const jsExpiry = new Date(tokenData.expires_at);
            const timeDiff = jsExpiry.getTime() - currentSqlTime.getTime();
            console.log(`   - Time difference (ms): ${timeDiff}`);
            console.log(`   - JS considers expired? ${timeDiff <= 0}`);
            
            return { 
                valid: false, 
                message: "Invalid or expired reset token" 
            };
        }

        const validTokenData = result.recordset[0];
        console.log(`✅ [VERIFY TOKEN] Token is valid! User ID: ${validTokenData.user_id}`);
        
        return { 
            valid: true, 
            message: "Token is valid",
            user_id: validTokenData.user_id
        };

    } catch (error: any) {
        console.error("❌ [VERIFY TOKEN] Service error:", error);
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
        console.log(`\n🔍 [RESET PASSWORD] Resetting password for token: ${token}`);
        
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

        console.log(`🔐 [RESET PASSWORD] Hashing new password for user ID: ${userId}`);

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

        console.log(`📝 [RESET PASSWORD] Password update rows affected: ${updateResult.rowsAffected[0]}`);

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

        console.log(`✅ [RESET PASSWORD] Token marked as used`);

        // Delete all expired tokens for this user
        const deleteExpiredQuery = `
            DELETE FROM PasswordResetTokens 
            WHERE user_id = @user_id 
            AND expires_at < GETDATE()
        `;
        
        await db.request()
            .input("user_id", userId)
            .query(deleteExpiredQuery);

        console.log(`🧹 [RESET PASSWORD] Cleaned up expired tokens`);

        return { 
            success: true, 
            message: "Password has been reset successfully" 
        };

    } catch (error: any) {
        console.error("❌ [RESET PASSWORD] Service error:", error);
        return { 
            success: false, 
            message: "Server error. Please try again later." 
        };
    }
};