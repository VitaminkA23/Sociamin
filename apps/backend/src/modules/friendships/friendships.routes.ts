import { Router, type IRouter } from "express";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { handleSendRequest, handleAcceptRequest } from "./friendships.controller.js";

const router: IRouter = Router();

router.use(requireAuth);

router.post("/request/:id", handleSendRequest);
router.post("/accept/:id",  handleAcceptRequest);

export default router;
