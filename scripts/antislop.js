#!/usr/bin/env node
/**
 * antislop.js
 * yhlinker AntislopPatcherService 포팅 — entity .md 본문 AI slop 정리.
 *
 * 결정론적 regex만 사용. LLM 호출 없음. paraphrase 위험 0.
 * Citations / Changelog 섹션은 손대지 않음.
 *
 * 사용법:
 *   node scripts/antislop.js <file.md>            # 적용 (덮어쓰기)
 *   node scripts/antislop.js <file.md> --dry-run  # 변경 미리보기 (diff)
 *   node scripts/antislop.js <file.md> --diff     # 동일
 *
 * 9가지 패치 패턴
 *   1. 기계적 전환어 (또한·더욱이·게다가·그러므로) — 섹션당 1회까지
 *   2. 결론/요약 마커 (결론적으로·요약하자면 등) — 제거
 *   3. LLM 특유 문구 (~하는 것이 중요합니다 등) — 완화
 *   4. 반복 문장 시작 (이는·이러한·이로 인해) — 섹션당 2회까지
 *   5. 과도한 일반화 (일반적으로·대체로·대부분의 경우) — 1회까지
 *   6. 연속 "~할 수 있습니다" — 3회+ 시 "~합니다"로
 *   7. 학술 인용 (Author, 2020) — 본문에서 제거 (Citations 섹션은 별도)
 *   8. footnote 동일 번호 중복 ([^1] [^1] → [^1])
 *   9. 같은 문장 연속 중복
 */

const fs = require('fs');
const path = require('path');

