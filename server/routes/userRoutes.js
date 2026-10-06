import express from "express";
import { getUsers, updateUserRole, updateUserStatus } from "../controllers/userController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { updateRoleSchema, updateStatusSchema } from "../schemas/userSchemas.js";

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/", getUsers);
router.patch("/:id/role", validate(updateRoleSchema), updateUserRole);
router.patch("/:id/status", validate(updateStatusSchema), updateUserStatus);

export default router;