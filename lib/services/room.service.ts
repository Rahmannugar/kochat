import { userRepository } from "@/lib/repositories/user.repository";
import { roomRepository } from "@/lib/repositories/room.repository";

const GROUP_ROOM_CODE_PREFIX = "GR";
const createSecureCode = () =>
  crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();

const createGroupCode = () => `${GROUP_ROOM_CODE_PREFIX}-${createSecureCode()}`;
const createDirectMessageKey = (firstUserId: string, secondUserId: string) =>
  [firstUserId, secondUserId].sort().join(":");

const ensureActiveMembership = async (
  roomId: string,
  userId: string,
  role: "owner" | "member" = "member",
) => {
  const existingMembership = await roomRepository.findMembership(
    roomId,
    userId,
  );

  if (!existingMembership) {
    return roomRepository.addMembership({
      roomId,
      userId,
      role,
    });
  }

  if (existingMembership.archivedAt) {
    return roomRepository.updateMembership({
      roomId,
      userId,
      archivedAt: null,
      role,
    });
  }

  return existingMembership;
};

export const roomService = {
  listRoomsForUser: async (userId: string) => {
    return roomRepository.listForUser(userId);
  },

  getRoomForUser: async (roomId: string, userId: string) => {
    const membership = await roomRepository.findMembership(roomId, userId);

    if (!membership || membership.archivedAt) {
      throw new Error("Room not found for this user");
    }

    const room = await roomRepository.findById(roomId);

    if (!room) {
      throw new Error("Room not found");
    }

    return room;
  },

  createGroupRoom: async ({
    name,
    description,
    createdBy,
  }: {
    name: string;
    description?: string;
    createdBy: string;
  }) => {
    const creator = await userRepository.findById(createdBy);

    if (!creator) {
      throw new Error("User not found");
    }

    const room = await roomRepository.create({
      name: name.trim(),
      description: description?.trim(),
      type: "group",
      code: createGroupCode(),
      createdBy,
    });

    await ensureActiveMembership(room.id, createdBy, "owner");

    return room;
  },

  joinGroupRoomByCode: async (code: string, userId: string) => {
    const normalizedCode = code.trim().toUpperCase();
    const room = await roomRepository.findByCode(normalizedCode);

    if (!room || room.type !== "group") {
      throw new Error("Group room not found");
    }

    await ensureActiveMembership(room.id, userId);

    return room;
  },

  archiveRoomForUser: async (roomId: string, userId: string) => {
    const membership = await roomRepository.findMembership(roomId, userId);

    if (!membership) {
      throw new Error("Room membership not found");
    }

    return roomRepository.updateMembership({
      roomId,
      userId,
      archivedAt: new Date(),
    });
  },

  findOrCreateDirectRoom: async (
    currentUserId: string,
    targetUserId: string,
  ) => {
    if (currentUserId === targetUserId) {
      throw new Error("You cannot start a direct chat with yourself");
    }

    const targetUser = await userRepository.findById(targetUserId);

    if (!targetUser) {
      throw new Error("Target user was not found");
    }
    const dmKey = createDirectMessageKey(currentUserId, targetUserId);
    const room = await roomRepository.createDirectRoom({
      name: `${currentUserId}:${targetUserId}`,
      dmKey,
      createdBy: currentUserId,
    });

    if (!room) {
      throw new Error("Unable to create or retrieve direct room")
    }

    await Promise.all([
      ensureActiveMembership(room.id, currentUserId),
      ensureActiveMembership(room.id, targetUserId),
    ]);

    return room;
  },
};
