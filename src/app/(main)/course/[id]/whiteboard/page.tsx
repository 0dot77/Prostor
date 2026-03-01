import { createClient } from "@/lib/supabase/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getDisplayName } from "@/lib/user-utils";
import { WhiteboardClient } from "./whiteboard-client";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WhiteboardPage({ params }: PageProps) {
  const { id: courseId } = await params;
  const { id: userId, profile } = await getAuthenticatedUser();

  const supabase = await createClient();

  // Get whiteboard for this course
  const { data: whiteboard } = await supabase
    .from("whiteboards")
    .select("*")
    .eq("course_id", courseId)
    .single();

  if (!whiteboard) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          이 강의에 화이트보드가 아직 생성되지 않았습니다.
        </p>
      </div>
    );
  }

  return (
    <WhiteboardClient
      roomId={whiteboard.room_id}
      userId={userId}
      userName={getDisplayName(profile)}
      userAvatar={profile.avatar_url ?? undefined}
    />
  );
}
