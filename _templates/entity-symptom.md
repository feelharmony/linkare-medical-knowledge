<!--
================================================================================
Entity 형판 — symptom (증상)
================================================================================

복제 방법:
  cp _templates/entity-symptom.md symptoms/<slug>.md

기반 운영본:
  - symptoms/elbow-pain.md (v4, source_count 8, 8섹션 schema)
  - symptoms/headache.md (v4, source_count 9, 우산 entity D 옵션 패턴)
  - symptoms/lower-back-pain.md (v6, source_count 8)

▼ anchor enum + H2 헤딩 매핑 (Entity Anchor Enum v1, 2026-05-20)

wiki/decisions/entity_anchor_enum_v1.md 결정문 — yhlinker backend
pillar-patch-proposer.service.ts ANCHOR_TO_HEADING_BY_TYPE.symptom 와 일치.

| anchor (영문) | H2 헤딩 (한국어) | 필수 여부 |
|---------------|-----------------|-----------|
| definition    | 정의           | 필수      |
| causes        | 흔한 원인      | 필수      |
| red_flags     | 레드플래그     | 필수      |
| evaluation    | 평가           | 필수      |
| options       | 치료 옵션      | 필수      |

선택 추가 H2 (운영본 변형 허용):
- 분류 (hair-loss 등 질환 분류가 복잡한 경우)
- 언제 진료를 (의료 접근 안내)
- 예후 (예후·경과 강조, knee-pain 패턴)

▼ symptom 특성 차이 (condition·treatment와 비교)

A. **우산 용어 (umbrella term) 성격**:
   - symptoms는 단일 진단명이 아니라 부위·증상 입력 → 여러 원인 질환으로 분기되는 광역 진입점
   - 환자가 검색하는 증상 키워드 (예: "팔꿈치 통증", "두통", "허리 통증") 그대로 entity 제목
   - 깊은 진료 정보는 자녀 conditions/treatments entity로 link 분산
   - linkbase_pillar_only_gate_v1.md:53-56 (D2 폐기 — symptoms entity 본문에도 자사 [^N] 박힘 허용)

