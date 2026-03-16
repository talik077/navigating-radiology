"use client";

import { useEffect, useRef } from "react";

interface VimeoPlayerProps {
  url: string;
  autoplay?: boolean;
  onEnded?: () => void;
}

export default function VimeoPlayer({ url, autoplay = true, onEnded }: VimeoPlayerProps) {
  const videoRef = useRef<HTMLIFrameElement>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const src = (() => {
    const sep = url.includes("?") ? "&" : "?";
    const params = [
      autoplay && "autoplay=1",
      "dnt=1",
      "title=0",
      "byline=0",
      "portrait=0",
      "vimeo_logo=0",
      "transparent=1",
      "playsinline=1",
      "autopause=0",
    ].filter(Boolean).join("&");
    return `${url}${sep}${params}`;
  })();

  // Modern Vimeo Player SDK postMessage API
  useEffect(() => {
    const iframe = videoRef.current;
    if (!iframe) return;

    const postToVimeo = (method: string, value?: string | number) => {
      const msg: Record<string, string | number> = { method };
      if (value !== undefined) msg.value = value;
      iframe.contentWindow?.postMessage(JSON.stringify(msg), "https://player.vimeo.com");
    };

    const handleMessage = (e: MessageEvent) => {
      if (e.origin !== "https://player.vimeo.com") return;

      let data = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }

      if (data?.event === "ready") {
        postToVimeo("addEventListener", "ended");
      }

      // When video ends, seek to start and pause to prevent end-screen popup
      if (data?.event === "ended") {
        postToVimeo("setCurrentTime", 0);
        postToVimeo("pause");
        onEndedRef.current?.();
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <iframe
      ref={videoRef}
      src={src}
      className="aspect-video w-full"
      allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media"
      allowFullScreen
    />
  );
}
