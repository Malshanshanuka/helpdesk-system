import express from "express";
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
} from "../controllers/ticketController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/").post(createTicket).get(getTickets);
router.get("/:id", getTicketById);
router.patch("/:id/status", authorize("it_support", "admin"), updateTicketStatus);
router.patch("/:id/assign", authorize("it_support", "admin"), assignTicket);

export default router;