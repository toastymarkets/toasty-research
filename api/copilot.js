/**
 * Vercel Serverless Function for Copilot AI
 * Route: POST /api/copilot
 *
 * Uses Claude API with streaming for typewriter effect
 */

export const config = {
  runtime: 'edge',
};

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

/**
 * Build system prompt with context
 */
function buildSystemPrompt(context) {
  const parts = [
    `You are a weather research copilot for Kalshi temperature prediction market trading.`,
    `You help users analyze weather data, understand market odds, and build trading theses.`,
    `Be concise and actionable. Focus on insights that help with trading decisions.`,
    `When writing notes or reports, format clearly with headers and bullet points.`,
    ``,
  ];

  if (context?.city) {
    parts.push(`Current city: ${context.city.name}`);
  }

  if (context?.weather) {
    const w = context.weather;
    parts.push(`Current conditions: ${w.temp}°F, ${w.condition || ''}, ${w.humidity}% humidity`);
  }

  if (context?.markets?.topBrackets?.length > 0) {
    const brackets = context.markets.topBrackets
      .slice(0, 3)
      .map(b => `${b.label}: ${b.yesPrice}%`)
      .join(', ');
    parts.push(`Top market brackets: ${brackets}`);
  }

  if (context?.observations?.length > 0) {
    const recent = context.observations.slice(0, 3)
      .map(o => `${o.time}: ${o.temp}°F`)
      .join(', ');
    parts.push(`Recent observations: ${recent}`);
  }

  return parts.join('\n');
}

export default async function handler(req) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { messages, context } = await req.json();

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const systemPrompt = buildSystemPrompt(context);

    // Call Claude API with streaming
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
        stream: true,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return new Response(JSON.stringify({ error: 'AI request failed' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Transform Claude's SSE format to our format
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const transformStream = new TransformStream({
      async transform(chunk, controller) {
        const text = decoder.decode(chunk);
        const lines = text.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
              continue;
            }

            try {
              const parsed = JSON.parse(data);

              // Handle content_block_delta events (text chunks)
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'text', content: parsed.delta.text })}\n\n`)
                );
              }

              // Handle message_stop event
              if (parsed.type === 'message_stop') {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
              }

              // Handle errors
              if (parsed.type === 'error') {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'error', message: parsed.error?.message || 'Unknown error' })}\n\n`)
                );
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      },
    });

    // Pipe the response through our transform
    const stream = response.body.pipeThrough(transformStream);

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Copilot error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
