import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { uploadImage } from "../../middleware/upload.middleware.js";
import {
  handleSearchUsers,
  handleGetProfile,
  handleUpdateProfile,
  handleUpdateAvatar,
  handleGetSettings,
  handleUpdateSettings,
  handleUpdateAccount,
} from "./users.controller.js";

const router: IRouter = Router();

router.use(requireAuth);

// Named routes before the /:id wildcard to prevent mis-matching
router.put("/profile/avatar", uploadImage, handleUpdateAvatar);
router.put("/profile",        handleUpdateProfile);
router.get("/settings", handleGetSettings);
router.put("/settings", handleUpdateSettings);
router.put("/account",  handleUpdateAccount);
router.get("/search",   handleSearchUsers);
router.get("/:id",      handleGetProfile);

export default router;
