"use client";

import React, { useEffect, useRef, useState } from "react";

interface YouTubeTheaterPlayerProps {
  videoId: string;
  seekTime: number | null;
  onReady?: (player: any) => void;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export function YouTubeTheaterPlayer({ videoId, seekTime, onReady }: YouTubeTheaterPlayerProps) {
  const containerId = "yt-theater-player-iframe";
  const playerRef = useRef<any>(null);
  const [apiLoaded, setApiLoaded] = useState(false);

  // Load YouTube Iframe API Script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiLoaded(true);
      return;
    }

    // Check if script is already added
    const existingScript = document.getElementById("yt-iframe-api-script");
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.id = "yt-iframe-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    // Capture the callback
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      setApiLoaded(true);
    };

    return () => {
      // Restore callback if needed, though usually fine
    };
  }, []);

  // Initialize/Update player
  useEffect(() => {
    if (!apiLoaded || !videoId) return;

    // Destroy existing player if it exists
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        console.error("Error destroying YT player:", e);
      }
      playerRef.current = null;
    }

    // Create container element dynamically inside wrapper to ensure clean rebuild
    const container = document.getElementById(containerId);
    if (!container) return;

    const createPlayer = () => {
      try {
        const player = new window.YT.Player(containerId, {
          height: "100%",
          width: "100%",
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            modestbranding: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              playerRef.current = event.target;
              if (onReady) onReady(event.target);
            },
          },
        });
      } catch (err) {
        console.error("Failed to construct YouTube player:", err);
      }
    };

    // If window.YT.Player exists (which it should since apiLoaded is true)
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      // Double check in case of race conditions
      const checkInterval = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkInterval);
          createPlayer();
        }
      }, 200);
      return () => clearInterval(checkInterval);
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [videoId, apiLoaded]);

  // Handle seeks when seekTime changes
  useEffect(() => {
    if (playerRef.current && seekTime !== null) {
      try {
        playerRef.current.seekTo(seekTime, true);
        playerRef.current.playVideo();
      } catch (err) {
        console.error("Error seeking video:", err);
      }
    }
  }, [seekTime]);

  return (
    <div className="w-full h-full relative aspect-video bg-slate-950 rounded-2xl border shadow-lg overflow-hidden">
      <div id={containerId} className="w-full h-full" />
    </div>
  );
}
