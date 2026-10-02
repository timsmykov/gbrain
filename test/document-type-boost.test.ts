import { describe, expect, test } from 'bun:test';
import { applyDocumentTypeBoost } from '../src/core/search/hybrid.ts';
import type { SearchResult } from '../src/core/types.ts';

function result(slug: string, type: SearchResult['type'], score = 1): SearchResult {
  return {
    slug,
    page_id: 1,
    title: slug,
    type,
    chunk_text: 'chunk',
    chunk_source: 'compiled_truth',
    chunk_id: Math.floor(Math.random() * 100000),
    chunk_index: 0,
    score,
    stale: false,
  };
}

describe('applyDocumentTypeBoost', () => {
  test('boosts explicit roadmap queries without touching generic pages', () => {
    const rows = [
      result('roadmaps/gbrain-10-production-readiness-audit', 'roadmap', 0.88),
      result('shared/meetings/hub', 'meeting', 0.99),
    ];
    applyDocumentTypeBoost(rows, 'Gbrain production readiness roadmap doctor retrieval graph durability');
    expect(rows[0].score).toBeGreaterThan(rows[1].score);
    expect((rows[0] as any).document_type_boost).toBe(1.35);
    expect((rows[1] as any).document_type_boost).toBeUndefined();
  });

  test('boosts roadmap-named artifacts even when their canonical page type is architecture', () => {
    const rows = [
      result('architecture/hermes-gateway-postgres-first-roadmap', 'architecture', 0.80),
      result('inbox/hermes/generic-session', 'conversation', 0.99),
    ];
    applyDocumentTypeBoost(rows, 'hermes gateway postgres-first roadmap');
    expect(rows[0].score).toBeGreaterThan(rows[1].score);
    expect((rows[0] as any).document_type_boost).toBe(1.35);
    expect((rows[1] as any).document_type_boost).toBeUndefined();
  });

  test('boosts Gbrain report artifacts for migration/report/audit queries', () => {
    const rows = [result('reports/gbrain-qwen8-openrouter-migration-subvector-hnsw', 'report', 1)];
    applyDocumentTypeBoost(rows, 'Gbrain Qwen8 migration report');
    expect(rows[0].score).toBeCloseTo(1.25);
    expect((rows[0] as any).document_type_boost).toBe(1.25);
  });

  test('boosts explicit runbook and guide queries with their bounded factors', () => {
    const rows = [
      result('runbooks/hermes-memory-knowledge-smokes', 'runbook', 1),
      result('guides/gbrain-operator', 'guide', 1),
    ];
    applyDocumentTypeBoost(rows, 'Hermes runbook and guide');
    expect(rows[0].score).toBeCloseTo(1.30);
    expect((rows[0] as any).document_type_boost).toBe(1.30);
    expect(rows[1].score).toBeCloseTo(1.20);
    expect((rows[1] as any).document_type_boost).toBe(1.20);
  });

  test('applies the Gbrain artifact floor when the page type is generic', () => {
    const rows = [result('reports/gbrain-runtime-note', 'note', 1)];
    applyDocumentTypeBoost(rows, 'Gbrain runtime status');
    expect(rows[0].score).toBeCloseTo(1.10);
    expect((rows[0] as any).document_type_boost).toBe(1.10);
  });

  test('does not fire on ordinary semantic queries', () => {
    const rows = [result('shared/projects/synapse/graphrag', 'project', 1)];
    applyDocumentTypeBoost(rows, 'what is GraphRAG');
    expect(rows[0].score).toBe(1);
    expect((rows[0] as any).document_type_boost).toBeUndefined();
  });
});
