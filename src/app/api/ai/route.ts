import { NextRequest, NextResponse } from 'next/server';

const MESHY_API_URL = 'https://api.meshy.ai/openapi/v1';
const TRIPO_API_URL = 'https://api.tripo3d.ai/v2/openapi';

// Mock resources for development without real API keys
const MOCK_TEXTURE_URL = '/placeholders/mock-texture.png'; // Ensure this file exists or adjust path
const MOCK_MODEL_URL = '/placeholders/mock-model.glb';

export async function POST(req: NextRequest) {
  try {
    const { provider, type, prompt, modelUrl, taskId } = await req.json();

    if (provider === 'meshy') {
      const apiKey = process.env.MESHY_API_KEY;
      // If API key missing, return mock texture response
      if (!apiKey) {
        console.warn('Meshy API key not set - returning mock texture');
        return NextResponse.json({
          id: 'mock-task-meshy-' + Date.now(),
          status: 'RUNNING',
        });
      }

      if (type === 'texture') {
        const response = await fetch(`${MESHY_API_URL}/text-to-texture`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model_url: modelUrl || 'https://moatt.app/models/female_base.glb',
            object_prompt: 'garment',
            style_prompt: prompt,
            enable_original_uv: true,
            art_style: 'realistic',
          }),
        });
        const data = await response.json();
        return NextResponse.json(data);
      }
    }

    if (provider === 'tripo') {
      const apiKey = process.env.TRIPO_API_KEY;
      // If API key missing, return mock model response
      if (!apiKey) {
        console.warn('Tripo API key not set - returning mock model');
        return NextResponse.json({
          result: {
            model_url: MOCK_MODEL_URL,
            taskId: 'mock-task-tripo-' + Date.now(),
          },
          status: 'SUCCEEDED',
        });
      }

      if (type === 'task') {
        const response = await fetch(`${TRIPO_API_URL}/task`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'text_to_model',
            prompt,
          }),
        });
        const data = await response.json();
        return NextResponse.json(data);
      }
    }

    return NextResponse.json({ error: 'Invalid provider or type' }, { status: 400 });
  } catch (error: any) {
    console.error('AI Route Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider');
    const taskId = searchParams.get('taskId');

    if (!provider || !taskId) {
      return NextResponse.json({ error: 'Missing provider or taskId' }, { status: 400 });
    }

    // If the taskId is a mock identifier, return immediate success
    if (taskId?.startsWith('mock-task-')) {
      const mockResult = provider === 'meshy'
        ? { base_color: MOCK_TEXTURE_URL }
        : { model_url: MOCK_MODEL_URL };
      return NextResponse.json({ status: 'SUCCEEDED', result: mockResult });
    }

    if (provider === 'meshy') {
      const apiKey = process.env.MESHY_API_KEY;
      if (!apiKey) {
        // No real key – fallback to mock response
        return NextResponse.json({ status: 'SUCCEEDED', result: { base_color: MOCK_TEXTURE_URL } });
      }
      const response = await fetch(`${MESHY_API_URL}/text-to-texture/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await response.json();
      return NextResponse.json(data);
    }

    if (provider === 'tripo') {
      const apiKey = process.env.TRIPO_API_KEY;
      if (!apiKey) {
        return NextResponse.json({ status: 'SUCCEEDED', result: { model_url: MOCK_MODEL_URL } });
      }
      const response = await fetch(`${TRIPO_API_URL}/task/${taskId}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      const data = await response.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
