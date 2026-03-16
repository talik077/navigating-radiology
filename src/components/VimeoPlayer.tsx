"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { RotateCcw, Maximize, Minimize } from "lucide-react";

interface VimeoPlayerProps {
  url: string;
  autoplay?: boolean;
  onEnded?: () => void;
}

export default function VimeoPlayer({ url, autoplay = true, onEnded }: VimeoPlayerProps) {
  const [videoEnded, setVideoEnded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const onEndedRef = useRef(onEnded);
  onEndedRef.current = onEnded;

  const buildSrc = useCallback(
    (extra = "") => {
      const sep = url.includes("?") ? "&" : "?";
      return `${url}${sep}${autoplay ? "autoplay=1&" : ""}dnt=1&api=1${extra}`;
    },
    [url, autoplay],
  );

  // Listen for Vimeo postMessage events (ready + finish)
  useEffect(() => {
    const iframe = videoRef.current;
    if (!iframe) return;

    const postToVimeo = (method: string, value?: string) => {
      const msg: Record<string, string> = { method };
      if (value) msg.value = value;
      iframe.contentWindow?.postMessage(JSON.stringify(msg), "*");
    };

    const handleMessage = (e: MessageEvent) => {
      // Only process messages from Vimeo
      if (!e.origin.includes("vimeo.com")) return;

      let data = e.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          return;
        }
      }

      // When player is ready, subscribe to events
      if (data?.event === "ready") {
        postToVimeo("addEventListener", "finish");
        postToVimeo("addEventListener", "pause");
      }

      // When video finishes, show our overlay instead of Vimeo's end-screen
      if (data?.event === "finish") {
        setVideoEnded(true);
        onEndedRef.current?.();
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Track fullscreen changes
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const replay = () => {
    setVideoEnded(false);
    videoRef.current?.setAttribute("src", buildSrc(`&t=${Date.now()}`));
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      document.exitFullscreen();
    } else {
      containerRef.current?.requestFullscreen();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`group relative ${isFullscreen ? "flex items-center justify-center bg-black" : ""}`}
    >
      <iframe
        ref={videoRef}
        src={buildSrc()}
        className={`aspect-video w-full ${isFullscreen ? "max-h-screen" : ""}`}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
      />

      {/* Replay overlay — covers Vimeo's end-screen popup */}
      {videoEnded && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/90"
          onClick={replay}
        >
          <div className="flex flex-col items-center gap-2 text-default-400 transition-colors hover:text-foreground">
            <RotateCcw size={28} />
            <span className="text-sm">Replay</span>
          </div>
        </div>
      )}

      {/* Fullscreen button — visible on hover */}
      <button
        onClick={toggleFullscreen}
        className="absolute right-2 top-2 rounded-md bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
      </button>
    </div>
  );
}
