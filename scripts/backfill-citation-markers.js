#!/usr/bin/env node
/**
 * backfill-citation-markers.js — 자사 각주 블록에 편집금지 마커 백필 (일회성·멱등)
 *
 * 사용:
 *   node scripts/backfill-citation-markers.js            # 실제 수정
 *   node scripts/backfill-citation-markers.js --dry-run  # 변경 대상만 출력
 *
 * 동작 (spec §3.3):
 *   자사 각주(clinic_footnote_ids OR 자사 도메인)가 있는 전 entity 파일에서
 *   Citations 의 `### 자사 임상 자료` 헤딩 + 자사 각주 정의 블록을 마커 두 줄로 감싼다.
 *     - 열림 마커: 헤딩 위 (헤딩 없으면 첫 자사 각주 def 위)
 *     - 닫힘 마커: 마지막 자사 각주 def 아래
 *   이미 마커가 있으면 skip (멱등). 자사 각주 0건 파일은 건드리지 않음.
 *   archived 파일도 자사 각주 있으면 포함.
 *
 * 마커는 HTML 주석이라 Jekyll 렌더에 노출되지 않는다.
 */

const fs = require('fs');
const path = require('path');
const lib = require('./citation-lib');

function processFile(abs) {
  const content = fs.readFileSync(abs, 'utf8');
  const split = lib.splitFrontmatter(content);
  if (!split) return { status: 'skip', reason: 'frontmatter 없음' };

  const fm = lib.parseFm(split.yaml);
  const clinicDefs = lib.clinicFootnoteDefs(fm, split.body);
  if (clinicDefs.length === 0) return { status: 'skip', reason: '자사 각주 0건' };

  const lines = split.body.split('\n');

  // 멱등: 마커 이미 존재 → skip
  const { opens, closes } = lib.findMarkers(lines);
  if (opens.length > 0 || closes.length > 0) {
    return { status: 'skip', reason: '마커 이미 존재' };
  }

  const clinicIdxs = clinicDefs.map((d) => d.lineIndex);
  const minDef = Math.min(...clinicIdxs);
  const maxDef = Math.max(...clinicIdxs);

  // 열림 지점: `### 자사 임상 자료` 헤딩(있고 def 앞이면) 위, 아니면 첫 def 위
  let openIdx = minDef;
  const headingIdx = lines.findIndex((l) => l.trim() === lib.CLINIC_HEADING);
  if (headingIdx >= 0 && headingIdx < minDef) {
    openIdx = headingIdx;
  }
  const closeIdx = maxDef;

  // 무결성: [openIdx, closeIdx] 사이의 모든 각주 def 가 자사여야 함 (외부 def 혼입 방지)
  const clinicSet = new Set(clinicIdxs);
  for (const def of lib.extractFootnoteDefs(split.body)) {
    if (def.lineIndex > openIdx && def.lineIndex < closeIdx && !clinicSet.has(def.lineIndex)) {
      return {
        status: 'anomaly',
        reason: `자사 블록 사이에 비자사 각주 [^${def.id}] 혼입 — 수동 확인 필요, skip`,
      };
    }
  }

  // 닫힘 먼저 삽입(openIdx 불변), 그다음 열림 삽입
  lines.splice(closeIdx + 1, 0, lib.MARKER_CLOSE);
  lines.splice(openIdx, 0, lib.MARKER_OPEN);

  const newBody = lines.join('\n');
  const newContent = content.slice(0, split.bodyStart) + newBody;
  return { status: 'wrap', newContent, clinicCount: clinicDefs.length };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const files = lib.collectAllEntityFiles();
  let wrapped = 0;
  let skipped = 0;
  const anomalies = [];

  for (const abs of files) {
    const rel = path.relative(lib.REPO_ROOT, abs);
    const res = processFile(abs);
    if (res.status === 'wrap') {
      wrapped++;
      if (!dryRun) fs.writeFileSync(abs, res.newContent, 'utf8');
      console.log(`${dryRun ? '[would wrap]' : '[wrapped]'} ${rel} (자사 각주 ${res.clinicCount}건)`);
    } else if (res.status === 'anomaly') {
      anomalies.push(`${rel}: ${res.reason}`);
      console.log(`[ANOMALY] ${rel}: ${res.reason}`);
    } else {
      skipped++;
    }
  }

  console.log('');
  console.log(`대상 ${files.length}개 / 마커 삽입 ${wrapped}개 / skip ${skipped}개 / anomaly ${anomalies.length}개`);
  if (anomalies.length > 0) process.exit(1);
}

main();
