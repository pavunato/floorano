import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { SYSTEM_PROMPT } from '@/lib/ai/prompt-template';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OPENROUTER_API_KEY not configured. Set it in .env.local' },
        { status: 500 }
      );
    }

    const openrouter = createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    });

    const { text } = await generateText({
      model: openrouter('openrouter/auto'),
      system: SYSTEM_PROMPT,
      prompt: `Generate an FPDL floor plan for: ${prompt}`,
      maxOutputTokens: 2000,
    });

    // Clean up: remove markdown code fences if present
    let fpdl = text.trim();
    if (fpdl.startsWith('```')) {
      fpdl = fpdl.replace(/^```\w*\n?/, '').replace(/\n?```$/, '');
    }

    return NextResponse.json({ fpdl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
