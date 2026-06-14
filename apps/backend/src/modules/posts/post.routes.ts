import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { uploadImage } from "../../middleware/upload.middleware.js";
import {
  handleCreatePost,
  handleGetFeed,
  handleUpdatePost,
  handleDeletePost,
  handleToggleLike,
  handleAddComment,
  handleGetComments,
} from "./post.controller.js";

const router: IRouter = Router();

// All post routes require authentication
router.use(requireAuth);

router.post("/", uploadImage, handleCreatePost);
router.get("/", handleGetFeed);
router.put("/:id", handleUpdatePost);
router.delete("/:id", handleDeletePost);
router.post("/:id/like", handleToggleLike);
router.post("/:id/comments", handleAddComment);
router.get("/:id/comments", handleGetComments);

export default router;