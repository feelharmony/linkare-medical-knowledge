<!--
================================================================================
Entity 형판 — treatment (시술/치료)
================================================================================

복제 방법:
  cp _templates/entity-treatment.md treatments/<slug>.md

기반 운영본:
  - treatments/transcranial-magnetic-stimulation.md (v1.1, source_count 9, 옵션 C 표준 6섹션)
  - treatments/nad-infusion-therapy.md (v6, source_count 7, 옵션 C 표준 6섹션)
  - treatments/eswt.md (옵션 B 시술 표준 7섹션)
  - treatments/exercise-therapy.md (옵션 A 간소화 4섹션)

작성 규칙 — entity-condition.md 형판 1~9번 룰 모두 적용. 차이점만 아래.

▼ treatment 전용 차이

A. **anchor enum + H2 헤딩 매핑** (Entity Anchor Enum v1, 2026-05-20)
   wiki/decisions/entity_anchor_enum_v1.md 결정문 — yhlinker backend
   pillar-patch-proposer.service.ts ANCHOR_TO_HEADING_BY_TYPE.treatment 와 일치.

   treatment는 운영본 28개가 6패턴으로 정착되어 단일 헤딩 강제 불가.
   anchor enum 6개 (필수 2 + 선택 4) + 동의어 그룹 H2 헤딩으로 흡수:

   | anchor (영문)     | H2 헤딩 동의어 그룹                                                              | 필수 여부 |
   |-------------------|--------------------------------------------------------------------------------|-----------|
   | indication        | 적응증 / 정의·종류 / 정의·개요 / 정의·overview / 적응증·접종 권고                   | 필수     |
   | mechanism         | 분자 기전 / 작동 원리 / 작용 기전 / 정의·기전 / 정의 / 작용 기전·근거               | 선택     |
   | evidence          | 임상 evidence / 임상 근거 / 근거 요약 / 약물별 evidence                           | 선택     |
   | when_considered   | 언제 고려                                                                       | 선택     |
   | expected_effect   | 기대효과                                                                        | 선택     |
   | limitations       | 한계/주의점 / 한계·주의점 / 부작용·주의사항 / 부작용·금기 / 부작용·주의 환자군 / 약물과 시술의 관계 | 필수     |

   pillar-patch가 blog의 knowledge_entity_anchors 에서 anchor 받아
   본문에 있는 동의어 그룹 첫 매치 헤딩으로 patch 적용.

B. **추천 패턴 — 옵션 C 표준 6섹션** (이 형판 기본 골격, TMS/NAD+ 패턴):
   적응증 / 분자 기전(또는 작동 원리) / 임상 evidence(또는 임상 근거) / 언제 고려 / 기대효과 / 한계·주의점

   운영본 다른 변형 (옵션 A 간소화, 옵션 B 시술, 옵션 D 카테고리)도 anchor enum
   동의어 그룹으로 자동 매칭됨 — 신규 entity는 추천 패턴부터 시작 권장.

C. **하위 섹션 (H3)**:
   - 임상 evidence는 적응증별로 ### 만성 통증 / ### 두통 / ### 불면 같이 분할 가능 (TMS 패턴)
   - 한계·주의점은 ### 근거의 한계 / ### 부작용·금기 / ### 환자 안내 / ### 다른 치료와의 병행 (TMS 패턴)

D. **환자 맥락·회복·생활습관**:
   - linkbase_tone_and_ai_search_strategy.md:35 — 별도 "Wellness Layer" 섹션 만들지 말 것
   - 적응증·기대효과 섹션에 자연스럽게 녹임
================================================================================
-->
---
layout: entity-hub
entity_id: <slug-here>
entity_type: treatment
permalink: /treatments/<slug-here>/
title: <한국어 시술명>
title_en: <english treatment name>
description: <한 줄 요약, 30~80자>
aliases:
  - <약어/별칭 1>
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

## 적응증

<!-- 어떤 환자군에서 어떤 적응증에 검토되는지. 외부 권위 (가이드라인/CPG)로 받침.
     "본 문서는 X를 중심으로 다루며..." 같은 메타 안내 1줄 허용.
     적응증별 ### 하위 분할 가능 (예: ### 만성 통증 / ### 두통 / ### 불면). -->

### <적응증 카테고리 1>

<!-- 메타분석/SR/CPG 인용 [^N]. -->

### <적응증 카테고리 2>

## 분자 기전

<!-- 약물·시술 작동 메커니즘. 비약물 시술이면 "## 작동 원리"로 대체.
     자극 부위·주파수·표적 회로 등 기술적 디테일. -->

## 임상 evidence

<!-- 메타분석/SR/RCT 단위 외부 출처. 효과 크기(SMD/MD/WMD) + 95% CI + 표본 수 명시.
     적응증별 ### 하위 분할 권장. -->

### <카테고리별 1>

- **<연구 이름>** (저자 등, *저널* 년도, RCT N건 n=숫자): <효과 크기·95% CI·결론>[^N]

## 언제 고려

<!-- 환자군 분류. 약물 반응 부족 / 약물 부작용 / 만성화 / 가이드라인 권고 적응증 등.
     외부 권위 가이드라인 Level 분류 (A/B/C) 인용 가능. -->

## 기대효과

<!-- 효과 크기·지속 기간·환자별 차이. 메타분석 수치 + 임상적 의미 vs 통계적 유의성 구분.
     "단일 치료로 모든 증상이 호전되는 것은 아니며..." 톤. -->

## 한계/주의점

### 근거의 한계

<!-- 적응증별 근거 강도 차이, 효과 지속 한계, 표준화 진행 단계 등. -->

### 부작용·금기

<!-- 흔한 부작용 / 드문 심각 부작용 / 절대 금기 / 상대 금기. -->

### 환자 안내

<!-- 시술 전 의료진에게 알려야 할 것, 세션 일정, 시술 후 회복. -->

### 다른 치료와의 병행

<!-- 약물·물리치료·도수치료 등 기존 치료와의 단계적 결합 흐름. -->

---

## 관련 임상 자료

<!-- _layouts/entity-hub.html이 _data/post_entity_map.json에서 자동 빌드.
     수동 작성 X. -->

---

## Citations

### 자사 임상 자료

<!-- pillar-patch 백필이 자동으로 채움. 빈 entity 작성 시점에는 비워두기. -->

### 외부 권위 출처

[^1]: <author>. <title>. *<journal>*. <year>;<vol>(<issue>):<pages>. PMID <pmid>. DOI <doi>. URL: <url>

[^2]: <author>. <title>. *<journal>*. <year>. DOI <doi>. URL: <url>

## Changelog

- YYYY-MM-DD v1: 신규 entity 발행 — <어떤 외부 권위 출처로 어떤 섹션을 받쳤는지>, source_count_external 0→N. <주요 변경 사항>.
