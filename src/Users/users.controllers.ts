import { type Context } from "hono";
import * as userServices from "./users.services.js";

// Helper: remove password field
const stripPassword = (user: any) => {
    if (!user) return user;
    const { password, ...rest } = user;
    return rest;
};


//   GET ALL USERS (ADMIN ONLY)
export const getAllUsers = async (c: Context) => {
    try {
        const authUser: any = c.get("user");

        if (authUser.role !== "admin") {
            return c.json({ error: "Access denied. Admins only." }, 403);
        }

        const result = await userServices.getAllUsersService();
        
        if (result.length === 0) {
            return c.json({ message: "No users found" }, 404);
        }

        // Remove password from each user
        const sanitizedUsers = result.map(stripPassword);

        return c.json(sanitizedUsers);
    } catch (error: any) {
        console.error("Error fetching users:", error.message);
        return c.json({ error: "Failed to fetch users" }, 500);
    }
};

 
//   GET USER BY ID (SELF OR ADMIN CAN VIEW)

export const getUserById = async (c: Context) => {
    const user_id = parseInt(c.req.param("user_id"));
    const authUser: any = c.get("user");

    try {
        // Allow if user is viewing their own profile or if admin
        if (authUser.user_id !== user_id && authUser.role !== "admin") {
            return c.json({ error: "Access denied. You can only view your own profile." }, 403);
        }

        const result = await userServices.getUserByIdService(user_id);
        
        if (result === null) {
            return c.json({ error: "User not found" }, 404);
        }

        return c.json(stripPassword(result));

    } catch (error) {
        console.error("Error fetching user:", error);
        return c.json({ error: "Failed to fetch user" }, 500);
    }
};


//   UPDATE USER (SELF OR ADMIN CAN UPDATE)

export const updateUser = async (c: Context) => {
    try {
        const user_id = parseInt(c.req.param("user_id"));
        const authUser: any = c.get("user");
        const body = await c.req.json();

        // Allow only self-update or admin
        if (authUser.user_id !== user_id && authUser.role !== "admin") {
            return c.json({ error: "Access denied. You can only update your own profile." }, 403);
        }

        // Check existence
        const checkExists = await userServices.getUserByIdService(user_id);
        if (checkExists === null) {
            return c.json({ error: "User not found" }, 404);
        }

        const result = await userServices.updateUserService(
            user_id,
            body.first_name,
            body.last_name,
            body.email,
            body.contact_phone,
            body.address
        );

        return c.json({
            message: "User updated successfully",
            updated_user: result
        }, 200);

    } catch (error) {
        console.error("Error updating user:", error);
        return c.json({ error: "Failed to update user" }, 500);
    }
};


//   UPDATE USER ROLE (ADMIN ONLY)

export const updateUserRole = async (c: Context) => {
    try {
        const user_id = parseInt(c.req.param("user_id"));
        const authUser: any = c.get("user");
        const body = await c.req.json();

        // Must be admin
        if (authUser.role !== "admin") {
            return c.json({ error: "Access denied. Admins only." }, 403);
        }

        // Check target user exists
        const checkExists = await userServices.getUserByIdService(user_id);
        if (checkExists === null) {
            return c.json({ error: "User not found" }, 404);
        }

        // Validate role
        if (!body.role || !["user", "admin"].includes(body.role)) {
            return c.json({ error: "Valid role (user or admin) is required" }, 400);
        }

        const result = await userServices.updateUserRoleService(user_id, body.role);

        return c.json({
            message: `User role updated to ${body.role} successfully`,
            updated_user: result
        }, 200);

    } catch (error) {
        console.error("Error updating user role:", error);
        return c.json({ error: "Failed to update user role" }, 500);
    }
};


//   DELETE USER (ADMIN ONLY)

export const deleteUser = async (c: Context) => {
    const user_id = parseInt(c.req.param("user_id"));
    const authUser: any = c.get("user");

    try {
        if (authUser.role !== "admin") {
            return c.json({ error: "Access denied. Admins only." }, 403);
        }

        const checkExists = await userServices.getUserByIdService(user_id);
        if (checkExists === null) {
            return c.json({ error: "User not found" }, 404);
        }

        const result = await userServices.deleteUserService(user_id);

        return c.json({
            message: "User deleted successfully",
            deleted_user_id: user_id
        });

    } catch (error) {
        console.error("Error deleting user:", error);
        return c.json({ error: "Failed to delete user" }, 500);
    }
};
