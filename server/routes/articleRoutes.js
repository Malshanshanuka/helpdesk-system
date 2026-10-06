import express from "express";
import {
  getArticles,
  getPopularArticles,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
} from "../controllers/articleController.js";
import { protect, authorize } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validate.js";
import { articleBodySchema, updateArticleSchema } from "../schemas/articleSchemas.js";

const router = express.Router();

router.use(protect);

router.get("/", getArticles);
router.get("/popular", getPopularArticles);
router.get("/:id", getArticleById);

router.post("/", authorize("it_support", "admin"), validate(articleBodySchema), createArticle);
router.patch("/:id", authorize("it_support", "admin"), validate(updateArticleSchema), updateArticle);
router.delete("/:id", authorize("admin"), deleteArticle);

export default router;