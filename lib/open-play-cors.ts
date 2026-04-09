import type { NextRequest } from 'next/server';

/** Comma-separated list. Defaults to marketing site + www for Webflow embed fetch(). */
export function getOpenPlayCorsAllowedOrigins(): string[] {
  const raw =
    process.env.OPEN_PLAY_CORS_ORIGINS ||
    'https://coyoteforce.com,https://www.coyoteforce.com';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Reflect Origin when it is in the allowlist (browser CORS for marketing site embeds). */
export function openPlayCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  if (!origin) return {};
  if (!getOpenPlayCorsAllowedOrigins().includes(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
