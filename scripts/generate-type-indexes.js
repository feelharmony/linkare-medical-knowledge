#!/usr/bin/env node
/**
 * generate-type-indexes.js
 * 각 엔티티 타입별 인덱스 페이지 생성
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const types = [
  { dir: 'conditions', type: 'condition', label_ko: '질환', desc: '질환별 의학 지식 인덱스' },
  { dir: 'symptoms', type: 'symptom', label_ko: '증상', desc: '증상별 의학 지식 인덱스' },
  { dir: 'treatments', type: 'treatment', label_ko: '치료', desc: '치료별 의학 지식 인덱스' },
  { dir: 'body-parts', type: 'body_part', label_ko: '부위', desc: '부위별 의학 지식 인덱스' },
  { dir: 'doctors', type: 'doctor', label_ko: '의사', desc: '참여 의료진 목록' },
  { dir: 'hospitals', type: 'hospital', label_ko: '병원', desc: '참여 의료기관 목록' }
];

for (const t of types) {
  const dirPath = path.join(ROOT, t.dir);
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });

  const content = `---
layout: entity-index
entity_type: ${t.type}
title: "${t.label_ko} — Linkare Medical Knowledge"
description: "${t.desc}"
permalink: /${t.dir}/
type_label: "${t.label_ko}"
robots: "noindex, follow"
---
`;
  fs.writeFileSync(path.join(dirPath, 'index.html'), content, 'utf8');
}

console.log(`✅ ${types.length} type index pages generated`);
