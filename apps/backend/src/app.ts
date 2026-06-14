import express, { type Application } from "express";
import cors from "cors";
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

// Parse comma-separated origins, e.g. "https://a.vercel.app,https://b.vercel.app"
const allowedOrigins = env.FRONTEND_URL.split(",").map((o) => o.trim());
const corsOrigin = allowedOrigins.length === 1 ? (allowedOrigins[0] ?? "*") : allowedOrigins;

app.use(
  cors({
    origin: corsOrigin,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

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