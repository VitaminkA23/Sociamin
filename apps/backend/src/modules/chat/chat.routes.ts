import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import {
  handleCreateChat,
  handleGetChats,
  handleGetMessages,
  handleMarkRoomRead,
} from "./chat.controller.js";

const router: IRouter = Router();

router.use(requireAuth);

router.post("/", handleCreateChat);
router.get("/", handleGetChats);
router.get("/:roomId/messages", handleGetMessages);
router.patch("/:roomId/read", handleMarkRoomRead);

export default router;
