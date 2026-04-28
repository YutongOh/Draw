import { GoogleGenAI, Modality } from "@google/genai";
import { PRESET_INSPIRATIONS, InspirationItem } from "../constants/inspirations";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function speakEncouragement(text: string) {
  try {
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
    const levels = [
      {
        name: "轻微优化",
        instruction: `Keep the child's original lines but clean them up into smooth, bold cartoon outlines. Use flat, vibrant colors. It should look like a neat, professional version of the child's own cartoon sketch, preserving their unique character shapes. ${prompt || ''}`
      },
      {
        name: "创意增强",
        instruction: `Analyze the child's sketch to identify the subject (e.g., a cat, a house, a person). Transform it into a cute, professional children's cartoon character or scene. Add simple shading, friendly expressions, and charming details. It should look like a character from a high-quality animated show for kids. ${prompt || ''}`
      },
      {
        name: "完美蜕变",
        instruction: `Fully realize the child's idea as a high-quality, polished children's book illustration. Use the sketch as a strong reference for composition and subject, but render it with beautiful textures, soft lighting, and a very professional cartoon aesthetic. It should be a 'masterpiece' version of their cartoon idea, full of life and magic. ${prompt || ''}`
      }
    ];

    const promises = levels.map(level => 
      ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image.split(',')[1],
                mimeType: 'image/png',
              },
            },
            {
              text: `This is a drawing by a child. Please analyze the content and shapes in this sketch and refine it into a beautiful children's cartoon drawing. 
              The style MUST be child-friendly, cute, and clean with bold outlines and vibrant colors. 
              Identify what the child is trying to draw and find a similar, high-quality cartoon representation.
              Level of refinement: ${level.instruction}
              Return only the enhanced image.`,
            },
          ],
        },
      })
    );

    const responses = await Promise.all(promises);
    const results: string[] = [];

    for (const response of responses) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          results.push(`data:image/png;base64,${part.inlineData.data}`);
          break;
        }
      }
    }

    return results.length > 0 ? results : null;
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
