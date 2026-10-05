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

const router = express.Router();

router.use(protect);

router.get("/", getArticles);
router.get("/popular", getPopularArticles);
router.get("/:id", getArticleById);

router.post("/", authorize("it_support", "admin"), createArticle);
router.patch("/:id", authorize("it_support", "admin"), updateArticle);
router.delete("/:id", authorize("admin"), deleteArticle);

export default router;