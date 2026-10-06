import mongoose from "mongoose";
import Article, { ARTICLE_CATEGORIES } from "../models/Article.js";

const isStaff = (user) => user.role === "admin" || user.role === "it_support";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getArticles = async (req, res) => {
  try {
    const filter = {};

    const manage = req.query.manage === "true" && isStaff(req.user);
    if (!manage) filter.isPublished = true;

    if (req.query.category) filter.category = req.query.category;

    if (req.query.search) {
      const regex = new RegExp(escapeRegex(req.query.search.trim()), "i");
      filter.$or = [{ title: regex }, { summary: regex }, { content: regex }];
    }

    const articles = await Article.find(filter)
      .select("-content")
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("author", "name");

    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPopularArticles = async (req, res) => {
  try {
    const articles = await Article.find({ isPublished: true })
      .select("-content")
      .sort({ views: -1, createdAt: -1 })
      .limit(5);

    res.json(articles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getArticleById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Article not found" });
    }

    const article = await Article.findById(req.params.id).populate("author", "name");

    if (!article || (!article.isPublished && !isStaff(req.user))) {
      return res.status(404).json({ message: "Article not found" });
    }

    if (article.isPublished && req.query.track !== "false") {
      await Article.updateOne({ _id: article._id }, { $inc: { views: 1 } });
      article.views += 1;
    }

    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createArticle = async (req, res) => {
  try {

    const { title, summary, content, category, isPublished } = req.body;

    const article = await Article.create({
      title,
      summary,
      content,
      category,
      isPublished: isPublished !== false,
      author: req.user._id,
    });

    res.status(201).json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateArticle = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Article not found" });
    }

    const article = await Article.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });

    for (const field of ["title", "summary", "content", "category", "isPublished"]) {
      if (req.body[field] !== undefined) article[field] = req.body[field];
    }

    await article.save();
    res.json(article);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Article not found" });
    }

    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });

    res.json({ message: "Article deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};