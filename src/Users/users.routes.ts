

import {Hono} from 'hono'
import { deleteUser, getAllUsers, getUserById, updateUser } from '../Users/users.controllers.js'
import { bothRolesAuth, adminAuth } from '../middlewares/bearersAuth.js'


const userRoutes = new Hono()

// ✅ GET all users - admin only
userRoutes.get('/users',adminAuth,getAllUsers)

// ✅ GET a specific user by ID - authenticated users (can view own or admin can view any)
userRoutes.get('/users/:user_id', bothRolesAuth, getUserById)

// ✅ PUT - Update a specific user (users can update own profile or admin can update any)
userRoutes.put('/users/:user_id', bothRolesAuth, updateUser)

// ✅ DELETE - Delete a specific user - admin only
userRoutes.delete('/users/:user_id', adminAuth, deleteUser)

export default userRoutes;