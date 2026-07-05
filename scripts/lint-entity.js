#!/usr/bin/env node
/**
 * lint-entity.js — entity .md 정적 검증기
 *
 * 사용:
 *   node scripts/lint-entity.js [file1.md] [file2.md] ...      # 인자 지정
 *   node scripts/lint-entity.js                                 # 변경된 파일 자동 감지 (pre-commit)
 *   node scripts/lint-entity.js --all                           # entity 디렉토리 전체
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
  'title', 'description', 'last_reviewed', 'version', 'locked', 'quality_status',
  'source_count',
  'source_count_external',
  'source_count_clinic_pillar',
  'clinic_footnote_ids',
  'external_footnote_ids',
];

// Entity Anchor Enum v1 (2026-05-20, wiki/decisions/entity_anchor_enum_v1.md)
// yhlinker backend pillar-patch-proposer.service.ts ANCHOR_TO_HEADING_BY_TYPE 와 일치.
//
// 헤딩 구조:
//   - 단일 string: 1:1 매핑 (필수)
//   - string[]: 동의어 그룹 — 그룹 내 1개 이상 매치되면 통과 (필수)
//   - { synonyms: string[], optional: true }: 선택 동의어 그룹 — 없어도 통과

const CONDITION_HEADINGS = ['정의', '병태', '증상', '진단', '치료', '예후'];

// treatment: 필수 2 (indication + limitations) + 선택 4
const TREATMENT_HEADINGS = [
  // indication 동의어 그룹 — 필수
  { synonyms: ['적응증', '적응증 영역', '정의·종류', '정의·개요', '정의·overview', '적응증·접종 권고'], optional: false, anchor: 'indication' },
  // mechanism 동의어 그룹 — 선택
  { synonyms: ['분자 기전', '작동 원리', '작용 기전', '정의·기전', '정의', '작용 기전·근거'], optional: true, anchor: 'mechanism' },
  // evidence 동의어 그룹 — 선택
  { synonyms: ['임상 evidence', '임상 근거', '근거 요약', '약물별 evidence'], optional: true, anchor: 'evidence' },
  // when_considered — 선택
  { synonyms: ['언제 고려'], optional: true, anchor: 'when_considered' },
  // expected_effect — 선택
  { synonyms: ['기대효과', '기대 가능한 범위', '관찰되는 변화와 해석'], optional: true, anchor: 'expected_effect' },
  // limitations 동의어 그룹 — 필수
  { synonyms: ['한계/주의점', '한계·주의점', '부작용·주의사항', '부작용·주의점', '부작용·금기', '부작용·주의 환자군', '약물과 시술의 관계', '적합하지 않을 수 있는 경우', '확인이 필요한 경우'], optional: false, anchor: 'limitations' },
];

const SYMPTOM_HEADINGS = [
  { synonyms: ['정의', '정의·overview'], optional: false, anchor: 'definition' },
  { synonyms: ['흔한 원인', '흔한 영역 (intrinsic capacity domains)', '분류'], optional: false, anchor: 'common_causes' },
  { synonyms: ['레드플래그', '언제 진료를'], optional: false, anchor: 'red_flags' },
  { synonyms: ['평가', '진단 흐름'], optional: false, anchor: 'evaluation' },
  { synonyms: ['치료 옵션', '치료 옵션 영역', '관리·치료 옵션'], optional: false, anchor: 'treatment_options' },
];
const BODY_PART_HEADINGS = ['정의', '관련 증상', '관련 질환', '관련 치료'];

// Wellness / concept entity schema v1 (2026-05-30)
// entity_type=concept 은 concept_group별로 H2 구조를 다르게 강제한다.
// 목적: 웰니스 글을 자유형 홍보문으로 풀지 않되, 모든 글에 "통증과의 관련성"을 억지로 넣지 않는다.
const CONCEPT_GROUP_HEADINGS = {
  pain_wellness: ['정의', '통증과의 관련성', '관련 기전', '평가', '관리 접근', '해석과 한계'],
  general_wellness: ['정의', '흔한 양상', '관련 요인', '평가', '관리 접근', '해석과 한계'],
  metabolism: ['정의', '생리적 역할', '관련 상태', '평가 지표', '관리 접근', '해석과 한계'],
  lifestyle: ['정의', '적용 대상', '핵심 원칙', '실천 방법', '평가 기준', '무리하지 않아야 할 상황'],
};

const VALID_ENTITY_TYPES = ['condition', 'treatment', 'symptom', 'body_part', 'concept'];
const VALID_QUALITY_STATUSES = ['draft', 'review', 'verified', 'archived'];

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
  if (fm.entity_type && !VALID_ENTITY_TYPES.includes(fm.entity_type)) {
    errors.push(`entity_type 잘못됨: ${fm.entity_type} (${VALID_ENTITY_TYPES.join('/')})`);
  }
  if (fm.quality_status && !VALID_QUALITY_STATUSES.includes(fm.quality_status)) {
    errors.push(`quality_status 잘못됨: ${fm.quality_status} (${VALID_QUALITY_STATUSES.join('/')})`);
  }
  if (fm.entity_type === 'concept') {
    if (!fm.concept_group) {
      errors.push(`entity_type=concept인데 frontmatter 누락: concept_group (${Object.keys(CONCEPT_GROUP_HEADINGS).join('/')})`);
    } else if (!CONCEPT_GROUP_HEADINGS[fm.concept_group]) {
      errors.push(`concept_group 잘못됨: ${fm.concept_group} (${Object.keys(CONCEPT_GROUP_HEADINGS).join('/')})`);
    }
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
  // quality_status 의미:
  //   locked=true  = 내용 보호 lock. 전체 rewrite 금지, 1~3문장/citation/H2 보강만 허용.
  //   verified     = 품질 승인. 외부 근거·clinic source 비율 hard gate 적용.
  //   review/draft = source 기준 미달은 warning으로만 노출.
  const minExternal = fm.entity_type === 'body_part' ? 3 : 5;
  if (fm.quality_status === 'verified') {
    if (ext < minExternal) {
      errors.push(`quality_status=verified인데 external sources ${ext} < ${minExternal} (verified evidence gate 위반)`);
    }
    if (clinic > 2) {
      warnings.push(`quality_status=verified이나 clinic sources ${clinic} > 2 (통과: clinic citation은 provenance일 수 있음. 의학적 claim은 external source가 받치는지 확인 권장)`);
    }
  } else if (fm.locked === 'true' || fm.locked === true) {
    if (ext < minExternal) {
      warnings.push(`locked=true이나 external sources ${ext} < ${minExternal} (quality_status=verified 전 보강 필요)`);
    }
    if (clinic > 2) {
      warnings.push(`locked=true이나 clinic sources ${clinic} > 2 (verified 전 대표 clinic citation 1~2개로 정리 권장)`);
    }
  }
}

function checkHeadings(body, fm, errors, warnings) {
  if (fm.quality_status === 'archived' || fm.status === 'archived') {
    return;
  }
  const h2Headings = [];
  for (const line of body.split('\n')) {
    const m = line.match(/^##\s+(.+?)\s*$/);
    if (m) h2Headings.push(m[1].trim());
  }
  const entityType = fm.entity_type;
  const required =
    entityType === 'concept' ? (CONCEPT_GROUP_HEADINGS[fm.concept_group] || []) :
    entityType === 'treatment' ? TREATMENT_HEADINGS :
    entityType === 'symptom' ? SYMPTOM_HEADINGS :
    entityType === 'body_part' ? BODY_PART_HEADINGS :
    CONDITION_HEADINGS;
  for (const target of required) {
    // Entity Anchor Enum v1 형식 3가지:
    //   1) string: 1:1 매핑 (condition/symptom/body_part — 모두 필수)
    //   2) string[]: 동의어 그룹 (필수, 옛 호환 — 사용 안 함 현재)
    //   3) { synonyms: string[], optional: bool, anchor: string }: 동의어 그룹 + 선택 플래그
    if (typeof target === 'string') {
      if (!h2Headings.includes(target)) {
        errors.push(`H2 헤딩 누락: ${target}`);
      }
    } else if (Array.isArray(target)) {
      const found = target.some((c) => h2Headings.includes(c));
      if (!found) {
        errors.push(`H2 헤딩 누락: ${target.join(' 또는 ')}`);
      }
    } else if (target && typeof target === 'object' && target.synonyms) {
      const found = target.synonyms.some((c) => h2Headings.includes(c));
      if (!found && !target.optional) {
        errors.push(`H2 헤딩 누락 (필수 anchor=${target.anchor}): ${target.synonyms.join(' 또는 ')}`);
      }
      // optional이면서 본문에 없으면 그냥 skip (warning도 아님)
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
  // 중복 정의 검사 — 같은 [^N]: 정의가 2회 이상이면 kramdown(GFM) 렌더가 깨진다 (errors)
  // (원인: pillar-patch 자동 append의 멱등키 부재로 관련 임상 자료 + Citations 이중 등록)
  // 실제 각주 정의는 kramdown 규칙상 줄 시작에 위치한다. 본문 중간의 "[^5]:" 같은
  // 인라인 참조+콜론(예: "…필요합니다 [^5]:**")은 정의가 아니므로 줄머리 앵커로 배제한다.
  const lineDefCounts = new Map();
  const lineDefMatches = bodyForFootnote.match(/^\[\^(\d+)\]\s*:/gm) ?? [];
  for (const m of lineDefMatches) {
    const id = Number(m.match(/\d+/)[0]);
    lineDefCounts.set(id, (lineDefCounts.get(id) ?? 0) + 1);
  }
  for (const [id, count] of lineDefCounts) {
    if (count >= 2) {
      errors.push(`[^${id}] 정의가 ${count}회 중복 (kramdown 렌더 깨짐 — 1개만 남길 것)`);
    }
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
  checkHeadings(body, fm, errors, warnings);
  checkFootnoteIds(body, fm, errors, warnings);
  checkTone(body, errors, warnings);

  return { file: rel, errors, warnings };
}

function collectFiles(args) {
  if (args.includes('--all')) {
    const files = [];
    for (const dir of ['conditions', 'treatments', 'symptoms', 'body-parts', 'concepts']) {
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
    const out = execSync('git -C "' + REPO_ROOT + '" status --porcelain -- conditions treatments symptoms body-parts concepts', { encoding: 'utf8' });
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
