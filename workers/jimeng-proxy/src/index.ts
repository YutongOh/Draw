type RefineRequest = {
  imageDataUrl: string;
  prompt?: string;
};

type Env = {
  JIMENG_API_KEY: string;
  SHENGSUAN_ROUTER_BASE_URL?: string;
};

type ShengsuanCreateResponse =
  | {
      code?: string;
      message?: string;
      data?: {
        request_id?: string;
        status?: string;
        fail_reason?: string;
      };
    }
  | Record<string, unknown>;

type ShengsuanQueryResponse =
  | {
      code?: string;
      message?: string;
      data?: {
        status?: string;
        fail_reason?: string;
        data?: {
          file_urls?: string[];
          progress?: number;
        };
      };
    }
  | Record<string, unknown>;

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      ...init?.headers,
    },
  });
}

function isDataUrlPngOrJpeg(s: string) {
  return /^data:image\/(png|jpeg);base64,/.test(s);
}

function promptForLevel(level: 'low' | 'mid' | 'high', extra: string) {
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
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function createTask(params: {
  baseUrl: string;
  apiKey: string;
  imageDataUrl: string;
  prompt: string;
  scale: number;
}) {
  const res = await fetch(`${params.baseUrl}/v1/tasks/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: 'bytedance/jimeng_i2i_v30',
      binary_data_base64: [params.imageDataUrl],
      prompt: params.prompt,
      scale: params.scale,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`create task failed: ${res.status} ${text.slice(0, 500)}`);
  }
  const json = (JSON.parse(text) as ShengsuanCreateResponse) ?? {};
  const requestId = (json as any)?.data?.request_id as string | undefined;
  if (!requestId) throw new Error('create task missing request_id');
  return requestId;
}

async function pollTask(params: { baseUrl: string; apiKey: string; requestId: string }) {
  const started = Date.now();
  const timeoutMs = 120_000;

  while (Date.now() - started < timeoutMs) {
    const res = await fetch(`${params.baseUrl}/v1/tasks/generations/${encodeURIComponent(params.requestId)}`, {
      headers: { Authorization: `Bearer ${params.apiKey}` },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`poll task failed: ${res.status} ${text.slice(0, 500)}`);
    }
    const json = (JSON.parse(text) as ShengsuanQueryResponse) ?? {};
    const status = (json as any)?.data?.status as string | undefined;
    const failReason = (json as any)?.data?.fail_reason as string | undefined;
    const urls = (json as any)?.data?.data?.file_urls as string[] | undefined;

    if (status === 'COMPLETED') {
      if (Array.isArray(urls) && urls.length > 0) return urls[0];
      throw new Error('task completed but missing file_urls');
    }
    if (status === 'FAILED' || status === 'CANCELLED' || status === 'TIMEOUT') {
      throw new Error(`task ${status}${failReason ? `: ${failReason}` : ''}`);
    }
    await sleep(1200);
  }

  throw new Error('task polling timeout');
}

export default {
  async fetch(req: Request, env: Env) {
    const url = new URL(req.url);

    if (req.method === 'OPTIONS') {
      return jsonResponse({ ok: true });
    }

    if (req.method !== 'POST' || url.pathname !== '/refine') {
      return jsonResponse({ error: 'not_found' }, { status: 404 });
    }

    if (!env.JIMENG_API_KEY) {
      return jsonResponse({ error: 'missing_api_key' }, { status: 500 });
    }

    let body: RefineRequest | null = null;
    try {
      body = (await req.json()) as RefineRequest;
    } catch {
      return jsonResponse({ error: 'invalid_json' }, { status: 400 });
    }

    if (!body?.imageDataUrl || typeof body.imageDataUrl !== 'string') {
      return jsonResponse({ error: 'missing_imageDataUrl' }, { status: 400 });
    }
    if (!isDataUrlPngOrJpeg(body.imageDataUrl)) {
      return jsonResponse({ error: 'imageDataUrl_must_be_png_or_jpeg_dataurl' }, { status: 400 });
    }

    const baseUrl = (env.SHENGSUAN_ROUTER_BASE_URL || 'https://router.shengsuanyun.com/api').replace(/\/+$/, '');
    const extraPrompt = typeof body.prompt === 'string' ? body.prompt : '';

    const specs: Array<{ level: 'low' | 'mid' | 'high'; scale: number }> = [
      { level: 'low', scale: 0.55 },
      { level: 'mid', scale: 0.75 },
      { level: 'high', scale: 0.95 },
    ];

    try {
      const results = await Promise.all(
        specs.map(async (s) => {
          const requestId = await createTask({
            baseUrl,
            apiKey: env.JIMENG_API_KEY,
            imageDataUrl: body!.imageDataUrl,
            prompt: promptForLevel(s.level, extraPrompt),
            scale: s.scale,
          });
          return await pollTask({ baseUrl, apiKey: env.JIMENG_API_KEY, requestId });
        }),
      );

      return jsonResponse({ results });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return jsonResponse({ error: 'refine_failed', message: msg }, { status: 500 });
    }
  },
};

