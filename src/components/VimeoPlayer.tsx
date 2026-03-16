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
    return `${url}${sep}${autoplay ? "autoplay=1&" : ""}dnt=1&api=1`;
  })();

  // Listen for Vimeo 'ready' then subscribe to 'finish' to reset player
  useEffect(() => {
    const iframe = videoRef.current;
    if (!iframe) return;

    const postToVimeo = (method: string, value?: string | number) => {
      const msg: Record<string, string | number> = { method };
      if (value !== undefined) msg.value = value;
      iframe.contentWindow?.postMessage(JSON.stringify(msg), "*");
    };

    const handleMessage = (e: MessageEvent) => {
      if (!e.origin.includes("vimeo.com")) return;

      let data = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }

      if (data?.event === "ready") {
        postToVimeo("addEventListener", "finish");
      }

      // When video ends, seek back to start to avoid Vimeo's end-screen popup
      if (data?.event === "finish") {
        postToVimeo("seekTo", 0);
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
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
    />
  );
}
