#!/usr/bin/env node
/**
 * generate-hubs.js
 * entities.json → 엔티티 허브 .md 파일 자동 생성
 * + topics/index.html 생성
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

for (const entity of entities) {
  if (entity.status !== 'approved') continue;

  const dir = TYPE_DIRS[entity.type];
  if (!dir) continue;

  const dirPath = path.join(ROOT, dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const filePath = path.join(dirPath, `${entity.id}.md`);

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

console.log(`✅ ${created} hub pages generated`);

// topics/index.html은 수동 관리 (Jekyll 템플릿)
