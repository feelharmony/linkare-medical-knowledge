#!/usr/bin/env node
/**
 * build-citation-manifest.js — 초기 citation 매니페스트 생성
 *
 * 사용:
 *   node scripts/build-citation-manifest.js            # _data/citation_manifest.json 생성
 *   node scripts/build-citation-manifest.js --dry-run  # 요약만 출력, 파일 미기록
 *
 * 동작 (spec §2):
 *   conditions/treatments/symptoms/body-parts 전 파일 스캔 →
 *   frontmatter clinic_footnote_ids + Citations 의 해당 [^N]: 정의에서 url·title 추출
 *   (자사 판별 fallback: ansimpainfree.kr / thewellsr.kr 도메인) → 스키마대로 생성.
 *   post_id / anchors / excerpt 는 초기값 null / [] (이후 백엔드가 승인 건마다 채움).
 *
 * 스키마:
 *   { version, updated_at, entities: { <entity_id>: [ { footnote_id, url, title,
 *     post_id, anchors, excerpt } ] } }
 */

const fs = require('fs');
const lib = require('./citation-lib');

function build() {
  const files = lib.collectAllEntityFiles();
  const entities = {};
  let itemCount = 0;

  for (const abs of files) {
    const content = fs.readFileSync(abs, 'utf8');
    const split = lib.splitFrontmatter(content);
    if (!split) continue;
    const fm = lib.parseFm(split.yaml);
    const entityId = fm.entity_id;
    if (!entityId) continue;

    const defs = lib.clinicFootnoteDefs(fm, split.body);
    if (defs.length === 0) continue;

    const items = defs
      .filter((d) => d.url) // url 없는 자사 각주는 매니페스트 대조 키가 없어 제외
      .sort((a, b) => a.id - b.id)
      .map((d) => ({
        footnote_id: d.id,
        url: d.url,
        title: d.title,
        post_id: null,
        anchors: [],
        excerpt: null,
      }));

    if (items.length === 0) continue;
    entities[entityId] = items;
    itemCount += items.length;
  }

  return {
    manifest: {
      version: 1,
      updated_at: lib.kstToday(),
      entities,
    },
    entityCount: Object.keys(entities).length,
    itemCount,
  };
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { manifest, entityCount, itemCount } = build();

  if (!dryRun) {
    fs.writeFileSync(lib.MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
    console.log(`매니페스트 생성: ${lib.MANIFEST_PATH}`);
  } else {
    console.log('[dry-run] 파일 미기록');
  }
  console.log(`  version=${manifest.version}  updated_at=${manifest.updated_at}`);
  console.log(`  entity 수: ${entityCount}`);
  console.log(`  항목(자사 인용) 수: ${itemCount}`);
}

main();
