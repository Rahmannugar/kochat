import { notFound } from "next/navigation";
import { RoomPageShell } from "@/components/workspace/RoomPageShell";
import { requireAuthUser } from "@/lib/auth/requireAuthUser";
import { roomService } from "@/lib/rooms/room.service";

type RoomPageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

const RoomPage = async ({ params }: RoomPageProps) => {
  const user = await requireAuthUser();
  const { roomId } = await params;
  let room;

  try {
    room = await roomService.getRoomForUser(roomId, user.id);
  } catch {
    notFound();
  }

  return <RoomPageShell user={user} room={room} />;
};

export default RoomPage;
