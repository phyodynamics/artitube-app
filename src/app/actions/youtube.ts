"use server";

import { YoutubeTranscript } from 'youtube-transcript';

interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
  timestamp: string;
}

interface YouTubeDetailsResult {
  title: string;
  description: string;
  duration: number; // in seconds
  transcriptText: string;
  transcriptSegments: TranscriptSegment[];
  hasTranscript: boolean;
  error?: string;
}

// Decode XML/HTML entities
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x2F;/g, '/');
}

// Format seconds into MM:SS or HH:MM:SS
function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const mm = m.toString().padStart(2, '0');
  const ss = s.toString().padStart(2, '0');
  if (h > 0) {
    return `${h}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}

export async function getVideoDetailsAndTranscript(youtubeUrl: string): Promise<YouTubeDetailsResult> {
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const videoId = getYouTubeId(youtubeUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL. Could not parse video ID.");
  }

  let title = `YouTube Video (${videoId})`;
  let description = "";
  let duration = 0;
  let transcriptText = "";
  let transcriptSegments: TranscriptSegment[] = [];
  let hasTranscript = false;

  // 1. Fetch details from YouTube Watch Page HTML
  try {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(watchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 } // cache for 1 hour
    });
    
    if (res.ok) {
      const html = await res.text();
      const regex = /ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/;
      let match = html.match(regex);
      if (!match) {
        const regexAlt = /ytInitialPlayerResponse\s*=\s*({[\s\S]+?})/;
        match = html.match(regexAlt);
      }

      if (match) {
        try {
          const data = JSON.parse(match[1]);
          const videoDetails = data.videoDetails || {};
          title = videoDetails.title || title;
          description = videoDetails.shortDescription || description;
          duration = parseInt(videoDetails.lengthSeconds, 10) || duration;
        } catch (jsonErr) {
          console.warn("Failed to parse ytInitialPlayerResponse JSON:", jsonErr);
        }
      }
    }
  } catch (htmlErr) {
    console.error("Error fetching watch page details:", htmlErr);
  }

  // 2. Fetch transcript using youtube-transcript package
  try {
    const rawSegments = await YoutubeTranscript.fetchTranscript(videoId);
    if (rawSegments && rawSegments.length > 0) {
      hasTranscript = true;
      transcriptSegments = rawSegments.map(seg => {
        const offsetSec = Math.floor(seg.offset / 1000);
        return {
          text: decodeXmlEntities(seg.text),
          offset: seg.offset,
          duration: seg.duration,
          timestamp: formatTime(offsetSec)
        };
      });

      // Build consolidated transcript text with timestamps
      transcriptText = transcriptSegments
        .map(seg => `[${seg.timestamp}] ${seg.text}`)
        .join('\n');
    }
  } catch (transErr: any) {
    console.warn(`Could not load transcript for video ${videoId}:`, transErr.message || transErr);
  }

  return {
    title,
    description,
    duration,
    transcriptText,
    transcriptSegments,
    hasTranscript,
  };
}
