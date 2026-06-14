import { z } from "zod";

// ── Request schemas ────────────────────────────────────────────────────────────

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, "Search term must be at least 2 characters").max(100),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().max(50, "Display name must be 50 characters or less").nullable().optional(),
  bio:       z.string().trim().max(300, "Bio must be 300 characters or less").nullable().optional(),
  location:  z.string().trim().max(100, "Location must be 100 characters or less").nullable().optional(),
  avatarUrl: z.string().url("avatarUrl must be a valid URL").nullable().optional(),
});

export const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications:  z.boolean().optional(),
  isPrivateProfile:   z.boolean().optional(),
});

export const updateAccountSchema = z.object({
  email:       z.string().email("Invalid email address").toLowerCase().optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number format").optional(),
}).refine(
  (d) => d.email !== undefined || d.phoneNumber !== undefined,
  { message: "Provide at least one field to update" },
);

export type SearchQuery        = z.infer<typeof searchQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type UpdateAccountInput  = z.infer<typeof updateAccountSchema>;

// ── Friendship status as seen by the viewer ────────────────────────────────────
// "NONE"             – no relationship exists
// "PENDING_SENT"     – viewer sent the request, awaiting acceptance
// "PENDING_RECEIVED" – other user sent a request to viewer
// "ACCEPTED"         – mutual friends
export type ViewerFriendshipStatus =
  | "NONE"
  | "PENDING_SENT"
  | "PENDING_RECEIVED"
  | "ACCEPTED";

// ── Response shapes ────────────────────────────────────────────────────────────

export interface SafeUser {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface UserProfile {
  id: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
  createdAt: Date;
  friends: SafeUser[];
  friendshipStatus: ViewerFriendshipStatus;
  isPrivate: boolean;
}

export interface UpdatedProfile {
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  location: string | null;
}

export interface UpdatedAvatar {
  avatarUrl: string;
}

export interface UserSettings {
  emailNotifications: boolean;
  pushNotifications:  boolean;
  isPrivateProfile:   boolean;
}

export interface AccountUpdate {
  email: string | null;
  phoneNumber: string | null;
}
