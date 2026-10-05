import mongoose from "mongoose";
import Article, { ARTICLE_CATEGORIES } from "../models/Article.js";

const isStaff = (user) => user.role === "admin" || user.role === "it_support";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const text = (value) => (typeof value === "string" ? value.trim() : "");

const validationMessage = ({ title, summary, content, category }) => {
  if (!text(title) || !text(summary) || !text(content)) {
    return "Title, summary and content are required";
  }
  if (!ARTICLE_CATEGORIES.includes(category)) return "Invalid category";
  if (text(title).length > 150) return "Title must be 150 characters or fewer";
  if (text(summary).length > 300) return "Summary must be 300 characters or fewer";
  return null;
};

export const getArticles = async (req, res) => {
  const filter = {};

  // Drafts are only visible to staff who ask for the management view
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
};

export const getPopularArticles = async (req, res) => {
  const articles = await Article.find({ isPublished: true })
    .select("-content")
    .sort({ views: -1, createdAt: -1 })
    .limit(5);

  res.json(articles);
};

export const getArticleById = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Article not found" });
  }

  const article = await Article.findById(req.params.id).populate("author", "name");

  if (!article || (!article.isPublished && !isStaff(req.user))) {
    return res.status(404).json({ message: "Article not found" });
  }

  // The editor passes track=false so editing does not inflate the view count
  if (article.isPublished && req.query.track !== "false") {
    await Article.updateOne({ _id: article._id }, { $inc: { views: 1 } });
    article.views += 1;
  }

  res.json(article);
};

export const createArticle = async (req, res) => {
  const message = validationMessage(req.body);
  if (message) return res.status(400).json({ message });

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
};

export const updateArticle = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Article not found" });
  }

  const article = await Article.findById(req.params.id);
  if (!article) return res.status(404).json({ message: "Article not found" });

  for (const field of ["title", "summary", "content", "category", "isPublished"]) {
    if (req.body[field] !== undefined) article[field] = req.body[field];
  }

  const message = validationMessage(article);
  if (message) return res.status(400).json({ message });

  await article.save();
  res.json(article);
};

export const deleteArticle = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ message: "Article not found" });
  }

  const article = await Article.findByIdAndDelete(req.params.id);
  if (!article) return res.status(404).json({ message: "Article not found" });

  res.json({ message: "Article deleted" });
};