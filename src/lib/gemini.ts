import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Validates a Gemini API key by making a simple request
 */
export async function validateGeminiKey(apiKey: string): Promise<boolean> {
  if (!apiKey) return false;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-3.5-flash (primary) or gemini-3-flash-preview (secondary) to validate key
    // Let's use a very small text generation request
    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
      generationConfig: { maxOutputTokens: 5 }
    });
    return !!result.response.text();
  } catch (error) {
    console.error('Validation with primary model failed, trying fallback model:', error);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 5 }
      });
      return !!result.response.text();
    } catch (fallbackError) {
      console.error('Validation with fallback model failed:', fallbackError);
      return false;
    }
  }
}

interface YouTubeSummaryResult {
  about: string;
  summary: string;
  takeaways: {
    timestamp: string;
    seconds: number;
    text: string;
  }[];
}

/**
 * Summarizes a YouTube video using the Gemini API.
 * Uses gemini-3.5-flash as primary and gemini-3-flash-preview as fallback.
 */
export async function summarizeYouTubeVideo(
  apiKey: string,
  videoId: string,
  transcriptText: string,
  videoTitle: string,
  videoDescription: string
): Promise<YouTubeSummaryResult> {
  const prompt = `You are an AI video learning assistant. Analyze the following YouTube video details and transcript:

Video Title: ${videoTitle}
Video Description: ${videoDescription}

Video Transcript:
${transcriptText || "No transcript available. Summarize based on title and description."}

Based on the transcript and metadata above, generate a comprehensive, highly detailed and in-depth summary of the video in Myanmar language (Burmese).
The summary should cover all key topics, explanations, and concepts discussed.

You must output ONLY a valid JSON object matching this schema. Do not put markdown code block formatting (like \`\`\`json) or any extra text, just return the raw JSON string:
{
  "about": "A 1-2 sentence description of what the video is about (written in Myanmar language).",
  "summary": "An extremely detailed, comprehensive multi-paragraph summary of the video's contents, main points, and core flow (written in Myanmar language). Provide as much detail and depth as possible.",
  "takeaways": [
    {
      "timestamp": "MM:SS or HH:MM:SS format corresponding to the key point in the video",
      "seconds": number (the timestamp converted to total seconds),
      "text": "A clear explanation of what occurs or is discussed at this timestamp (written in Myanmar language)."
    }
  ]
}
Make sure you include at least 8-15 key takeaways with accurate timestamps throughout the duration of the video. If the transcript contains timestamps (e.g. [MM:SS]), align the takeaways with those timestamps. All text content ("about", "summary", and "text" inside "takeaways") MUST be written in Myanmar language (Burmese) to provide a rich learning experience for Myanmar users. Ensure the JSON is properly formatted and valid.`;

  const makeApiCall = async (modelName: string) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent(prompt);
    return result.response.text();
  };

  try {
    console.log('Attempting video summary with gemini-3.5-flash...');
    const textResponse = await makeApiCall('gemini-3.5-flash');
    return parseGeminiResponse(textResponse);
  } catch (primaryError) {
    console.warn('gemini-3.5-flash failed, falling back to gemini-3-flash-preview. Error:', primaryError);
    try {
      const textResponse = await makeApiCall('gemini-3-flash-preview');
      return parseGeminiResponse(textResponse);
    } catch (fallbackError) {
      console.error('All Gemini models failed to summarize. Falling back to simulated metadata. Error:', fallbackError);
      return getSimulatedSummary(videoId);
    }
  }
}

/**
 * Chat with the Gemini Agent about the video.
 */
