import type { Request, Response, NextFunction } from "express";
import type { AuthRequest } from "../../middleware/auth.middleware.js";
import { AppError } from "../../middleware/error.middleware.js";
import { sendFriendRequest, acceptFriendRequest } from "./friendships.service.js";
import { getBasicUser } from "../users/users.service.js";
import { getIo } from "../../socket/io-instance.js";
import { createNotification } from "../notifications/notifications.service.js";

function viewerId(req: Request): string {
  return (req as AuthRequest).userId;
}

function toDisplayName(displayName: string | null, email: string | null, phoneNumber: string | null): string {
  return displayName ?? email ?? phoneNumber ?? "Someone";
}

export async function handleSendRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const requesterId = viewerId(req);
    const { id: addresseeId } = req.params;
    if (!addresseeId) {
      next(new AppError(400, "Target user ID is required"));
      return;
    }

    const friendship = await sendFriendRequest(requesterId, addresseeId);

    // Fire-and-forget: fetch sender info then notify the addressee.
    // Failures here must never surface as HTTP errors.
    void (async () => {
      try {
        const sender = await getBasicUser(requesterId);
        const senderName = sender
          ? toDisplayName(sender.displayName, sender.email, sender.phoneNumber)
          : "Someone";
        getIo().to(addresseeId).emit("new_notification", {
          type: "FRIEND_REQUEST",
          senderName,
          senderId: requesterId,
        });
        await createNotification({
          type: "FRIEND_REQUEST",
          message: `${senderName} sent you a friend request!`,
          userId: addresseeId,
          senderId: requesterId,
          senderName,
          entityId: requesterId,
        });
      } catch (err) {
        console.warn("[ws] friend-request notification failed:", err);
      }
    })();

    res.status(201).json({ success: true, data: friendship });
  } catch (err) {
    next(err);
  }
}

export async function handleAcceptRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (!id) {
      next(new AppError(400, "Requester user ID is required"));
      return;
    }
    const friendship = await acceptFriendRequest(viewerId(req), id);
    res.json({ success: true, data: friendship });
  } catch (err) {
    next(err);
  }
}
