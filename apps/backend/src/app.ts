import express, { type Application, type Request, type Response, type NextFunction } from "express";
import path from "path";
import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import postRoutes from "./modules/posts/post.routes.js";
import chatRoutes from "./modules/chat/chat.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import friendshipsRoutes from "./modules/friendships/friendships.routes.js";
import contactRoutes from "./modules/contact/contact.routes.js";
import notificationsRoutes from "./modules/notifications/notifications.routes.js";
import messagesRoutes from "./modules/chat/messages.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware.js";

const app: Application = express();

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") { res.sendStatus(200); return; }
  next();
});

const uploadsDir = env.UPLOADS_DIR ?? path.join(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsDir));
app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "vitamina-backend", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/friendships", friendshipsRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/notifications", notificationsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;