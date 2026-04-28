import { GoogleGenAI, Modality } from "@google/genai";
import { PRESET_INSPIRATIONS, InspirationItem } from "../constants/inspirations";

let _ai: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (_ai) return _ai;
  _ai = new GoogleGenAI({ apiKey });
  return _ai;
}

export async function speakEncouragement(text: string) {
  try {
    const ai = getAiClient();
    if (!ai) return;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `用温柔、鼓励、充满童趣的语气说：${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)({ sampleRate: 24000 });
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const int16Array = new Int16Array(bytes.buffer);
      const audioBuffer = audioCtx.createBuffer(1, int16Array.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < int16Array.length; i++) {
        channelData[i] = int16Array[i] / 32768.0;
      }
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      source.start();
    }
  } catch (error) {
    console.error("TTS Error:", error);
  }
}

export async function refineDrawing(base64Image: string, prompt?: string) {
  try {
    const proxyBase = import.meta.env.VITE_JIMENG_PROXY_URL ?? import.meta.env.VITE_AI_PROXY_URL;
    if (!proxyBase) return null;

    const res = await fetch(`${proxyBase.replace(/\/+$/, '')}/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageDataUrl: base64Image,
        prompt: prompt || '',
      }),
    });

    if (!res.ok) {
      console.error('JiMeng refine HTTP error', res.status, await res.text().catch(() => ''));
      return null;
    }

    const data = await res.json().catch(() => null) as null | { results?: string[] };
    const results = data?.results;
    if (!Array.isArray(results) || results.length === 0) return null;
    return results;
  } catch (error) {
    console.error("AI Refinement Error:", error);
    return null;
  }
}

export async function getInspiration(ageGroup?: string): Promise<InspirationItem[]> {
  try {
    console.log(`Fetching inspiration for age group: ${ageGroup || 'any'}`);
    // Shuffle and pick 3 from the preset list
    const shuffled = [...PRESET_INSPIRATIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  } catch (error) {
    console.error("Visual Inspiration Error:", error);
    return PRESET_INSPIRATIONS.slice(0, 3);
  }
}
