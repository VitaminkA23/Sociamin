import { Router, type IRouter } from "express";
import { handleSubmitContact } from "./contact.controller.js";

const router: IRouter = Router();

// Public — no authentication required
router.post("/", handleSubmitContact);

export default router;
