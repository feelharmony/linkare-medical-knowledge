#!/usr/bin/env node
/**
 * build-graph.js
 * post-entity-map.json + entities.json → _data/entity_graph.json
 * co-occurrence 기반 엣지 계산
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const entities = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/entities.json'), 'utf8'));
const postMap = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/post-entity-map.json'), 'utf8'));

// approved entity만
const approvedIds = new Set(entities.filter(e => e.status === 'approved').map(e => e.id));

// 노드별 post_count, tenant_keys 집계
const nodeStats = {};
for (const entry of postMap) {
  for (const eid of entry.entity_ids) {
    if (!approvedIds.has(eid)) continue;
    if (!nodeStats[eid]) nodeStats[eid] = { post_count: 0, tenant_keys: new Set() };
    nodeStats[eid].post_count++;
    nodeStats[eid].tenant_keys.add(entry.tenant_key);
  }
  // doctor, hospital도 노드에 추가
  if (entry.doctor_id && approvedIds.has(entry.doctor_id)) {
    if (!nodeStats[entry.doctor_id]) nodeStats[entry.doctor_id] = { post_count: 0, tenant_keys: new Set() };
    nodeStats[entry.doctor_id].post_count++;
    nodeStats[entry.doctor_id].tenant_keys.add(entry.tenant_key);
  }
  if (entry.hospital_id && approvedIds.has(entry.hospital_id)) {
    if (!nodeStats[entry.hospital_id]) nodeStats[entry.hospital_id] = { post_count: 0, tenant_keys: new Set() };
    nodeStats[entry.hospital_id].post_count++;
    nodeStats[entry.hospital_id].tenant_keys.add(entry.tenant_key);
  }
}

// 노드 목록 생성
const nodes = entities
  .filter(e => e.status === 'approved' && nodeStats[e.id])
  .map(e => ({
    id: e.id,
    type: e.type,
    name_ko: e.name_ko,
    name_en: e.name_en,
    post_count: nodeStats[e.id]?.post_count || 0,
    tenant_keys: [...(nodeStats[e.id]?.tenant_keys || [])]
  }));

// 엣지: co-occurrence (같은 글에 같이 등장하면 연결)
const edgeMap = {};
for (const entry of postMap) {
  // entity_ids + doctor_id + hospital_id 전부 합침
  const allIds = [...entry.entity_ids];
  if (entry.doctor_id) allIds.push(entry.doctor_id);
  if (entry.hospital_id) allIds.push(entry.hospital_id);

  const filtered = allIds.filter(id => approvedIds.has(id));

  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      const key = [filtered[i], filtered[j]].sort().join('::');
      if (!edgeMap[key]) edgeMap[key] = { weight: 0, tenant_keys: new Set() };
      edgeMap[key].weight++;
      edgeMap[key].tenant_keys.add(entry.tenant_key);
    }
  }
}

const edges = Object.entries(edgeMap).map(([key, val]) => {
  const [source, target] = key.split('::');
  return {
    source,
    target,
    weight: val.weight,
    tenant_keys: [...val.tenant_keys]
  };
});

const graph = { nodes, edges };

// _data 디렉토리 확인
const dataDir = path.join(ROOT, '_data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

fs.writeFileSync(
  path.join(dataDir, 'entity_graph.json'),
  JSON.stringify(graph, null, 2),
  'utf8'
);

// post-entity-map도 _data에 복사 (Jekyll에서 site.data로 접근)
fs.writeFileSync(
  path.join(dataDir, 'post_entity_map.json'),
  JSON.stringify(postMap, null, 2),
  'utf8'
);

console.log(`✅ entity_graph.json: ${nodes.length} nodes, ${edges.length} edges`);
console.log(`✅ post_entity_map.json: ${postMap.length} posts copied to _data/`);
