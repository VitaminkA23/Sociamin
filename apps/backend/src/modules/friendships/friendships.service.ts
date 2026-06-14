import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import type { FriendshipRecord } from "./friendships.types.js";

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<FriendshipRecord> {
  if (requesterId === addresseeId) {
    throw new AppError(400, "Cannot send a friend request to yourself");
  }

  const targetExists = await prisma.user.findUnique({
    where: { id: addresseeId },
    select: { id: true },
  });
  if (!targetExists) throw new AppError(404, "User not found");

  const existing = await prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId, addresseeId },
        { requesterId: addresseeId, addresseeId: requesterId },
      ],
    },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") throw new AppError(409, "You are already friends");
    throw new AppError(409, "A friend request already exists between these users");
  }

  return prisma.friendship.create({ data: { requesterId, addresseeId } });
}

export async function acceptFriendRequest(
  addresseeId: string,
  requesterId: string
): Promise<FriendshipRecord> {
  const friendship = await prisma.friendship.findFirst({
    where: { requesterId, addresseeId, status: "PENDING" },
  });

  if (!friendship) {
    throw new AppError(404, "Pending friend request not found");
  }

  return prisma.friendship.update({
    where: { id: friendship.id },
    data: { status: "ACCEPTED" },
  });
}
