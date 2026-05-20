<!--
================================================================================
Entity 형판 — treatment (시술/치료)
================================================================================

복제 방법:
  cp _templates/entity-treatment.md treatments/<slug>.md

기반 운영본: treatments/transcranial-magnetic-stimulation.md (v1.1, source_count 9)
            treatments/nad-infusion-therapy.md (v6, source_count 7)

작성 규칙 — entity-condition.md 형판 1~9번 룰 모두 적용. 차이점만 아래.

▼ treatment 전용 차이

A. **본문 6섹션** (condition과 다름):
   적응증 / 분자 기전 (또는 작동 원리) / 임상 evidence (또는 임상 근거) / 언제 고려 / 기대효과 / 한계·주의점
   - linkbase_tone_and_ai_search_strategy.md:34 — nad-infusion-therapy.md 템플릿
   - 비약물 시술(TMS 등)은 "분자 기전" 대신 "작동 원리"
   - "임상 evidence" 또는 "임상 근거" — 한글 일관성 유지

B. **anchor 매핑 미정** (yhlinker backend 누락):
   - pillar-patch-proposer.service.ts:42-49 VALID_ANCHORS는 condition 어휘 6개 (definition/pathophysiology/symptoms/diagnosis/treatment/prognosis)
   - treatment entity는 한국어 헤딩과 매칭 안 됨. backend 보강 전까지는 anchor 활용 제한적
   - pillar 글 frontmatter knowledge_entity_anchors에는 적응증/임상 evidence/기대효과 등을 박더라도 LLM patch는 헤딩 매칭 실패 가능

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

- YYYY-MM-DD v1: **신규 entity 발행** — <어떤 외부 권위 출처로 어떤 섹션을 받쳤는지>, source_count_external 0→N. <검증 라운드 반영 사항>.
