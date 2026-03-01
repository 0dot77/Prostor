"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook that provides a logout handler.
 * Signs out via Supabase and redirects to the landing page.
 */
export function useLogout() {
  const router = useRouter();

  const logout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }, [router]);

  return logout;
}
