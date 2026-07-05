#!/usr/bin/env node
/**
 * reconcile-citations.js — 매니페스트 기준으로 유실된 자사 각주 복원 (spec §3.3.5)
 *
 * 사용:
 *   node scripts/reconcile-citations.js            # dry-run: 복원 대상만 출력 (기본)
 *   node scripts/reconcile-citations.js --write     # 실제 수정
 *
 * 동작:
 *   citation_manifest.json 의 entity 별 항목 중, 해당 파일 Citations 정의에서
 *   사라진 자사 인용(url)을 복원한다.
 *     - Citations 자사 블록(편집금지 마커 안)에 `[^N]: [title](url)` 재삽입
 *       (마커 블록 없으면 `## Citations` 뒤에 `### 자사 임상 자료` + 마커로 신규 생성)
 *     - frontmatter clinic_footnote_ids / source_count_clinic_pillar / source_count 복구
 */

const fs = require('fs');
const path = require('path');
const lib = require('./citation-lib');

// entity_id → 절대경로
function buildEntityFileMap() {
  const map = {};
  for (const abs of lib.collectAllEntityFiles()) {
    const content = fs.readFileSync(abs, 'utf8');
    const split = lib.splitFrontmatter(content);
    if (!split) continue;
    const fm = lib.parseFm(split.yaml);
    if (fm.entity_id) map[fm.entity_id] = abs;
  }
  return map;
}

// frontmatter yaml 블록의 배열/카운트 필드 갱신
function updateFrontmatter(fmBlock, addIds, delta) {
  let out = fmBlock;

  // clinic_footnote_ids
  const cur = out.match(/^clinic_footnote_ids:\s*(.*)$/m);
  let ids = [];
  if (cur) {
    const v = cur[1].trim();
    if (v.startsWith('[') && v.endsWith(']')) {
      const inner = v.slice(1, -1).trim();
      ids = inner === '' ? [] : inner.split(',').map((s) => Number(s.trim()));
    }
  }
  const merged = Array.from(new Set([...ids, ...addIds])).sort((a, b) => a - b);
  const newLine = `clinic_footnote_ids: [${merged.join(', ')}]`;
  if (cur) {
    out = out.replace(/^clinic_footnote_ids:\s*.*$/m, newLine);
  }

  // source_count_clinic_pillar, source_count (delta 증가)
  for (const key of ['source_count_clinic_pillar', 'source_count']) {
    out = out.replace(new RegExp(`^(${key}:\\s*)(\\d+)`, 'm'), (_m, p, n) => {
      return p + String(Number(n) + delta);
    });
  }
  return out;
}

// body 에 자사 각주 def 삽입. 마커 블록 있으면 close 앞에, 없으면 신규 블록 생성.
function insertDefs(body, defLines) {
  const lines = body.split('\n');
  const closeIdx = lines.findIndex((l) => l.trim() === lib.MARKER_CLOSE);
  if (closeIdx >= 0) {
    lines.splice(closeIdx, 0, ...defLines);
    return lines.join('\n');
  }
  // 마커 블록 없음 → ## Citations 뒤에 신규 자사 블록 생성
  const citIdx = lines.findIndex((l) => /^##\s+Citations\s*$/.test(l));
  const block = [lib.MARKER_OPEN, lib.CLINIC_HEADING, ...defLines, lib.MARKER_CLOSE];
  if (citIdx >= 0) {
    lines.splice(citIdx + 1, 0, ...block);
    return lines.join('\n');
  }
  // Citations 헤딩도 없음 → 본문 끝에 Citations 신규
  return body.replace(/\s*$/, '\n') + ['## Citations', ...block, ''].join('\n');
}

function processEntity(entityId, items, abs) {
  const content = fs.readFileSync(abs, 'utf8');
  const split = lib.splitFrontmatter(content);
  if (!split) return null;

  const defUrls = new Set(
    lib.extractFootnoteDefs(split.body).map((d) => d.url).filter(Boolean),
  );
  const missing = items.filter((it) => it.url && !defUrls.has(it.url));
  if (missing.length === 0) return null;

  const defLines = missing
    .slice()
    .sort((a, b) => a.footnote_id - b.footnote_id)
    .map((it) => `[^${it.footnote_id}]: [${it.title}](${it.url})`);

  const newBody = insertDefs(split.body, defLines);
  const fmBlock = content.slice(0, split.bodyStart);
  const newFm = updateFrontmatter(
    fmBlock,
    missing.map((it) => it.footnote_id),
    missing.length,
  );
  const newContent = newFm + newBody;

  return { missing, newContent, defLines };
}

function main() {
  const write = process.argv.includes('--write');
  const manifest = lib.loadManifest();
  if (manifest === null) {
    console.error('citation_manifest.json 없음 — 먼저 build-citation-manifest.js 실행');
    process.exit(1);
  }
  const fileMap = buildEntityFileMap();

  let restoreCount = 0;
  let fileCount = 0;
  for (const [entityId, items] of Object.entries(manifest.entities || {})) {
    const abs = fileMap[entityId];
    if (!abs) {
      console.log(`[WARN] entity_id=${entityId} 파일 없음 (매니페스트 stale?)`);
      continue;
    }
    const res = processEntity(entityId, items, abs);
    if (!res) continue;
    fileCount++;
    restoreCount += res.missing.length;
    const rel = path.relative(lib.REPO_ROOT, abs);
    console.log(`${write ? '[restored]' : '[would restore]'} ${rel} (${entityId})`);
    for (const l of res.defLines) console.log(`    + ${l}`);
    if (write) fs.writeFileSync(abs, res.newContent, 'utf8');
  }

  console.log('');
  console.log(
    `${write ? '복원' : 'dry-run'} — 파일 ${fileCount}개 / 자사 각주 ${restoreCount}건` +
      (write ? '' : ' (실제 수정하려면 --write)'),
  );
}

main();
