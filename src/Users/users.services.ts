import { getDbPool } from "../db/config.js";

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

// GET ALL USERS
 
export const getAllUsersService = async (): Promise<UserResponse[]> => {
    const db = getDbPool();
    const query = "SELECT * FROM Users";
    const result = await db.request().query(query);
    return result.recordset;
};

// GET USER BY ID

export const getUserByIdService = async (user_id: number): Promise<UserResponse | null> => {
    const db = getDbPool();
    const query = "SELECT * FROM Users WHERE user_id = @user_id";
    const result = await db.request()
        .input("user_id", user_id)
        .query(query);

    return result.recordset[0] || null;
};

 
// GET USER BY EMAIL
export const getUserByEmailService = async (email: string): Promise<UserResponse | null> => {
    const db = getDbPool();
    const query = "SELECT * FROM Users WHERE email = @email";
    const result = await db.request()
        .input("email", email)
        .query(query);

    return result.recordset[0] || null;
};


// UPDATE USER DETAILS
export const updateUserService = async (
    user_id: number,
    first_name: string,
    last_name: string,
    email: string,
    contact_phone: string,
    address: string
): Promise<string> => {

    const db = getDbPool();
    const query = `
        UPDATE Users 
        SET first_name = @first_name,
            last_name = @last_name,
            email = @email,
            contact_phone = @contact_phone,
            address = @address,
            updated_at = GETDATE()
        WHERE user_id = @user_id
    `;
    
    const result = await db.request()
        .input("user_id", user_id)
        .input("first_name", first_name)
        .input("last_name", last_name)
        .input("email", email)
        .input("contact_phone", contact_phone)
        .input("address", address)
        .query(query);

    return result.rowsAffected[0] === 1
        ? "User updated successfully"
        : "Failed to update user, try again";
};


// UPDATE USER ROLE

export const updateUserRoleService = async (
    user_id: number,
    role: string
): Promise<string> => {

    const db = getDbPool();
    const query = `
        UPDATE Users 
        SET role = @role,
            updated_at = GETDATE()
        WHERE user_id = @user_id
    `;

    const result = await db.request()
        .input("user_id", user_id)
        .input("role", role)
        .query(query);

    return result.rowsAffected[0] === 1
        ? "Role updated successfully"
        : "Failed to update role, try again";
};


// DELETE USER

export const deleteUserService = async (user_id: number): Promise<string> => {
    const db = getDbPool();
    const query = "DELETE FROM Users WHERE user_id = @user_id";

    const result = await db.request()
        .input("user_id", user_id)
        .query(query);

    return result.rowsAffected[0] === 1
        ? "User deleted successfully"
        : "Failed to delete user";
};
