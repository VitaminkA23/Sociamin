import { Router, type IRouter } from "express";
import { register, login, me, handleChangePassword } from "./auth.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";

const router: IRouter = Router();

router.post("/register",         register);
router.post("/login",            login);
router.get("/me",                requireAuth, me);
router.put("/change-password",   requireAuth, handleChangePassword);

export default router;