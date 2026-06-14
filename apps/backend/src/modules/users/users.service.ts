import { prisma } from "../../config/prisma.js";
import { AppError } from "../../middleware/error.middleware.js";
import type {
  SafeUser,
  UserProfile,
  UpdatedProfile,
  UpdatedAvatar,
  UpdateProfileInput,
  UpdateSettingsInput,
  UpdateAccountInput,
  UserSettings,
  AccountUpdate,
  ViewerFriendshipStatus,
} from "./users.types.js";

const safeUserSelect = { id: true, email: true, phoneNumber: true, displayName: true, avatarUrl: true } as const;

const settingsSelect = {
  emailNotifications: true,
  pushNotifications: true,
  isPrivateProfile: true,
} as const;

export async function searchUsers(q: string, excludeUserId: string): Promise<SafeUser[]> {
  return prisma.user.findMany({
    where: {
      id: { not: excludeUserId },
      OR: [
        { email: { contains: q, mode: "insensitive" } },
        { phoneNumber: { contains: q, mode: "insensitive" } },
      ],
    },
    select: safeUserSelect,
    take: 10,
  });
}

export async function getUserProfile(
  targetUserId: string,
  viewerUserId: string
): Promise<UserProfile> {
  const [user, friendship] = await prisma.$transaction([
    prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        location: true,
        createdAt: true,
        isPrivateProfile: true,
      },
    }),
    prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: viewerUserId, addresseeId: targetUserId },
          { requesterId: targetUserId, addresseeId: viewerUserId },
        ],
      },
    }),
  ]);

  if (!user) throw new AppError(404, "User not found");

  let friendshipStatus: ViewerFriendshipStatus = "NONE";
  if (friendship) {
    if (friendship.status === "ACCEPTED") {
      friendshipStatus = "ACCEPTED";
    } else if (friendship.requesterId === viewerUserId) {
      friendshipStatus = "PENDING_SENT";
    } else {
      friendshipStatus = "PENDING_RECEIVED";
    }
  }

  // Private-profile gate: non-owners without an accepted friendship see limited data
  const isOwner = targetUserId === viewerUserId;
  if (user.isPrivateProfile && !isOwner && friendshipStatus !== "ACCEPTED") {
    return {
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      displayName: user.displayName,
      bio: null,
      avatarUrl: user.avatarUrl,
      location: null,
      createdAt: user.createdAt,
      friends: [],
      friendshipStatus,
      isPrivate: true,
    };
  }

  const acceptedFriendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: targetUserId }, { addresseeId: targetUserId }],
    },
    select: {
      requesterId: true,
      addresseeId: true,
      requester: { select: safeUserSelect },
      addressee: { select: safeUserSelect },
    },
  });

  const friends = acceptedFriendships.map((f) =>
    f.requesterId === targetUserId ? f.addressee : f.requester
  );

  return { ...user, friends, friendshipStatus, isPrivate: false };
}

export async function getBasicUser(userId: string): Promise<SafeUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: safeUserSelect,
  });
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UpdatedProfile> {
  const data: Record<string, string | null> = {};
  if (input.displayName !== undefined) data["displayName"] = input.displayName;
  if (input.bio !== undefined)         data["bio"]         = input.bio;
  if (input.location !== undefined)    data["location"]    = input.location;
  if (input.avatarUrl !== undefined)   data["avatarUrl"]   = input.avatarUrl;

  return prisma.user.update({
    where: { id: userId },
    data,
    select: { displayName: true, bio: true, avatarUrl: true, location: true },
  });
}

export async function updateAvatarFromFile(
  userId: string,
  filename: string
): Promise<UpdatedAvatar> {
  const avatarUrl = `/uploads/${filename}`;
  await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });
  return { avatarUrl };
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: settingsSelect,
  });
  if (!user) throw new AppError(404, "User not found");
  return user;
}

export async function updateUserSettings(
  userId: string,
  input: UpdateSettingsInput
): Promise<UserSettings> {
  const data: Partial<{ emailNotifications: boolean; pushNotifications: boolean; isPrivateProfile: boolean }> = {};
  if (input.emailNotifications !== undefined) data.emailNotifications = input.emailNotifications;
  if (input.pushNotifications !== undefined)  data.pushNotifications  = input.pushNotifications;
  if (input.isPrivateProfile !== undefined)   data.isPrivateProfile   = input.isPrivateProfile;

  return prisma.user.update({
    where: { id: userId },
    data,
    select: settingsSelect,
  });
}

export async function updateUserAccount(
  userId: string,
  input: UpdateAccountInput
): Promise<AccountUpdate> {
  if (input.email !== undefined) {
    const conflict = await prisma.user.findFirst({
      where: { email: input.email, id: { not: userId } },
      select: { id: true },
    });
    if (conflict) throw new AppError(409, "That email address is already in use");
  }

  if (input.phoneNumber !== undefined) {
    const conflict = await prisma.user.findFirst({
      where: { phoneNumber: input.phoneNumber, id: { not: userId } },
      select: { id: true },
    });
    if (conflict) throw new AppError(409, "That phone number is already in use");
  }

  const data: Record<string, string> = {};
  if (input.email !== undefined)       data["email"]       = input.email;
  if (input.phoneNumber !== undefined) data["phoneNumber"] = input.phoneNumber;

  return prisma.user.update({
    where: { id: userId },
    data,
    select: { email: true, phoneNumber: true },
  });
}
