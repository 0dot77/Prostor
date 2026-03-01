"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PictureInPicture2, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Slide, SlideSourceType } from "@/lib/types";

interface PipSlideViewerProps {
  slides: Slide[];
  currentSlideId: string;
  onSlideChange: (slideId: string) => void;
}

function getIframeSrc(slide: Slide): string {
  const sourceType = slide.source_type as SlideSourceType | null;
  if (sourceType === "google_slides" || sourceType === "google_drive_pdf") {
    return slide.file_url;
  }
  return `https://docs.google.com/viewer?url=${encodeURIComponent(slide.file_url)}&embedded=true`;
}

/**
 * PiP (Picture-in-Picture) slide viewer using the Document PiP API.
 * Falls back to hiding the button on unsupported browsers.
 */
export function PipSlideViewer({
  slides,
  currentSlideId,
  onSlideChange,
}: PipSlideViewerProps) {
  const [isPip, setIsPip] = useState(false);
  const [supported, setSupported] = useState(false);
  const pipWindowRef = useRef<Window | null>(null);
  const slideIdRef = useRef(currentSlideId);

  // Keep ref in sync
  slideIdRef.current = currentSlideId;

  // Check Document PiP support
  useEffect(() => {
    setSupported("documentPictureInPicture" in window);
  }, []);

  const currentIndex = slides.findIndex((s) => s.id === currentSlideId);
  const currentSlide = slides[currentIndex];

  const goNext = useCallback(() => {
    const idx = slides.findIndex((s) => s.id === slideIdRef.current);
    if (idx < slides.length - 1) {
      onSlideChange(slides[idx + 1].id);
    }
  }, [slides, onSlideChange]);

  const goPrev = useCallback(() => {
    const idx = slides.findIndex((s) => s.id === slideIdRef.current);
    if (idx > 0) {
      onSlideChange(slides[idx - 1].id);
    }
  }, [slides, onSlideChange]);

  // Close PiP when component unmounts
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
        pipWindowRef.current = null;
      }
    };
  }, []);

  // Update PiP window content when slide changes
  useEffect(() => {
    if (!isPip || !pipWindowRef.current) return;
    const pipDoc = pipWindowRef.current.document;
    const iframe = pipDoc.getElementById("pip-iframe") as HTMLIFrameElement;
    const counter = pipDoc.getElementById("pip-counter");
    const prevBtn = pipDoc.getElementById("pip-prev") as HTMLButtonElement;
    const nextBtn = pipDoc.getElementById("pip-next") as HTMLButtonElement;

    if (iframe && currentSlide) {
      iframe.src = getIframeSrc(currentSlide);
    }
    if (counter) {
      counter.textContent = `${currentIndex + 1} / ${slides.length}`;
    }
    if (prevBtn) {
      prevBtn.disabled = currentIndex <= 0;
      prevBtn.style.opacity = currentIndex <= 0 ? "0.3" : "1";
    }
    if (nextBtn) {
      nextBtn.disabled = currentIndex >= slides.length - 1;
      nextBtn.style.opacity = currentIndex >= slides.length - 1 ? "0.3" : "1";
    }
  }, [isPip, currentSlide, currentIndex, slides.length]);

  const openPip = async () => {
    if (!("documentPictureInPicture" in window)) return;

    try {
      // @ts-expect-error — Document PiP API not yet in TS types
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 800,
        height: 520,
      });

      pipWindowRef.current = pipWindow;

      // Build the PiP document
      const pipDoc = pipWindow.document;
      pipDoc.title = currentSlide?.title ?? "Prostor Slides";

      // Styles
      const style = pipDoc.createElement("style");
      style.textContent = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0a0a0a;
          color: #fff;
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
        }
        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 12px;
          background: #161616;
          border-bottom: 1px solid #222;
          flex-shrink: 0;
        }
        .toolbar-title {
          font-size: 12px;
          font-weight: 600;
          color: #aaa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }
        .toolbar-nav {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .nav-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #ccc;
          cursor: pointer;
          transition: background 0.15s;
        }
        .nav-btn:hover:not(:disabled) { background: #333; color: #fff; }
        .nav-btn:disabled { cursor: default; }
        .counter {
          font-size: 11px;
          color: #666;
          min-width: 50px;
          text-align: center;
        }
        .close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #666;
          cursor: pointer;
          transition: all 0.15s;
        }
        .close-btn:hover { background: #331111; color: #f66; }
        .viewer {
          flex: 1;
          min-height: 0;
        }
        .viewer iframe {
          width: 100%;
          height: 100%;
          border: none;
        }
      `;
      pipDoc.head.appendChild(style);

      // Toolbar
      const toolbar = pipDoc.createElement("div");
      toolbar.className = "toolbar";

      // Title
      const title = pipDoc.createElement("span");
      title.className = "toolbar-title";
      title.textContent = currentSlide?.title ?? "Slide";
      toolbar.appendChild(title);

      // Nav container
      const nav = pipDoc.createElement("div");
      nav.className = "toolbar-nav";

      // Prev button
      const prevBtn = pipDoc.createElement("button");
      prevBtn.id = "pip-prev";
      prevBtn.className = "nav-btn";
      prevBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`;
      prevBtn.disabled = currentIndex <= 0;
      prevBtn.style.opacity = currentIndex <= 0 ? "0.3" : "1";
      prevBtn.addEventListener("click", () => goPrev());
      nav.appendChild(prevBtn);

      // Counter
      const counter = pipDoc.createElement("span");
      counter.id = "pip-counter";
      counter.className = "counter";
      counter.textContent = `${currentIndex + 1} / ${slides.length}`;
      nav.appendChild(counter);

      // Next button
      const nextBtn = pipDoc.createElement("button");
      nextBtn.id = "pip-next";
      nextBtn.className = "nav-btn";
      nextBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`;
      nextBtn.disabled = currentIndex >= slides.length - 1;
      nextBtn.style.opacity = currentIndex >= slides.length - 1 ? "0.3" : "1";
      nextBtn.addEventListener("click", () => goNext());
      nav.appendChild(nextBtn);

      toolbar.appendChild(nav);

      // Close button
      const closeBtn = pipDoc.createElement("button");
      closeBtn.className = "close-btn";
      closeBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`;
      closeBtn.addEventListener("click", () => pipWindow.close());
      toolbar.appendChild(closeBtn);

      pipDoc.body.appendChild(toolbar);

      // Viewer
      const viewer = pipDoc.createElement("div");
      viewer.className = "viewer";

      const iframe = pipDoc.createElement("iframe");
      iframe.id = "pip-iframe";
      iframe.src = currentSlide ? getIframeSrc(currentSlide) : "";
      iframe.allowFullscreen = true;
      iframe.title = currentSlide?.title ?? "Slide";
      viewer.appendChild(iframe);

      pipDoc.body.appendChild(viewer);

      // Keyboard navigation in PiP
      pipDoc.addEventListener("keydown", (e: KeyboardEvent) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          goPrev();
        } else if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          goNext();
        } else if (e.key === "Escape") {
          pipWindow.close();
        }
      });

      // Listen for PiP window close
      pipWindow.addEventListener("pagehide", () => {
        setIsPip(false);
        pipWindowRef.current = null;
      });

      setIsPip(true);
    } catch (err) {
      console.error("PiP error:", err);
    }
  };

  const closePip = () => {
    if (pipWindowRef.current) {
      pipWindowRef.current.close();
      pipWindowRef.current = null;
    }
    setIsPip(false);
  };

  if (!supported) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={isPip ? closePip : openPip}
      className={cn(
        "gap-1.5 text-xs",
        isPip && "text-primary"
      )}
      title={isPip ? "PiP 닫기" : "PiP 모드로 보기"}
    >
      <PictureInPicture2 className="h-3.5 w-3.5" />
      {isPip ? "PiP 닫기" : "PiP"}
    </Button>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
