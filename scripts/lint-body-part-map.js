/**
 * lint-body-part-map.js — 부위별 맵 등록·참조 정합성 검사
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const BODY_PART_MAP_PATH = path.join(REPO_ROOT, '_data', 'body_part_map.json');

let _bodyPartMapCache;
let _bodyPartMapMissingWarned = false;

function loadBodyPartMap() {
  if (_bodyPartMapCache !== undefined) return _bodyPartMapCache;
  if (!fs.existsSync(BODY_PART_MAP_PATH)) {
    _bodyPartMapCache = null;
    return _bodyPartMapCache;
  }

  const data = JSON.parse(fs.readFileSync(BODY_PART_MAP_PATH, 'utf8'));
  const groups = Array.isArray(data.groups) ? data.groups : [];
  const treatmentGroups = Array.isArray(data.treatment_groups) ? data.treatment_groups : [];
  const slugSet = new Set();
  for (const group of [...groups, ...treatmentGroups]) {
    if (!Array.isArray(group.items)) continue;
    for (const slug of group.items) slugSet.add(slug);
  }
  _bodyPartMapCache = { slugSet, groups, treatment_groups: treatmentGroups };
  return _bodyPartMapCache;
}

function checkBodyPartMembership(fm, errors, warnings) {
  if (fm.entity_type !== 'condition' && fm.entity_type !== 'symptom' && fm.entity_type !== 'treatment') return;
  if (fm.status === 'archived' || fm.published === false || fm.published === 'false') return;

  const bodyPartMap = loadBodyPartMap();
  if (bodyPartMap === null) {
    if (!_bodyPartMapMissingWarned) {
      _bodyPartMapMissingWarned = true;
      warnings.push('body_part_map.json 없음 — 부위별 등록/참조 검사 skip (맵 도입 전)');
    }
    return;
  }
  if (fm.entity_id && !bodyPartMap.slugSet.has(fm.entity_id)) {
    errors.push('body_part_map.json 미등록 — groups 또는 treatment_groups items에 entity_id 추가 필요');
  }
}

function checkBodyPartMapDangling(allEntityIds, errors) {
  const bodyPartMap = loadBodyPartMap();
  if (bodyPartMap === null) return;
  for (const slug of bodyPartMap.slugSet) {
    if (!allEntityIds.has(slug)) {
      errors.push(`body_part_map.json dangling slug: ${slug} — 실존 entity_id 없음`);
    }
  }
}

module.exports = {
  loadBodyPartMap,
  checkBodyPartMembership,
  checkBodyPartMapDangling,
};