function clean(bodyMd) {
  if (!bodyMd || !bodyMd.trim()) return { bodyMd, patchCount: 0 };
  try {
    const sections = bodyMd.split(/(?=^##\s)/m);
    let totalPatches = 0;
    const cleaned = sections.map((section) => {
      if (/^##\s+(Citations|Changelog)/m.test(section)) return section;
      const { body, patches } = cleanSection(section);
      totalPatches += patches;
      return body;
    });
    return { bodyMd: cleaned.join(''), patchCount: totalPatches };
  } catch (err) {
    console.warn(`[antislop] fail — ${err.message}`);
    return { bodyMd, patchCount: 0 };
  }
}

function cleanSection(section) {
  let out = section;
  let total = 0;

  // 1) 기계적 전환어 — 섹션당 1회까지
  total += limitFirstN(
    out,
    [
      /(\s|^)또한,?\s/g,
      /(\s|^)더욱이,?\s/g,
      /(\s|^)게다가,?\s/g,
      /(\s|^)그러므로,?\s/g,
    ],
    1,
    (result) => (out = result),
  );

  // 2) 결론/요약 마커 — 제거
  const hardRemoves = [
    /(?:^|\s)결론적으로,?\s+/g,
    /(?:^|\s)요약하자면,?\s+/g,
    /(?:^|\s)간단히\s*말(?:하자면|해서|하면),?\s+/g,
    /(?:^|\s)정리하자면,?\s+/g,
  ];
  for (const re of hardRemoves) {
    const before = out;
    out = out.replace(re, (match) =>
      match.startsWith(' ') || match.startsWith('\n') ? ' ' : '',
    );
    if (before !== out) total++;
  }

  // 3) LLM 특유 문구 완화
  const phrasePatches = [
    [/하는\s+것이\s+중요합니다/g, '중요합니다'],
    [/주목할\s+만합니다/g, '살펴볼 만합니다'],
    [/다음과\s+같은\s+이유로/g, '이런 이유로'],
    [/다음과\s+같이/g, '이렇게'],
    [/라고\s+할\s+수\s+있습니다/g, '입니다'],
    [/(으)?로\s+알려져\s+있습니다/g, '$1로 알려집니다'],
  ];
  for (const [re, to] of phrasePatches) {
    const before = out;
    out = out.replace(re, to);
    if (before !== out) total++;
  }

  // 4) 반복 문장 시작 — 섹션당 2회까지
  total += limitFirstN(
    out,
    [
      /(?:^|\n|\.\s+)이는\s/g,
      /(?:^|\n|\.\s+)이러한\s/g,
      /(?:^|\n|\.\s+)이로\s+인해\s/g,
    ],
    2,
    (result) => (out = result),
    (match) => match.replace(/이는\s|이러한\s|이로\s+인해\s/, ''),
  );

  // 5) 과도한 일반화 — 1회까지
  total += limitFirstN(
    out,
    [/(\s|^)일반적으로,?\s/g, /(\s|^)대체로,?\s/g, /(\s|^)대부분의\s+경우,?\s/g],
    1,
    (result) => (out = result),
  );

  // 6) 연속 "~할 수 있습니다" — 3회+ 시 "~합니다"로
  total += limitFirstN(
    out,
    [/수\s+있습니다\./g],
    2,
    (result) => (out = result),
    () => '습니다.',
  );

  // 7) 학술 인용 (Author, 2020) — 위키엔 Citations 섹션 따로 있어 본문 인용은 깨진 참조
  const citationPatterns = [
    /\s?\([A-Z][a-zA-Z]+(?:\s+(?:et\s+al\.?|and|&)\s+[A-Z][a-zA-Z]+)?,?\s+(?:19|20)\d{2}[a-z]?\)/g,
    /\s?\([가-힣]{2,}(?:\s*외)?,?\s*(?:19|20)\d{2}\)/g,
  ];
  for (const re of citationPatterns) {
    const before = out;
    out = out.replace(re, '');
    if (before !== out) total++;
  }

  // 8) footnote 동일 번호 연속 중복 — [^1] [^1] → [^1]
  const fnDupBefore = out;
  out = out.replace(/(\[\^[0-9]+\])(\s+\1)+/g, '$1');
  if (fnDupBefore !== out) total++;

  // 9) 같은 문장 연속 중복
  const sentDupBefore = out;
  out = out.replace(/([^.!?\n]{20,300}[.!?])\s+\1/g, '$1');
  if (sentDupBefore !== out) total++;

  // 공백/문장부호 정리
  out = out
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+(?=[.,!?;:])/g, '')
    .replace(/\n{3,}/g, '\n\n');

  return { body: out, patches: total };
}

function limitFirstN(text, patterns, keepN, writeBack, replacer) {
  let result = text;
  let patches = 0;
  const hits = [];
  for (const re of patterns) {
    const regex = new RegExp(re.source, re.flags);
    let m;
    while ((m = regex.exec(result)) !== null) {
      hits.push({ index: m.index, length: m[0].length, match: m[0] });
      if (m.index === regex.lastIndex) regex.lastIndex++;
    }
  }
  hits.sort((a, b) => a.index - b.index);
  if (hits.length <= keepN) {
    writeBack(result);
    return 0;
  }
  const toReplace = hits.slice(keepN).reverse();
  for (const h of toReplace) {
    const replacement = replacer ? replacer(h.match) : ' ';
    result =
      result.slice(0, h.index) + replacement + result.slice(h.index + h.length);
    patches++;
  }
  writeBack(result);
  return patches;
}

// ─── frontmatter 분리 + 적용 ─────────────────────────────────

function splitFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { frontmatter: '', body: content, hasFrontmatter: false };
  return { frontmatter: `---\n${m[1]}\n---\n`, body: m[2], hasFrontmatter: true };
}

function unifiedDiff(before, after, filePath) {
  // 간단한 줄 단위 diff (full-file). 상세 diff는 git diff로 별도 확인.
  const beforeLines = before.split('\n');
  const afterLines = after.split('\n');
  const out = [];
  out.push(`--- ${filePath} (before)`);
  out.push(`+++ ${filePath} (after antislop)`);
  const max = Math.max(beforeLines.length, afterLines.length);
  for (let i = 0; i < max; i++) {
    const b = beforeLines[i] ?? '';
    const a = afterLines[i] ?? '';
    if (b === a) continue;
    if (b) out.push(`- ${b}`);
    if (a) out.push(`+ ${a}`);
  }
  return out.join('\n');
}

// ─── CLI ──────────────────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('Usage: node scripts/antislop.js <file.md> [--dry-run|--diff]');
    process.exit(1);
  }
  const filePath = args[0];
  const dryRun = args.includes('--dry-run') || args.includes('--diff');

  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const original = fs.readFileSync(filePath, 'utf8');
  const { frontmatter, body, hasFrontmatter } = splitFrontmatter(original);

  const { bodyMd: cleaned, patchCount } = clean(body);

  if (patchCount === 0) {
    console.log(`[antislop] ${filePath}: 변경 없음 (이미 깨끗)`);
    return;
  }

  const newContent = (hasFrontmatter ? frontmatter : '') + cleaned;

  if (dryRun) {
    console.log(unifiedDiff(original, newContent, filePath));
    console.log(`\n[antislop] ${filePath}: ${patchCount}건 패치 후보 (dry-run)`);
    return;
  }

  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`[antislop] ${filePath}: ${patchCount}건 패치 적용 완료`);
}

main();
