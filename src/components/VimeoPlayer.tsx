"use client";

import { useEffect, useRef } from "react";
import Player from "@vimeo/player";

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

  useEffect(() => {
    const iframe = videoRef.current;
    if (!iframe) return;

    const player = new Player(iframe);

    player.on("ended", () => {
      player.setCurrentTime(0);
      player.pause();
      onEndedRef.current?.();
    });

    return () => {
      player.off("ended");
    };
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
