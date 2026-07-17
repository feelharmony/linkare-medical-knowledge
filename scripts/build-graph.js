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

// tenant_groups.json은 선택 기능이다. 파일이 없으면 기존 단일 의사 크레딧을 유지한다.
const tenantGroupsPath = path.join(ROOT, '_data/tenant_groups.json');
const tenantGroupsData = fs.existsSync(tenantGroupsPath)
  ? JSON.parse(fs.readFileSync(tenantGroupsPath, 'utf8'))
  : {};
const tenantGroups = tenantGroupsData.groups || [];
// 테넌트→병원 1:1 매핑. 백엔드가 hospital_id를 null로 내려준 글에만 보정한다.
const tenantHospitals = tenantGroupsData.tenant_hospitals || {};

const groupDoctorsByTenant = new Map();
for (const group of tenantGroups) {
  const doctors = Array.isArray(group.doctors) ? group.doctors : [];
  const members = Array.isArray(group.members) ? group.members : [];
  for (const tenantKey of members) {
    const creditedDoctors = groupDoctorsByTenant.get(tenantKey) || [];
    groupDoctorsByTenant.set(tenantKey, [...new Set([...creditedDoctors, ...doctors])]);
  }
}

function resolveDoctorCredits(entry) {
  if (groupDoctorsByTenant.has(entry.tenant_key)) {
    return groupDoctorsByTenant.get(entry.tenant_key);
  }
  return entry.doctor_id ? [entry.doctor_id] : [];
}

function resolveHospitalCredit(entry) {
  if (entry.hospital_id) return entry.hospital_id;
  return tenantHospitals[entry.tenant_key] || null;
}

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
  for (const doctorId of resolveDoctorCredits(entry)) {
    if (!approvedIds.has(doctorId)) continue;
    if (!nodeStats[doctorId]) nodeStats[doctorId] = { post_count: 0, tenant_keys: new Set() };
    nodeStats[doctorId].post_count++;
    nodeStats[doctorId].tenant_keys.add(entry.tenant_key);
  }
  const hospitalId = resolveHospitalCredit(entry);
  if (hospitalId && approvedIds.has(hospitalId)) {
    if (!nodeStats[hospitalId]) nodeStats[hospitalId] = { post_count: 0, tenant_keys: new Set() };
    nodeStats[hospitalId].post_count++;
    nodeStats[hospitalId].tenant_keys.add(entry.tenant_key);
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
  // entity_ids + 의사 크레딧 목록 + hospital 크레딧 전부 합침
  const allIds = [...entry.entity_ids];
  allIds.push(...resolveDoctorCredits(entry));
  const edgeHospitalId = resolveHospitalCredit(entry);
  if (edgeHospitalId) allIds.push(edgeHospitalId);

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
// 복사본에는 hospital 보정을 적용해 병원 페이지 소속 글 목록이 동작하게 한다 (원본 data/는 불변).
const postMapForSite = postMap.map(entry => ({
  ...entry,
  hospital_id: resolveHospitalCredit(entry)
}));
fs.writeFileSync(
  path.join(dataDir, 'post_entity_map.json'),
  `${JSON.stringify(postMapForSite, null, 2)}\n`,
  'utf8'
);

console.log(`✅ entity_graph.json: ${nodes.length} nodes, ${edges.length} edges`);
console.log(`✅ post_entity_map.json: ${postMap.length} posts copied to _data/`);
