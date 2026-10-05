import mongoose from "mongoose";

export const ARTICLE_CATEGORIES = ["computer", "network", "email", "account", "software", "security"];

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    summary: { type: String, required: true, trim: true, maxlength: 300 },
    content: { type: String, required: true, trim: true },
    category: { type: String, enum: ARTICLE_CATEGORIES, required: true },
    isPublished: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

const Article = mongoose.model("Article", articleSchema);

export default Article;