import { describe, expect, test } from 'bun:test';
import { parseConversation } from '../src/core/conversation-parser/parse.ts';
import { assessContentSanity } from '../src/core/content-sanity.ts';
import { assertLlmProviderAllowed } from '../src/core/ai/gateway.ts';

describe('downstream runtime compatibility', () => {
  test('preserves persisted ISO role headings, dates and message bodies', () => {
    const parsed = parseConversation('## User — 2026-08-25T10:01:02.345Z\nFirst message.\n\n## Assistant - 2026-08-25T10:02:03Z\nSecond message.', { fallbackDate: '2026-08-25' });
    expect(parsed.messages).toHaveLength(2);
    expect(JSON.stringify(parsed.messages)).toContain('First message.');
    expect(JSON.stringify(parsed.messages)).toContain('Second message.');
    expect(JSON.stringify(parsed.messages)).toContain('2026-08-25');
  });

  test('quoted incident language in a transcript remains searchable', () => {
    const content = { title: 'Incident discussion', compiled_truth: 'Access Denied\nThe participants discussed a failed upstream request.', timeline: '' };
    const transcript = assessContentSanity({ ...content, page_kind: 'conversation' });
    expect(transcript.shouldQuarantine).toBe(false);
    const blocked = assessContentSanity({ ...content, page_kind: 'conversation', extra_literals: [{ name: 'explicit_operator_block', substring: 'Access Denied', applies_to: 'body' }] });
    expect(blocked.shouldQuarantine).toBe(true);
  });

  test('a configured provider restriction rejects alternative chat and expansion routes', () => {
    const cfg = { env: { GBRAIN_LLM_ALLOWED_PROVIDERS: 'litellm' } };
    for (const touchpoint of ['chat', 'expansion'] as const) {
      expect(() => assertLlmProviderAllowed({ id: 'openrouter' }, cfg, touchpoint)).toThrow('blocked');
      expect(() => assertLlmProviderAllowed({ id: 'litellm' }, cfg, touchpoint)).not.toThrow();
    }
  });
});
