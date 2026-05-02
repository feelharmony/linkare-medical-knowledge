#!/usr/bin/env node
/**
 * generate-hubs.js
 * entities.json → 엔티티 허브 .md 파일 부트스트래핑 (스켈레톤 생성)
 *
 * ⚠️ 본문 보존 정책: 이미 존재하는 .md 파일은 절대 덮어쓰지 않는다.
 *    entities.json에 새 entity ID를 추가했을 때, 아직 hub 파일이 없는
 *    경우에만 빈 frontmatter 스켈레톤을 만든다.
 *    기존 hub의 frontmatter나 본문을 수정하려면 직접 편집할 것.
 *
 * 과거 사고(2026-05-02): 안전장치가 없어서 11개 entity 본문이 한 번에
 * 삭제됨. 그 사고 이후 skip-if-exists 가드 추가.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const entities = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/entities.json'), 'utf8'));

const TYPE_DIRS = {
  condition: 'conditions',
  symptom: 'symptoms',
  treatment: 'treatments',
  body_part: 'body-parts',
  doctor: 'doctors',
  hospital: 'hospitals'
};

let created = 0;
let skipped = 0;

for (const entity of entities) {
  if (entity.status !== 'approved') continue;

  const dir = TYPE_DIRS[entity.type];
  if (!dir) continue;

  const dirPath = path.join(ROOT, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const filePath = path.join(dirPath, `${entity.id}.md`);

  if (fs.existsSync(filePath)) {
    skipped++;
    continue;
  }

  const frontmatter = [
    '---',
    'layout: entity-hub',
    `entity_id: ${entity.id}`,
    `entity_type: ${entity.type}`,
    `permalink: /${dir}/${entity.id}/`,
    `title: "${entity.name_ko}"`,
    `title_en: "${entity.name_en || ''}"`,
    `description: "${entity.description_ko}"`,
    'robots: "noindex, follow"',
    '---',
    ''
  ].join('\n');

  fs.writeFileSync(filePath, frontmatter, 'utf8');
  created++;
}

console.log(`✅ ${created} new hub pages bootstrapped, ${skipped} existing files preserved`);

// topics/index.html은 수동 관리 (Jekyll 템플릿)