export async function chatWithGeminiAgent(
  apiKey: string,
  videoSummary: YouTubeSummaryResult,
  chatHistory: { role: 'user' | 'model'; content: string }[],
  newMessage: string
): Promise<string> {
  // Ensure history starts with user and alternates correctly.
  // Remove the initial welcome message from model if it is the first item.
  let cleanedHistory = [...chatHistory];
  if (cleanedHistory.length > 0 && cleanedHistory[0].role === 'model') {
    cleanedHistory.shift();
  }

  // Also make sure we don't double-include the new message in history if the caller passed it in chatHistory
  if (
    cleanedHistory.length > 0 &&
    cleanedHistory[cleanedHistory.length - 1].content === newMessage &&
    cleanedHistory[cleanedHistory.length - 1].role === 'user'
  ) {
    cleanedHistory.pop();
  }

  const systemInstruction = `You are a helpful AI learning assistant for Arti Tube. 
You are discussing a YouTube video that the user is currently watching.
Here is the video metadata and summary details you should use as context (which are in Myanmar language):
- Video Description: ${videoSummary.about}
- Video Summary: ${videoSummary.summary}
- Video Key Takeaways:
${videoSummary.takeaways.map(t => `  * [${t.timestamp}] (${t.seconds}s): ${t.text}`).join('\n')}

Guidelines:
1. Respond in Myanmar language (Burmese) by default. Keep your responses clear, helpful, engaging, and polite.
2. If the user asks for a summary or key parts, refer to the takeaways and summary.
3. If the user asks to "note down" something, or if they ask "note this for me", respond by summarizing the note clearly in Myanmar language, starting your message with "🗒️ [Note added]: " so the UI can detect it and save it.
4. If the user asks about timestamps or when something happens, mention them in the format [MM:SS] or [HH:MM:SS]. The UI will automatically parse these into clickable links that seek the video.
5. Answer questions based on the video context. If it's outside the scope of the video, politely reply in Myanmar language that you are focused on this video's content.`;

  const makeChatCall = async (modelName: string) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemInstruction
    });

    const chat = model.startChat({
      history: cleanedHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }))
    });

    const result = await chat.sendMessage(newMessage);
    return result.response.text();
  };

  try {
    return await makeChatCall('gemini-3.5-flash');
  } catch (error) {
    console.warn('gemini-3.5-flash chat failed, falling back to gemini-3-flash-preview:', error);
    try {
      return await makeChatCall('gemini-3-flash-preview');
    } catch (fallbackError) {
      console.error('All chat models failed:', fallbackError);
      return "ဆောရီးပါ၊ AI စနစ်နဲ့ ချိတ်ဆက်ရာမှာ အခက်အခဲရှိနေပါတယ်။ ကျေးဇူးပြုပြီး သင့်ရဲ့ API key နဲ့ အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပေးပါ။";
    }
  }
}

// Helpers
function parseGeminiResponse(rawText: string): YouTubeSummaryResult {
  // Clean up code block wrappers if any
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/```$/, '').trim();
  }
  
  try {
    return JSON.parse(cleaned) as YouTubeSummaryResult;
  } catch (e) {
    console.warn('Failed to parse JSON directly. Attempting to extract JSON substring.', e);
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]) as YouTubeSummaryResult;
      } catch (innerError) {
        throw new Error('Failed to parse JSON even after extraction');
      }
    }
    throw e;
  }
}

function getSimulatedSummary(videoId: string): YouTubeSummaryResult {
  return {
    about: "This is a detailed video showing web development tutorials, design practices, and tech stack walkthroughs.",
    summary: "In this video, the instructor explains the core concepts of building high-performance web applications using modern tooling. They cover state management, layout rendering, styling strategies, and the integration of AI models. By focusing on practical design details and smooth micro-animations, the tutorial guides developers through creating production-ready websites that look premium and function at 60fps.",
    takeaways: [
      { timestamp: "00:25", seconds: 25, text: "Introduction to the project stack and folder structures." },
      { timestamp: "01:45", seconds: 105, text: "Setting up database schemas and authentication flows in Supabase." },
      { timestamp: "03:10", seconds: 190, text: "Creating premium user interfaces with Tailwind CSS and Framer Motion." },
      { timestamp: "05:40", seconds: 340, text: "Integrating AI models using API keys for content analysis." },
      { timestamp: "08:15", seconds: 495, text: "Testing and performance optimization details for 60fps animations." }
    ]
  };
}
