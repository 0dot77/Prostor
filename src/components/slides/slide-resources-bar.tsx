"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, Link2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getBrandInfo, getDomain, stringToHue, getValidOgImage } from "@/lib/brand-utils";
import type { SlideResource } from "@/lib/types";

interface SlideResourcesBarProps {
  slideId: string;
  isAdmin: boolean;
}

export function SlideResourcesBar({ slideId, isAdmin }: SlideResourcesBarProps) {
  const [resources, setResources] = useState<SlideResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fetch resources for this slide
  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from("slide_resources")
        .select("*")
        .eq("slide_id", slideId)
        .order("sort_order");

      setResources((data as SlideResource[]) ?? []);
      setLoading(false);
    };
    fetchResources();
  }, [slideId]);

  const handleAdd = async () => {
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
          page_number: 0, // Not used in slide-level resources
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

  if (loading) {
    return (
      <div className="flex h-24 items-center justify-center border-t bg-background">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (resources.length === 0 && !isAdmin) return null;

  return (
    <div className="border-t bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            관련 자료 {resources.length > 0 && `(${resources.length})`}
          </span>
        </div>
        {isAdmin && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 gap-1 text-xs">
                <Plus className="h-3 w-3" />
                추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>링크 자료 추가</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <Button onClick={handleAdd} disabled={adding || !url.trim()} className="w-full">
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

      {/* Cards - horizontal scroll */}
      {resources.length > 0 && (
        <div className="flex gap-3 overflow-x-auto px-4 pb-3">
          <AnimatePresence mode="popLayout">
            {resources.map((resource) => (
              <motion.a
                key={resource.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-52 shrink-0 rounded-xl overflow-hidden transition-shadow hover:shadow-lg"
                style={{ aspectRatio: "16 / 10" }}
              >
                {/* Background layer: OG image > brand color > hue fallback */}
                {(() => {
                  const brand = getBrandInfo(resource.url);
                  const validImage = getValidOgImage(resource.og_image);
                  const hasImage = !!validImage;

                  if (hasImage) {
                    return (
                      <div className="absolute inset-0">
                        <img
                          src={validImage!}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    );
                  }
                  if (brand) {
                    return (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: brand.color }}
                      >
                        <span
                          className="text-[56px] font-black opacity-10 select-none"
                          style={{ color: brand.textColor }}
                        >
                          {brand.icon}
                        </span>
                      </div>
                    );
                  }
                  const hue = stringToHue(getDomain(resource.url));
                  return (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: `hsl(${hue}, 30%, 25%)` }}
                    >
                      <span
                        className="text-[56px] font-black opacity-10 select-none"
                        style={{ color: `hsl(${hue}, 40%, 70%)` }}
                      >
                        {getDomain(resource.url).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  );
                })()}

                {/* Gradient overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.05) 100%)",
                  }}
                />

                {/* Content at bottom */}
                {(() => {
                  const brand = getBrandInfo(resource.url);
                  const domain = getDomain(resource.url);
                  const displayName = resource.og_title || brand?.name || domain;
                  return (
                    <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-2.5">
                      {/* Brand icon + name row */}
                      <div className="flex items-center gap-1.5">
                        {brand ? (
                          <span
                            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                            style={{ backgroundColor: brand.color, color: brand.textColor }}
                          >
                            {brand.icon}
                          </span>
                        ) : (
                          (() => {
                            const hue = stringToHue(domain);
                            return (
                              <span
                                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold"
                                style={{ backgroundColor: `hsl(${hue}, 35%, 40%)`, color: "#fff" }}
                              >
                                {domain.charAt(0).toUpperCase()}
                              </span>
                            );
                          })()
                        )}
                        <span className="text-[11px] font-semibold text-white truncate">
                          {brand?.name || domain}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/70 truncate leading-tight">
                        {displayName}
                      </p>
                    </div>
                  );
                })()}

                {/* Delete button (admin) */}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-5 w-5 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 hover:bg-black/60 backdrop-blur-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(resource.id);
                    }}
                  >
                    {deleting === resource.id ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-2.5 w-2.5" />
                    )}
                  </Button>
                )}
              </motion.a>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
