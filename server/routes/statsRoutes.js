import express from "express";
import { getStats, getMyStats } from "../controllers/statsController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", authorize("admin"), getStats);
router.get("/me", authorize("it_support", "admin"), getMyStats);

export default router;