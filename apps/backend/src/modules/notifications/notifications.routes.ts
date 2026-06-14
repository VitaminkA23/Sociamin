import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  handleGetNotifications,
  handleMarkAllRead,
  handleClearAll,
} from "./notifications.controller.js";

const router: IRouter = Router();

router.use(requireAuth);

router.get("/", handleGetNotifications);
router.patch("/read-all", handleMarkAllRead);
router.delete("/", handleClearAll);

export default router;
