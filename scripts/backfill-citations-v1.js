#!/usr/bin/env node
/**
 * backfill-citations-v1.js — 운영중 entity에 표준 정합성 박기
 *
 * 처리 항목 (linkbase_pillar_only_gate_v1.md F절):
 *   1. frontmatter 4필드 추가:
 *      - source_count_external (자동 계산: 외부 footnote 수)
 *      - source_count_clinic_pillar (자동 계산: 자사 footnote 수)
 *      - clinic_footnote_ids (자사 ID 배열)
 *      - external_footnote_ids (외부 ID 배열)
 *   2. ## Citations 섹션 헤딩 분리:
 *      - ### 자사 임상 자료 (clinic_footnote_ids 정의 영역)
 *      - ### 외부 권위 출처 (external_footnote_ids 정의 영역)
 *
 * 자사/외부 구분 휴리스틱:
 *   footnote 정의 라인에 다음 토큰 포함 → 자사:
 *     ansimpainfree / thewells / linkerai / linkare / 안심튼튼 / 더웰스
 *
 * LOCK hard 검증 (linkbase_pillar_only_gate_v1.md:166):
 *   - external < 5 또는 clinic > 2 → 자동 정정 SKIP, 경고 출력
 *
 * 사용:
 *   node scripts/backfill-citations-v1.js <slug-or-path> [...]
 *   node scripts/backfill-citations-v1.js --dry-run <slug>   # 변경 미적용, diff만 출력
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');

const CLINIC_TOKENS = [
  'ansimpainfree', 'thewells', 'linkerai', 'linkare',
  '안심튼튼', '더웰스',
];

function isClinicFootnote(line) {
  const lower = line.toLowerCase();
  return CLINIC_TOKENS.some((t) => lower.includes(t.toLowerCase()));
}

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return null;
  return {
    raw: match[0],
    yaml: match[1],
    bodyStart: match[0].length,
  };
}

function extractFootnotes(body) {
  // Changelog 이전까지의 영역
  const cl = body.search(/^##\s+Changelog\s*$/m);
  const region = cl >= 0 ? body.slice(0, cl) : body;

  // [^N]: ... 정의 라인 + 다음 줄까지 (멀티라인 처리 단순화 — 한 줄로 가정)
  const lines = region.split('\n');
  const footnotes = []; // [{id, line, isClinic}]
  for (const line of lines) {
    const m = line.match(/^\[\^(\d+)\]\s*:\s*(.+)$/);
    if (m) {
      const id = Number(m[1]);
      footnotes.push({ id, line, isClinic: isClinicFootnote(line) });
    }
  }
  return footnotes;
}

function addFrontmatterFields(yaml, footnotes) {
  const clinic = footnotes.filter((f) => f.isClinic).map((f) => f.id).sort((a, b) => a - b);
  const external = footnotes.filter((f) => !f.isClinic).map((f) => f.id).sort((a, b) => a - b);

  // 이미 있으면 갱신, 없으면 추가
  function setKey(yamlText, key, value) {
    const re = new RegExp(`^${key}:.*$`, 'm');
    if (re.test(yamlText)) {
      return yamlText.replace(re, `${key}: ${value}`);
    } else {
      return yamlText.replace(/\n$/, '') + `\n${key}: ${value}`;
    }
  }

  let updated = yaml;
  updated = setKey(updated, 'source_count_external', external.length);
  updated = setKey(updated, 'source_count_clinic_pillar', clinic.length);
  updated = setKey(updated, 'clinic_footnote_ids', `[${clinic.join(', ')}]`);
  updated = setKey(updated, 'external_footnote_ids', `[${external.join(', ')}]`);

  return updated;
}

function splitCitationsSection(body, footnotes) {
  // Citations 섹션 위치
  const citMatch = body.match(/^(## Citations\s*\n)([\s\S]*?)(?=^## |\Z)/m);
  if (!citMatch) {
    return { body, changed: false, reason: '## Citations 섹션 없음' };
  }

  const citHeading = citMatch[1];
  const citBody = citMatch[2];

  // 이미 ### 자사 임상 자료 또는 ### 외부 권위 출처 박혀있으면 SKIP
  if (citBody.includes('### 자사 임상 자료') || citBody.includes('### 외부 권위 출처')) {
    return { body, changed: false, reason: 'Citations 헤딩 이미 분리됨' };
  }

  const clinic = footnotes.filter((f) => f.isClinic);
  const external = footnotes.filter((f) => !f.isClinic);

  // 새 Citations 본문 구성
  const parts = [];
  if (clinic.length > 0) {
    parts.push('### 자사 임상 자료');
    parts.push('');
    for (const f of clinic.sort((a, b) => a.id - b.id)) {
      parts.push(f.line);
      parts.push('');
    }
  }
  if (external.length > 0) {
    parts.push('### 외부 권위 출처');
    parts.push('');
    for (const f of external.sort((a, b) => a.id - b.id)) {
      parts.push(f.line);
      parts.push('');
    }
  }
  const newCitBody = parts.join('\n');

  // 기존 footnote 정의 라인 모두 제거 후 새 본문으로 교체
  const oldCitFootnoteSet = new Set(footnotes.map((f) => f.line));
  const newBody = body.replace(citMatch[0], (orig) => {
    return citHeading + newCitBody.trimEnd() + '\n\n';
  });

  return { body: newBody, changed: true, reason: `자사 ${clinic.length} + 외부 ${external.length} 분리` };
}

function checkLockGate(footnotes) {
  const clinic = footnotes.filter((f) => f.isClinic).length;
  const external = footnotes.filter((f) => !f.isClinic).length;
  const errors = [];
  if (external < 5) errors.push(`external sources ${external} < 5 (LOCK hard 위반)`);
  if (clinic > 2) errors.push(`clinic sources ${clinic} > 2 (LOCK hard 위반)`);
  return { ok: errors.length === 0, errors, clinic, external };
}

function processFile(filePath, dryRun) {
  const rel = path.relative(REPO_ROOT, filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  const fm = parseFrontmatter(content);
  if (!fm) {
    console.log(`✗ ${rel}: frontmatter 파싱 실패`);
    return false;
  }
  const body = content.slice(fm.bodyStart);
  const footnotes = extractFootnotes(body);

  if (footnotes.length === 0) {
    console.log(`⊘ ${rel}: footnote 정의 없음, skip`);
    return false;
  }

  const lockCheck = checkLockGate(footnotes);
  if (!lockCheck.ok) {
    console.log(`⚠ ${rel}: LOCK hard 위반 — 자동 정정 SKIP (외부 보강 필요)`);
    for (const e of lockCheck.errors) console.log(`    ${e}`);
    return false;
  }

  // frontmatter 갱신
  const newYaml = addFrontmatterFields(fm.yaml, footnotes);
  // Citations 섹션 분리
  const citResult = splitCitationsSection(body, footnotes);

  const newContent = `---\n${newYaml}\n---\n${citResult.body}`;

  if (dryRun) {
    console.log(`[dry-run] ${rel}: 자사 ${lockCheck.clinic} + 외부 ${lockCheck.external}`);
    console.log(`           frontmatter: source_count_external/clinic_pillar/clinic_footnote_ids/external_footnote_ids 추가`);
    console.log(`           Citations 분리: ${citResult.reason}`);
    return true;
  }

  fs.writeFileSync(filePath, newContent);
  console.log(`✓ ${rel}: 자사 ${lockCheck.clinic} + 외부 ${lockCheck.external}, Citations ${citResult.changed ? '분리' : '이미 분리됨'}`);
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const slugs = args.filter((a) => !a.startsWith('--'));

  if (slugs.length === 0) {
    console.log('사용: node scripts/backfill-citations-v1.js <slug> [...]');
    console.log('  slug 예: conditions/lateral-epicondylitis');
    process.exit(1);
  }

  let ok = 0, skip = 0;
  for (const slug of slugs) {
    const filePath = slug.endsWith('.md')
      ? path.resolve(slug.startsWith('/') ? slug : path.join(REPO_ROOT, slug))
      : path.join(REPO_ROOT, slug + '.md');
    if (!fs.existsSync(filePath)) {
      console.log(`✗ ${slug}: 파일 없음`);
      skip++;
      continue;
    }
    const result = processFile(filePath, dryRun);
    if (result) ok++; else skip++;
  }
  console.log(`\n처리 ${ok}개 / 스킵 ${skip}개`);
}

main();
