/**
 * citation-lib.js — 자사(clinic) citation 보존 규약 공유 유틸
 *
 * Phase 3 보존 규약(spec-linkbase-citation-refactor-v1 §2·§3) 구현 공용 모듈.
 * node 내장 모듈만 사용. build-citation-manifest.js / reconcile-citations.js /
 * lint-entity.js 가 공유한다.
 *
 * 규격(BE 작업자와 동일 — 변경 금지):
 *   - 편집금지 마커: MARKER_OPEN … MARKER_CLOSE 로 자사 각주 블록을 감쌈
 *   - 매니페스트: _data/citation_manifest.json
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const MANIFEST_PATH = path.join(REPO_ROOT, '_data', 'citation_manifest.json');

// 편집금지 마커 (자사 각주 블록을 감쌈) — HTML 주석이라 Jekyll 렌더에 안 보임
const MARKER_OPEN = '<!-- LINKARE:CLINIC-CITATIONS (자동관리·편집금지) -->';
const MARKER_CLOSE = '<!-- /LINKARE:CLINIC-CITATIONS -->';

// 자사 판별 fallback 도메인
const CLINIC_DOMAINS = ['ansimpainfree.kr', 'thewellsr.kr'];

const ENTITY_DIRS = ['conditions', 'treatments', 'symptoms', 'body-parts', 'concepts'];

// 자사 각주 서브 헤딩 (Citations 안)
const CLINIC_HEADING = '### 자사 임상 자료';

// ─── frontmatter ────────────────────────────────────────────

/**
 * content 를 frontmatter(raw yaml) + body 로 분리.
 * @returns {null | { yaml, body, bodyStart }}
 */
function splitFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  return {
    yaml: match[1],
    body: content.slice(match[0].length),
    bodyStart: match[0].length,
  };
}

/**
 * yaml 문자열에서 필요한 키만 파싱 (인라인 배열 + 스칼라).
 * *_footnote_ids 는 number[] 로, source_count* 는 number 로, 나머지는 string.
 */
function parseFm(yaml) {
  const fm = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].trim();
    const val = m[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      const inner = val.slice(1, -1).trim();
      fm[key] = inner === ''
        ? []
        : inner.split(',').map((s) => {
            const t = s.trim().replace(/^['"]|['"]$/g, '');
            const n = Number(t);
            return Number.isFinite(n) && String(n) === t ? n : t;
          });
    } else if (val === '') {
      fm[key] = '';
    } else {
      const stripped = val.replace(/^['"]|['"]$/g, '');
      const n = Number(stripped);
      fm[key] = Number.isFinite(n) && String(n) === stripped ? n : stripped;
    }
  }
  return fm;
}

// ─── 도메인 / footnote 파싱 ──────────────────────────────────

function isClinicUrl(url) {
  if (!url) return false;
  return CLINIC_DOMAINS.some((d) => url.includes(d));
}

/**
 * body 에서 줄머리 각주 정의(`[^N]: …`)만 추출.
 * @returns Array<{ id, lineIndex, raw, title, url }>
 */
function extractFootnoteDefs(body) {
  const lines = body.split('\n');
  const defs = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\[\^(\d+)\]:\s*(.*)$/);
    if (!m) continue;
    const id = Number(m[1]);
    const rest = m[2];
    // 첫 번째 마크다운 링크에서 title·url 추출
    const link = rest.match(/\[([^\]]*)\]\(([^)\s]+)\)/);
    let title;
    let url;
    if (link) {
      title = link[1].trim();
      url = link[2].trim();
    } else {
      title = rest.trim();
      url = null;
    }
    defs.push({ id, lineIndex: i, raw: lines[i], title, url });
  }
  return defs;
}

/**
 * 파일의 자사 각주 def 를 판별.
 * clinic_footnote_ids frontmatter OR 자사 도메인 URL 을 union.
 * @returns Array<{ id, lineIndex, raw, title, url }>
 */
function clinicFootnoteDefs(fm, body) {
  const clinicIds = new Set(
    (Array.isArray(fm.clinic_footnote_ids) ? fm.clinic_footnote_ids : []).map(Number),
  );
  return extractFootnoteDefs(body).filter(
    (d) => clinicIds.has(d.id) || isClinicUrl(d.url),
  );
}

// ─── 마커 ────────────────────────────────────────────────────

/**
 * body 라인에서 마커 열림/닫힘 인덱스 목록.
 * @returns { opens: number[], closes: number[] }
 */
function findMarkers(lines) {
  const opens = [];
  const closes = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === MARKER_OPEN) opens.push(i);
    else if (lines[i].trim() === MARKER_CLOSE) closes.push(i);
  }
  return { opens, closes };
}

/**
 * 마커 쌍(정상 중첩)의 [open, close] 인덱스 범위 목록. 짝 안 맞으면 null.
 */
function markerRanges(lines) {
  const { opens, closes } = findMarkers(lines);
  if (opens.length !== closes.length) return null;
  const ranges = [];
  for (let k = 0; k < opens.length; k++) {
    const o = opens[k];
    const c = closes[k];
    if (c <= o) return null;
    if (k > 0 && o <= ranges[k - 1][1]) return null; // 겹침/역순
    ranges.push([o, c]);
  }
  return ranges;
}

// ─── 매니페스트 ──────────────────────────────────────────────

function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) return null;
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function kstToday() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// ─── 파일 수집 ───────────────────────────────────────────────

function collectAllEntityFiles() {
  const files = [];
  for (const dir of ENTITY_DIRS) {
    const full = path.join(REPO_ROOT, dir);
    if (!fs.existsSync(full)) continue;
    for (const f of fs.readdirSync(full)) {
      if (f.endsWith('.md')) files.push(path.join(full, f));
    }
  }
  return files;
}

module.exports = {
  REPO_ROOT,
  MANIFEST_PATH,
  MARKER_OPEN,
  MARKER_CLOSE,
  CLINIC_DOMAINS,
  CLINIC_HEADING,
  ENTITY_DIRS,
  splitFrontmatter,
  parseFm,
  isClinicUrl,
  extractFootnoteDefs,
  clinicFootnoteDefs,
  findMarkers,
  markerRanges,
  loadManifest,
  kstToday,
  collectAllEntityFiles,
};
