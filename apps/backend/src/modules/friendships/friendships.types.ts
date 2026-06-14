export type FriendshipStatusValue = "PENDING" | "ACCEPTED";

export interface FriendshipRecord {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: FriendshipStatusValue;
  createdAt: Date;
  updatedAt: Date;
}
