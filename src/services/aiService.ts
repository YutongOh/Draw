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
    if (proxyBase) {
      const res = await fetch(`${proxyBase.replace(/\/+$/, '')}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageDataUrl: base64Image,
          prompt: prompt || '',
        }),
      });

      if (!res.ok) {
        console.error('JiMeng refine proxy HTTP error', res.status, await res.text().catch(() => ''));
        return null;
      }

      const data = (await res.json().catch(() => null)) as null | { results?: string[] };
      const results = data?.results;
      if (!Array.isArray(results) || results.length === 0) return null;
      return results;
    }

    // Demo fallback (INSECURE): call JiMeng directly from browser using a build-time key.
    // This will expose the key in the built JS bundle. Use only for demos.
    const apiKey = import.meta.env.VITE_JIMENG_API_KEY;
    if (!apiKey) {
      throw new Error('缺少 VITE_JIMENG_API_KEY（GitHub Actions Secret: JIMENG_API_KEY 未注入或为空）');
    }

    const routerBase = 'https://router.shengsuanyun.com/api';

    const isDataUrl = (s: string) => /^data:image\/(png|jpeg);base64,/.test(s);
    if (!isDataUrl(base64Image)) return null;

    const promptForLevel = (level: 'low' | 'mid' | 'high', extra: string) => {
      const base =
        '这是一幅儿童绘画。请在保留原始主体和构图的前提下，生成更干净、更可爱的儿童插画效果：线条更流畅，颜色更明亮，细节更友好。';
      const levelText =
        level === 'low'
          ? '重绘程度：低。尽量保留孩子原始线条，只做干净化与轻微上色增强。'
          : level === 'mid'
            ? '重绘程度：中。保留主体与轮廓，但可以补充合理细节、阴影与更完整的配色。'
            : '重绘程度：高。把孩子的想法完整实现成高质量绘本插画，但仍要遵循原画构图与主体。';
      const extraText = extra?.trim() ? `额外要求：${extra.trim()}` : '';
      return [base, levelText, extraText].filter(Boolean).join('\n');
    };

    const sleep = async (ms: number) => await new Promise((r) => setTimeout(r, ms));

    const createTask = async (p: { prompt: string; scale: number }) => {
      const res = await fetch(`${routerBase}/v1/tasks/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'bytedance/jimeng_i2i_v30',
          binary_data_base64: [base64Image],
          prompt: p.prompt,
          scale: p.scale,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        // Try to surface the provider's actual error message.
        try {
          const j = JSON.parse(text) as any;
          const msg = j?.error?.message || j?.message || text;
          throw new Error(`${res.status} ${String(msg).slice(0, 300)}`);
        } catch {
          throw new Error(`create task failed: ${res.status} ${text.slice(0, 300)}`);
        }
      }
      const json = JSON.parse(text) as any;
      const requestId = json?.data?.request_id as string | undefined;
      if (!requestId) throw new Error('create task missing request_id');
      return requestId;
    };

    const pollTask = async (requestId: string) => {
      const started = Date.now();
      const timeoutMs = 120_000;
      while (Date.now() - started < timeoutMs) {
        const res = await fetch(`${routerBase}/v1/tasks/generations/${encodeURIComponent(requestId)}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        const text = await res.text();
        if (!res.ok) {
          try {
            const j = JSON.parse(text) as any;
            const msg = j?.error?.message || j?.message || text;
            throw new Error(`${res.status} ${String(msg).slice(0, 300)}`);
          } catch {
            throw new Error(`poll task failed: ${res.status} ${text.slice(0, 300)}`);
          }
        }
        const json = JSON.parse(text) as any;
        const status = json?.data?.status as string | undefined;
        const urls = json?.data?.data?.file_urls as string[] | undefined;
        const failReason = json?.data?.fail_reason as string | undefined;
        if (status === 'COMPLETED') {
          if (Array.isArray(urls) && urls[0]) return urls[0] as string;
          throw new Error('task completed but missing file_urls');
        }
        if (status === 'FAILED' || status === 'CANCELLED' || status === 'TIMEOUT') {
          throw new Error(`task ${status}${failReason ? `: ${failReason}` : ''}`);
        }
        await sleep(1200);
      }
      throw new Error('task polling timeout');
    };

    const specs: Array<{ level: 'low' | 'mid' | 'high'; scale: number }> = [
      { level: 'low', scale: 0.55 },
      { level: 'mid', scale: 0.75 },
      { level: 'high', scale: 0.95 },
    ];

    const results = await Promise.all(
      specs.map(async (s) => {
        const requestId = await createTask({
          prompt: promptForLevel(s.level, prompt || ''),
          scale: s.scale,
        });
        return await pollTask(requestId);
      }),
    );

    return results.length ? results : null;
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
