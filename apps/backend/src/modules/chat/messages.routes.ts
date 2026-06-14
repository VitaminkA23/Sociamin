import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { handleEditMessage, handleDeleteMessage } from "./chat.controller.js";

const router: IRouter = Router();

router.use(requireAuth);

router.put("/:id", handleEditMessage);
router.delete("/:id", handleDeleteMessage);

export default router;
