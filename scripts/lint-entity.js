#!/usr/bin/env node
/**
 * lint-entity.js — entity .md 정적 검증기
 *
 * 사용:
 *   node scripts/lint-entity.js [file1.md] [file2.md] ...      # 인자 지정
 *   node scripts/lint-entity.js                                 # 변경된 파일 자동 감지 (pre-commit)
 *   node scripts/lint-entity.js --all                           # conditions/treatments 전체
 *
 * 종료 코드:
 *   0 — 모두 통과
 *   1 — 1개 이상 fail
 *
 * 정합 명세 (위반 시 차단):
 *   - linkbase_pillar_only_gate_v1.md (룰 F·D·E·K)
 *   - linkbase_tone_and_ai_search_strategy.md
 *   - yhlinker/backend/src/knowledge/services/pillar-patch-proposer.service.ts (brand/tonal/honorific 정규식)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');

// ─── 룰 정의 ────────────────────────────────────────────────

const REQUIRED_FRONTMATTER = [
  'layout', 'entity_id', 'entity_type', 'permalink',
  'title', 'description', 'last_reviewed', 'version', 'locked',
  'source_count',
  'source_count_external',
  'source_count_clinic_pillar',
  'clinic_footnote_ids',
  'external_footnote_ids',
];

const CONDITION_HEADINGS = ['정의', '병태', '증상', '진단', '치료', '예후'];
const TREATMENT_HEADINGS = [
  '적응증',
  ['분자 기전', '작동 원리'],
  ['임상 evidence', '임상 근거'],
  '언제 고려',
  '기대효과',
  ['한계/주의점', '한계·주의점'],
];

// yhlinker pillar-patch-proposer.service.ts:651-665 와 동일
const BRAND_BANNED = [
  '안심튼튼', '더웰스', '권진열', '박성진',
  'ansimpainfree', 'linkare', 'linkerai', 'thewells',
];

// yhlinker pillar-patch-proposer.service.ts:667-676 와 동일
const TONAL_BANNED = [
  '한국에서는', '한국의 임상', '우리는', '우리의',
  '본원에서는', '본 클리닉', '저희 병원', '국내에서는',
];

// yhlinker pillar-patch-proposer.service.ts:686 와 동일
const HAEYO_OR_PLAIN_REGEX =
  /(?:한다|된다|이다|아니다|있다|없다|보인다|받는다|준다|간다|온다|쓴다|만든다|기여한다|돕는다|개선된다|완화된다|발생한다|나타난다|생긴다)(?=[\s.,!?\[]|$)/;

// ─── frontmatter 파서 ─────────────────────────────────────

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const yaml = match[1];
  const fm = {};
  let currentKey = null;
  let inArray = false;
  for (const line of yaml.split('\n')) {
    if (line.match(/^[a-z_]+:/i)) {
      const [key, ...rest] = line.split(':');
      const val = rest.join(':').trim();
      currentKey = key.trim();
      inArray = false;
      if (val === '' || val === '[]') {
        fm[currentKey] = val === '[]' ? [] : [];
      } else if (val.startsWith('[') && val.endsWith(']')) {
        // inline array: [1, 2, 3]
        const inner = val.slice(1, -1).trim();
        fm[currentKey] = inner === '' ? [] : inner.split(',').map((s) => {
          const t = s.trim().replace(/^['"]|['"]$/g, '');
          const n = Number(t);
          return Number.isFinite(n) && String(n) === t ? n : t;
        });
      } else {
        fm[currentKey] = val.replace(/^['"]|['"]$/g, '');
      }
    } else if (line.match(/^\s+-\s+/) && currentKey) {
      if (!Array.isArray(fm[currentKey])) fm[currentKey] = [];
      fm[currentKey].push(line.replace(/^\s+-\s+/, '').replace(/^['"]|['"]$/g, ''));
      inArray = true;
    }
  }
  return { frontmatter: fm, body: content.slice(match[0].length) };
}

// ─── 검사 함수 ─────────────────────────────────────────

function checkFrontmatter(fm, errors, warnings) {
  for (const key of REQUIRED_FRONTMATTER) {
    if (fm[key] === undefined) {
      errors.push(`frontmatter 누락: ${key}`);
    }
  }
  if (fm.entity_type && !['condition', 'treatment', 'symptom', 'body_part'].includes(fm.entity_type)) {
    errors.push(`entity_type 잘못됨: ${fm.entity_type} (condition/treatment/symptom/body_part)`);
  }
  // 카운트 정합
  const ext = Array.isArray(fm.external_footnote_ids) ? fm.external_footnote_ids.length : 0;
  const clinic = Array.isArray(fm.clinic_footnote_ids) ? fm.clinic_footnote_ids.length : 0;
  if (typeof fm.source_count_external === 'number' && fm.source_count_external !== ext) {
    errors.push(`source_count_external(${fm.source_count_external}) ≠ external_footnote_ids.length(${ext})`);
  }
  if (typeof fm.source_count_clinic_pillar === 'number' && fm.source_count_clinic_pillar !== clinic) {
    errors.push(`source_count_clinic_pillar(${fm.source_count_clinic_pillar}) ≠ clinic_footnote_ids.length(${clinic})`);
  }
  // LOCK hard 조건
  if (fm.locked === 'true' || fm.locked === true) {
    if (ext < 5) {
      errors.push(`locked=true인데 external sources ${ext} < 5 (LOCK hard 위반)`);
    }
    if (clinic > 2) {
      errors.push(`locked=true인데 clinic sources ${clinic} > 2 (LOCK hard 위반)`);
    }
  }
}

function checkHeadings(body, entityType, errors, warnings) {
  const h2Headings = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) h2Headings.push(m[1].trim());
  }
  const required = entityType === 'treatment' ? TREATMENT_HEADINGS : CONDITION_HEADINGS;
  for (const target of required) {
    const candidates = Array.isArray(target) ? target : [target];
    const found = candidates.some((c) => h2Headings.includes(c));
    if (!found) {
      errors.push(`H2 헤딩 누락: ${candidates.join(' 또는 ')}`);
    }
  }
  // Citations 헤딩 분리
  if (!body.includes('### 자사 임상 자료') && !body.includes('### 외부 권위 출처')) {
    warnings.push(`Citations 섹션 헤딩 분리 누락 (### 자사 임상 자료 / ### 외부 권위 출처)`);
  }
}

function checkFootnoteIds(body, fm, errors, warnings) {
  // Changelog 섹션은 검사 제외 (자유 텍스트로 footnote ID 언급 가능)
  const changelogIdx = body.search(/^##\s+Changelog\s*$/m);
  const bodyForFootnote = changelogIdx >= 0 ? body.slice(0, changelogIdx) : body;

  // 명명형 footnote 검출
  const namedFootnote = bodyForFootnote.match(/\[\^[a-z][a-z0-9-]*\]/gi);
  if (namedFootnote) {
    errors.push(`footnote ID는 숫자만 허용. 명명형 검출: ${[...new Set(namedFootnote)].join(', ')}`);
  }
  // 본문 inline occurrence
  const inlineIds = new Set();
  const inlineMatches = bodyForFootnote.match(/\[\^(\d+)\](?!:)/g) ?? [];
  for (const m of inlineMatches) {
    inlineIds.add(Number(m.match(/\d+/)[0]));
  }
  // Citations 정의
  const defIds = new Set();
  const defMatches = bodyForFootnote.match(/\[\^(\d+)\]\s*:/g) ?? [];
  for (const m of defMatches) {
    defIds.add(Number(m.match(/\d+/)[0]));
  }
  // dangling 검사
  for (const id of inlineIds) {
    if (!defIds.has(id)) {
      errors.push(`본문 [^${id}] 참조하지만 정의 없음 (dangling footnote)`);
    }
  }
  // frontmatter ↔ Citations 매칭
  const fmClinic = Array.isArray(fm.clinic_footnote_ids) ? fm.clinic_footnote_ids.map(Number) : [];
  const fmExternal = Array.isArray(fm.external_footnote_ids) ? fm.external_footnote_ids.map(Number) : [];
  const fmAll = new Set([...fmClinic, ...fmExternal]);
  for (const id of defIds) {
    if (!fmAll.has(id)) {
      warnings.push(`Citations에 [^${id}] 정의 있는데 frontmatter clinic_footnote_ids/external_footnote_ids에 미등록`);
    }
  }
}

function checkTone(body, errors, warnings) {
  // 룰 E절은 본문 6섹션에만 적용.
  // Citations, Changelog, 관련 임상 자료 = footnote 정의 영역 → brand/tonal 검사 제외
  // (linkbase_pillar_only_gate_v1.md:67 — 관련 임상 자료는 자동 빌드 + section-local footnote 정의 영역)
  const lines = body.split('\n');
  let inExcluded = false;
  let lineNum = 0;
  const EXCLUDED_HEADINGS = /^##\s+(Citations|Changelog|관련 임상 자료)\s*$/;
  for (const line of lines) {
    lineNum++;
    if (line.match(EXCLUDED_HEADINGS)) { inExcluded = true; continue; }
    if (line.match(/^##\s+/) && !line.match(EXCLUDED_HEADINGS)) {
      inExcluded = false;
    }
    if (inExcluded) continue;
    // HTML 주석 안은 건너뜀
    if (line.trim().startsWith('<!--') || line.trim().startsWith('-->')) continue;

    // brand 검출
    for (const word of BRAND_BANNED) {
      if (line.toLowerCase().includes(word.toLowerCase())) {
        errors.push(`line ${lineNum}: brand 노출 — "${word}"`);
      }
    }
    // tonal 검출
    for (const phrase of TONAL_BANNED) {
      if (line.includes(phrase)) {
        errors.push(`line ${lineNum}: 자사 어조 — "${phrase}"`);
      }
    }
    // 합쇼체 위반
    if (HAEYO_OR_PLAIN_REGEX.test(line)) {
      const m = line.match(HAEYO_OR_PLAIN_REGEX);
      warnings.push(`line ${lineNum}: 합쇼체 위반 (~다체) — "${m[0]}"`);
    }
  }
}

// ─── 메인 ─────────────────────────────────────────────

function lintFile(absPath) {
  const rel = path.relative(REPO_ROOT, absPath);
  const content = fs.readFileSync(absPath, 'utf8');
  const parsed = parseFrontmatter(content);
  if (!parsed) {
    return { file: rel, errors: ['frontmatter 파싱 실패 (--- 블록 없음)'], warnings: [] };
  }
  const { frontmatter: fm, body } = parsed;
  const errors = [];
  const warnings = [];

  checkFrontmatter(fm, errors, warnings);
  checkHeadings(body, fm.entity_type, errors, warnings);
  checkFootnoteIds(body, fm, errors, warnings);
  checkTone(body, errors, warnings);

  return { file: rel, errors, warnings };
}

function collectFiles(args) {
  if (args.includes('--all')) {
    const files = [];
    for (const dir of ['conditions', 'treatments']) {
      const full = path.join(REPO_ROOT, dir);
      if (!fs.existsSync(full)) continue;
      for (const f of fs.readdirSync(full)) {
        if (f.endsWith('.md')) files.push(path.join(full, f));
      }
    }
    return files;
  }
  const explicit = args.filter((a) => !a.startsWith('--')).map((a) => path.resolve(a));
  if (explicit.length > 0) return explicit;
  // 변경된 파일 자동 감지 (staged + unstaged + untracked)
  try {
    const out = execSync('git -C "' + REPO_ROOT + '" status --porcelain -- conditions treatments', { encoding: 'utf8' });
    const files = [];
    for (const line of out.split('\n')) {
      const m = line.match(/^\s*\S+\s+(.+\.md)\s*$/);
      if (m) files.push(path.join(REPO_ROOT, m[1].trim()));
    }
    return files.filter((f) => fs.existsSync(f));
  } catch {
    return [];
  }
}

function main() {
  const args = process.argv.slice(2);
  const files = collectFiles(args);
  if (files.length === 0) {
    console.log('검사할 파일 없음 (변경된 .md 없거나 인자 없음). --all 옵션으로 전체 검사 가능.');
    process.exit(0);
  }

  let failCount = 0;
  let warnCount = 0;
  for (const f of files) {
    const result = lintFile(f);
    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log(`✓ ${result.file}`);
      continue;
    }
    if (result.errors.length > 0) {
      failCount++;
      console.log(`✗ ${result.file}`);
      for (const e of result.errors) console.log(`    [ERROR] ${e}`);
    } else {
      console.log(`⚠ ${result.file}`);
    }
    for (const w of result.warnings) {
      warnCount++;
      console.log(`    [WARN]  ${w}`);
    }
  }

  console.log('');
  console.log(`검사 ${files.length}개 / FAIL ${failCount}개 / WARN ${warnCount}개`);
  process.exit(failCount > 0 ? 1 : 0);
}

main();
