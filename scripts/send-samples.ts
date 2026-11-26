/**
 * Sends every message in api/samples/messages.json to the n8n webhook, one at a time,
 * to populate the Google Sheets tab before taking the screenshots.
 *
 * Usage (Node 24 runs TypeScript natively, no install needed):
 *   node scripts/send-samples.ts
 *   WEBHOOK_URL=http://localhost:5678/webhook-test/classify node scripts/send-samples.ts
 */
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const DEFAULT_WEBHOOK_URL = 'http://localhost:5678/webhook/classify';
// Pause between requests to stay under the Gemini free-tier rate limit.
const DEFAULT_DELAY_MS = 4000;
const PREVIEW_LENGTH = 50;
const SAMPLES_URL = new URL('../api/samples/messages.json', import.meta.url);

interface Sample {
  readonly message: string;
  readonly customer?: string;
  readonly channel?: string;
}

interface ClassifyResult {
  readonly result?: { readonly category?: string; readonly urgency?: string };
  readonly error?: { readonly code?: string };
}

const webhookUrl = process.env.WEBHOOK_URL ?? DEFAULT_WEBHOOK_URL;
const delayMs = Number(process.env.DELAY_MS ?? DEFAULT_DELAY_MS);

function preview(text: string): string {
  return text.length > PREVIEW_LENGTH ? `${text.slice(0, PREVIEW_LENGTH)}…` : text;
}

function describe(status: number, body: ClassifyResult): string {
  if (body.result) {
    return `${String(status)} ${body.result.category ?? '?'} / ${body.result.urgency ?? '?'}`;
  }
  return `${String(status)} ${body.error?.code ?? 'unexpected response'}`;
}

async function send(sample: Sample): Promise<boolean> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sample),
  });
  const body = (await response.json().catch(() => ({}))) as ClassifyResult;
  process.stdout.write(`${describe(response.status, body)}\n`);
  return response.ok;
}

async function main(): Promise<void> {
  const samples = JSON.parse(await readFile(SAMPLES_URL, 'utf8')) as Sample[];
  process.stdout.write(`Sending ${String(samples.length)} messages to ${webhookUrl}\n\n`);

  let failures = 0;
  for (const [index, sample] of samples.entries()) {
    process.stdout.write(
      `[${String(index + 1)}/${String(samples.length)}] ${preview(sample.message)}\n  → `,
    );
    const ok = await send(sample).catch((error: unknown) => {
      process.stdout.write(
        `request failed: ${error instanceof Error ? error.message : String(error)}\n`,
      );
      return false;
    });
    if (!ok) failures += 1;
    if (index < samples.length - 1) await sleep(delayMs);
  }

  process.stdout.write(
    `\nDone: ${String(samples.length - failures)} ok, ${String(failures)} failed.\n`,
  );
  if (failures > 0) process.exitCode = 1;
}

await main();
