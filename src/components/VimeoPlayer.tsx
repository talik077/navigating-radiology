"use client";

import { useState, useEffect, useRef } from "react";
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

  const buildSrc = (extra = "") => {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}${autoplay ? "autoplay=1&" : ""}dnt=1&api=1${extra}`;
  };

  // Listen for Vimeo finish event
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      let data = e.data;
      if (typeof data === "string") {
        try { data = JSON.parse(data); } catch { return; }
      }
      if (data?.event === "finish") {
        setVideoEnded(true);
        onEnded?.();
      }
    };

    const onLoad = () => {
      videoRef.current?.contentWindow?.postMessage(
        JSON.stringify({ method: "addEventListener", value: "finish" }),
        "*",
      );
    };

    const iframe = videoRef.current;
    iframe?.addEventListener("load", onLoad);
    window.addEventListener("message", handleMessage);

    return () => {
      iframe?.removeEventListener("load", onLoad);
      window.removeEventListener("message", handleMessage);
    };
  }, [onEnded]);

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

      {/* Replay overlay */}
      {videoEnded && (
        <div
          className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/80"
          onClick={replay}
        >
          <div className="flex flex-col items-center gap-2 text-default-400 transition-colors hover:text-foreground">
            <RotateCcw size={24} />
            <span className="text-xs">Replay</span>
          </div>
        </div>
      )}

      {/* Fullscreen button */}
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
