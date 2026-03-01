"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, ExternalLink, Trash2, Loader2 } from "lucide-react";
import type { SlideResource } from "@/lib/types";

interface PageResourcesProps {
  slideId: string;
  pageNumber: number;
  isAdmin: boolean;
}

export function PageResources({
  slideId,
  pageNumber,
  isAdmin,
}: PageResourcesProps) {
  const router = useRouter();
  const [resources, setResources] = useState<SlideResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch resources when page changes
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("slide_resources")
        .select("*")
        .eq("slide_id", slideId)
        .eq("page_number", pageNumber)
        .order("sort_order");

      setResources((data as SlideResource[]) ?? []);
      setLoading(false);
    };

    fetchResources();
  }, [slideId, pageNumber]);

  const handleAddResource = async () => {
    if (!url.trim()) return;
    setAdding(true);

    try {
      // Fetch OG metadata
      const metaRes = await fetch("/api/og-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const meta = metaRes.ok
        ? await metaRes.json()
        : { ogTitle: null, ogDescription: null, ogImage: null, ogSiteName: null };

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("slide_resources")
        .insert({
          slide_id: slideId,
          page_number: pageNumber,
          url: url.trim(),
          og_title: meta.ogTitle,
          og_description: meta.ogDescription,
          og_image: meta.ogImage,
          og_site_name: meta.ogSiteName,
          sort_order: resources.length,
          added_by: user?.id ?? null,
        })
        .select()
        .single();

      if (error) throw error;

      setResources((prev) => [...prev, data as SlideResource]);
      setUrl("");
      setAddOpen(false);
    } catch (error) {
      console.error("Add resource error:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (resourceId: string) => {
    setDeleting(resourceId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("slide_resources")
        .delete()
        .eq("id", resourceId);

      if (error) throw error;
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
    } catch (error) {
      console.error("Delete resource error:", error);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">
          페이지 {pageNumber} 자료
        </h3>
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 gap-1 text-xs">
                <Plus className="h-3 w-3" />
                링크 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>링크 자료 추가</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label>URL *</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddResource()}
                  />
                </div>
                <Button
                  onClick={handleAddResource}
                  disabled={adding || !url.trim()}
                  className="w-full"
                >
                  {adding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      추가 중...
                    </>
                  ) : (
                    "추가"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : resources.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">
          이 페이지에 등록된 자료가 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {resources.map((resource) => (
            <a
              key={resource.id}
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-md border p-2.5 transition-colors hover:bg-accent"
            >
              {resource.og_image && (
                <img
                  src={resource.og_image}
                  alt=""
                  className="h-12 w-16 rounded object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {resource.og_title || resource.url}
                </p>
                {resource.og_description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {resource.og_description}
                  </p>
                )}
                {resource.og_site_name && (
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                    {resource.og_site_name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(resource.id);
                    }}
                  >
                    {deleting === resource.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
