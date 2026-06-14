import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import type {
  UserProfile,
  UserProfileResponse,
  UpdateProfileResponse,
  FriendshipActionResponse,
  ViewerFriendshipStatus,
} from "../types/api";

interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  isOwnProfile: boolean;
  isSaving: boolean;
  friendshipStatus: ViewerFriendshipStatus;
  updateProfile: (data: {
    displayName?: string | null;
    bio?: string | null;
    location?: string | null;
    avatarUrl?: string | null;
  }) => Promise<void>;
  sendFriendRequest: () => Promise<void>;
  acceptFriendRequest: () => Promise<void>;
}

export function useProfile(targetUserId?: string): UseProfileReturn {
  const { user: currentUser } = useAuth();

  const resolvedId = targetUserId ?? currentUser?.id;
  const isOwnProfile = !targetUserId || targetUserId === currentUser?.id;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [friendshipStatus, setFriendshipStatus] = useState<ViewerFriendshipStatus>("NONE");

  useEffect(() => {
    if (!resolvedId) return;
    let cancelled = false;
    setIsLoading(true);

    api
      .get<UserProfileResponse>(`/users/${resolvedId}`)
      .then((res) => {
        if (cancelled) return;
        setProfile(res.data);
        setFriendshipStatus(res.data.friendshipStatus);
      })
      .catch(() => {
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [resolvedId]);

  const updateProfile = useCallback(
    async (data: { displayName?: string | null; bio?: string | null; location?: string | null; avatarUrl?: string | null }) => {
      setIsSaving(true);
      try {
        const res = await api.put<UpdateProfileResponse>("/users/profile", data);
        setProfile((prev) => (prev ? { ...prev, ...res.data } : prev));
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  const sendFriendRequest = useCallback(async () => {
    if (!resolvedId) return;
    await api.post<FriendshipActionResponse>(`/friendships/request/${resolvedId}`);
    setFriendshipStatus("PENDING_SENT");
  }, [resolvedId]);

  const acceptFriendRequest = useCallback(async () => {
    if (!resolvedId) return;
    await api.post<FriendshipActionResponse>(`/friendships/accept/${resolvedId}`);
    setFriendshipStatus("ACCEPTED");
    // Add the user to the local friends list
    setProfile((prev) => {
      if (!prev || !profile) return prev;
      const newFriend = {
        id: profile.id,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
      };
      return {
        ...prev,
        friends: [...prev.friends, newFriend],
      };
    });
  }, [resolvedId, profile]);

  return {
    profile,
    isLoading,
    isOwnProfile,
    isSaving,
    friendshipStatus,
    updateProfile,
    sendFriendRequest,
    acceptFriendRequest,
  };
}
