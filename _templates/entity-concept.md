<!--
================================================================================
Entity 형판 — concept (웰니스/기능/대사 개념)
================================================================================

복제 방법:
  mkdir -p concepts
  cp _templates/entity-concept.md concepts/<slug>.md

작성 규칙:
1. entity_type은 concept으로 둔다.
2. concept_group에 따라 H2 스키마가 달라진다. scripts/lint-entity.js가 강제한다.
3. 웰니스 글도 자유형 홍보문이 아니라 구조형 지식으로 쓴다.
4. 모든 concept에 "통증과의 관련성"을 억지로 넣지 않는다.
5. "한계/주의점"을 과하게 반복하지 않고, concept에서는 주로 "해석과 한계"로 claim boundary를 잡는다.
6. 병원명/의사명/브랜드명은 본문에 쓰지 않고, 필요하면 Citations/관련 임상 자료 footnote로만 남긴다.

concept_group별 H2:

pain_wellness:
  정의 / 통증과의 관련성 / 관련 기전 / 평가 / 관리 접근 / 해석과 한계

general_wellness:
  정의 / 흔한 양상 / 관련 요인 / 평가 / 관리 접근 / 해석과 한계

metabolism:
  정의 / 생리적 역할 / 관련 상태 / 평가 지표 / 관리 접근 / 해석과 한계

lifestyle:
  정의 / 적용 대상 / 핵심 원칙 / 실천 방법 / 평가 기준 / 무리하지 않아야 할 상황
================================================================================
-->
---
layout: entity-hub
entity_id: <slug-here>
entity_type: concept
concept_group: general_wellness # pain_wellness | general_wellness | metabolism | lifestyle
permalink: /concepts/<slug-here>/
title: <한국어 개념명>
title_en: <english concept name>
description: <한 줄 요약, 30~80자>
aliases: []
last_reviewed: 'YYYY-MM-DD'
next_review: 'YYYY-MM-DD'
source_count: 0
source_count_external: 0
source_count_clinic_pillar: 0
clinic_footnote_ids: []
external_footnote_ids: []
locked: false
verified_by: <누가 검토했는지>
version: 1
---

<!-- 아래 H2는 concept_group=general_wellness 기준입니다.
     다른 group이면 위 H2 목록에 맞게 바꿔야 합니다. -->

## 정의

<!-- 개념의 의미를 설명합니다. 질환/진단명인지, 상태 설명인지, 생리 개념인지 구분합니다. -->

## 흔한 양상

<!-- 환자/일상에서 관찰되는 양상. 특정 치료 효과처럼 쓰지 않습니다. -->

## 관련 요인

<!-- 수면, 활동량, 영양, 스트레스, 대사, 호르몬 등 관련 요인을 정리합니다. -->

## 평가

<!-- 병원/의료진이 확인할 수 있는 질문·지표·상황. 단정적 진단 문구는 피합니다. -->

## 관리 접근

<!-- 생활, 수면, 운동, 영양, 의학적 평가 등 접근을 보수적으로 정리합니다. -->

## 해석과 한계

<!-- 이 개념을 어디까지 이해할 수 있는지. 과장 claim을 막되 방어문처럼 과하게 쓰지 않습니다. -->

## Citations

### 자사 임상 자료

### 외부 권위 출처

## Changelog

- YYYY-MM-DD: v1 생성.