B. **본문 5섹션 H2(##) 헤딩 고정**: 정의 / 흔한 원인 / 레드플래그 / 평가 / 치료 옵션
   - "흔한 원인"은 자녀 conditions entity로 link 분산 (반복 안 되게)
   - "레드플래그"는 ⚠️ 박스로 응급 신호 표시 (SNNOOP10 등 표준 체크리스트 참고)
   - "평가"는 임상 진찰 + 영상 적응증 (모든 환자에 영상 X)
   - "치료 옵션"은 보존 → 약물 → 시술 → 수술 단계, 자녀 treatments entity로 link 분산

C. **외부 권위 출처 다양화**:
   - 가이드라인 (AAFP, APTA, NICE, ACR, AANS, Lancet 등)
   - 역학 (GBD Collaborators 시리즈, 한국 KNHANES 등)
   - 레드플래그 표준 (SNNOOP10, AANS 마미증후군 등)

D. **frontmatter 필수 12필드** + footnote 추적 4필드 — entity-condition.md 형판과 동일

E. **자사 [^N] 결**: 환자 경험·시술 운영·한국 임상·환자 교육
   - pillar-patch 발행 시 anchor별로 박힘 (anchor enum은 yhlinker backend가 condition 어휘만 정의)
   - 외부 권위가 다루는 결(역학 통계, CPG 권고)에는 자사 [^N] 박지 않음

F. **brand 노출 금지** — 안심튼튼/더웰스/권진열/박성진 + 자사 어조 (한국에서는/우리는/본원에서는)

G. **합쇼체 통일** — ~합니다/~됩니다

H. **Citations 헤딩 분리** — ### 자사 임상 자료 / ### 외부 권위 출처

I. **LOCK 조건** (linkbase_pillar_only_gate_v1.md K절):
   - external unique sources ≥5  (LOCK hard)
   - clinic pillar unique sources ≤2  (LOCK hard)
================================================================================
-->
---
layout: entity-hub
entity_id: <slug-here>
entity_type: symptom
permalink: /symptoms/<slug-here>/
title: <한국어 증상명>
title_en: <english symptom name>
description: <한 줄 요약, 30~80자>
aliases:
  - <별칭 1>
  - <영문 별칭 2>
last_reviewed: 'YYYY-MM-DD'
next_review: 'YYYY-MM-DD'
source_count: 0
source_count_external: 0
source_count_clinic_pillar: 0
clinic_footnote_ids: []
external_footnote_ids: []
locked: false
verified_by: <누가 검증했는지>
version: 1
---

## 정의

<!-- 증상의 임상 정의 + 환자 검색 진입점 성격 명시.
     "X는 단일 진단명이 아니라 부위·구조의 다양한 원인이 일으키는 임상 용어입니다." 톤. -->

## 흔한 원인

<!-- 원인 분류 — 부위·해부 구조·역학 비율로. 자녀 conditions entity로 link 분산.
     예 (팔꿈치):
     - 외측 (외측상과염·요골관 증후군·외측 측부인대) → [lateral-epicondylitis](../conditions/lateral-epicondylitis.md)
     - 내측 (내측상과염·척골신경병증·내측 측부인대) → [medial-epicondylitis](../conditions/medial-epicondylitis.md), [ulnar-neuropathy](../conditions/ulnar-neuropathy.md)
     - 전방 / 후방

     역학 통계 (예: GBD 2021, 한국 KNHANES)는 [^N] 외부 권위 출처로 받침. -->

## 레드플래그

<!-- ⚠️ 응급 신호 박스. SNNOOP10·AANS 마미증후군·AAFP 등 표준 체크리스트 그대로 인용.
     예:
     ⚠️ 다음 신호가 동반되면 빠른 평가가 필요합니다:
     - 외상 후 격렬한 통증·기능 마비 → 골절·인대 완전 파열 의심
     - 진행성 신경 결손 (감각 둔화, 근력 약화, 미세 운동 장애)
     - 발열·전신 증상 동반 → 감염성 관절염·골수염 의심
     - 종양 의심 (체중 감소·야간통·고령 환자) -->

## 평가

<!-- 임상 진찰이 1차. 영상은 감별·불응성·외상·운동선수 평가 시 보조.
     - 병력 청취 (발생 양상·악화 동작·동반 증상)
     - 신체 검사 (압통·가동범위·근력·신경학적 검사)
     - 영상검사 적응증 (ACR appropriateness criteria 등) -->

## 치료 옵션

<!-- 단계적 접근: 보존 → 약물 → 시술 → 수술.
     자녀 treatments entity로 link 분산.

     ### 보존 치료 (1차)
     - 활동 수정, 물리치료, 운동치료 → [exercise-therapy](../treatments/exercise-therapy.md)

     ### 약물 치료
     - NSAIDs·근이완제 등 → [anti-inflammatory-analgesics](../treatments/anti-inflammatory-analgesics.md)

     ### 시술
     - 신경차단술·PRP·ESWT 등 → [nerve-block-injection](../treatments/nerve-block-injection.md)

     ### 수술 (불응성)
     - 보존 치료 충분히 시도 후 잔존 증상 + 영상 소견 일치 시 검토

     ### 경과·예후
     - 자한정적 경과·재발률·만성화 패턴 -->

---

## 관련 임상 자료

<!-- 이 섹션은 _layouts/entity-hub.html이 _data/post_entity_map.json에서 자동 빌드.
     수동 작성 X. placeholder 헤딩만 남김. -->

---

## Citations

### 자사 임상 자료

<!-- pillar-patch 백필이 자동으로 채움. 빈 entity 작성 시점에는 비워두기. -->

### 외부 권위 출처

[^1]: <author>. <title>. *<journal>*. <year>;<vol>(<issue>):<pages>. PMID <pmid>. URL: <url>

[^2]: <author>. <title>. *<journal>*. <year>. DOI <doi>. URL: <url>

<!-- LOCK hard 조건: external_footnote_ids 길이 ≥ 5 -->

## Changelog

- YYYY-MM-DD v1: **신규 entity 발행** — <어떤 외부 권위 출처로 어떤 섹션을 받쳤는지>, source_count_external 0→N. <검증 라운드 반영 사항>.
