import { getComments, addComment, getActivity } from "../controllers/commentController.js";
import upload from "../middleware/uploadMiddleware.js";
import express from "express";
import {
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
} from "../controllers/ticketController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import {
  createTicketSchema,
  updateStatusSchema,
  assignTicketSchema,
} from "../schemas/ticketSchemas.js";

const router = express.Router();

router.use(protect);

router.get("/", getTickets);
router.post("/", validate(createTicketSchema), createTicket);
router.get("/:id", getTicketById);
router.get("/:id/comments", getComments);
router.post("/:id/comments", upload.array("attachments", 3), addComment);
router.get("/:id/activity", getActivity);
router.patch("/:id/status", authorize("it_support", "admin"), validate(updateStatusSchema), updateTicketStatus);
router.patch("/:id/assign", authorize("it_support", "admin"), validate(assignTicketSchema), assignTicket);

export default router;