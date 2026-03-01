"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Trash2 } from "lucide-react";
import type { CourseMemberWithUser } from "@/lib/types";

interface MemberManagerProps {
  courseId: string;
  members: CourseMemberWithUser[];
}

export function MemberManager({
  courseId,
  members: initialMembers,
}: MemberManagerProps) {
  const router = useRouter();
  const [members, setMembers] = useState<CourseMemberWithUser[]>(initialMembers);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync local state when server data changes
  useEffect(() => {
    setMembers(initialMembers);
  }, [initialMembers]);

  const handleAddMember = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.trim())
      .single();

    if (userError || !user) {
      setError("해당 이메일의 사용자를 찾을 수 없습니다. 먼저 로그인한 적이 있는 사용자만 등록 가능합니다.");
      setLoading(false);
      return;
    }

    // Check if already enrolled
    const existing = members.find((m) => m.user_id === user.id);
    if (existing) {
      setError("이미 등록된 수강생입니다.");
      setLoading(false);
      return;
    }

    // Enroll
    const { data: enrollment, error: enrollError } = await supabase
      .from("course_members")
      .insert({
        course_id: courseId,
        user_id: user.id,
        role: "student",
      })
      .select("*, users(*)")
      .single();

    if (enrollError) {
      setError("등록에 실패했습니다.");
      setLoading(false);
      return;
    }

    setMembers([...members, enrollment as CourseMemberWithUser]);
    setEmail("");
    setLoading(false);
    router.refresh();
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("이 수강생을 제거하시겠습니까?")) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("course_members")
      .delete()
      .eq("id", memberId);

    if (!error) {
      setMembers(members.filter((m) => m.id !== memberId));
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold">수강생 관리</h3>

      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          아직 수강생이 없습니다. 이메일로 등록해보세요.
        </p>
      ) : (
        <div className="flex flex-col gap-1">
          {members.map((member) => {
            const user = member.users;
            const displayName = user?.name ?? user?.email ?? "Unknown";
            const initials = displayName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-md border px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm">{displayName}</span>
                    <span className="text-xs text-muted-foreground">
                      {user?.email} · {member.role === "instructor" ? "강사" : "학생"}
                    </span>
                  </div>
                </div>
                {member.role !== "instructor" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
            placeholder="학생 이메일 주소"
            type="email"
            onKeyDown={(e) => e.key === "Enter" && handleAddMember()}
          />
          <Button
            onClick={handleAddMember}
            disabled={loading || !email.trim()}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  );
}
