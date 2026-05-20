<!--
================================================================================
Entity 형판 — body-part (부위)
================================================================================

복제 방법:
  cp _templates/entity-body-part.md body-parts/<slug>.md

기반 운영본:
  - body-parts/elbow.md (locked, source_count 1, 4섹션 schema)
  - body-parts/cervical-spine.md (locked X, source_count 0, 4섹션 frontmatter only)
  - body-parts/shoulder.md (source_count 0, 4섹션 frontmatter only)

▼ anchor enum + H2 헤딩 매핑 (Entity Anchor Enum v1, 2026-05-20)

wiki/decisions/entity_anchor_enum_v1.md 결정문 — yhlinker backend
pillar-patch-proposer.service.ts ANCHOR_TO_HEADING_BY_TYPE.body_part 와 일치.

| anchor (영문)         | H2 헤딩 (한국어) | 필수 여부 |
|-----------------------|-----------------|-----------|
| definition            | 정의           | 필수      |
| related_symptoms      | 관련 증상      | 필수      |
| related_conditions    | 관련 질환      | 필수      |
| related_treatments    | 관련 치료      | 필수      |

운영본 3개 (elbow, cervical-spine, shoulder) 일관 준수.

▼ body-part 특성 차이

A. **광역 진입점 (광범위 검색 색인)**:
   - body-parts는 부위명만으로 검색하는 환자 진입점 — "허리", "목", "어깨", "팔꿈치" 등
   - 깊은 임상 정보는 conditions/symptoms/treatments entity로 link 분산
   - linkbase_pillar_only_gate_v1.md:53-56 (D2 폐기 — body-parts entity 본문에도 자사 [^N] 박힘 허용,
     body-parts/symptoms는 외부 권위 [^N] 최소 3개 권장)

B. **본문 4섹션 H2(##) 헤딩 고정**: 정의 / 관련 증상 / 관련 질환 / 관련 치료
   - "정의"는 해부학 + 간단한 기능 (1~2 문단)
   - "관련 증상"은 symptoms entity 목록 (자녀 link만, 본문 설명 X)
   - "관련 질환"은 conditions entity 목록
   - "관련 치료"는 treatments entity 목록

C. **자녀 entity link 중심 구조**:
   - body-part 본문은 자녀 entity로 link 분산하는 광범위 인덱스 역할
   - "정의" 섹션 외에는 거의 link로만 구성됨
   - 본문 깊이는 condition/treatment보다 얕음

D. **frontmatter 12필드** + footnote 추적 4필드 — entity-condition.md 형판과 동일

E. **자사 [^N] 결**: body-parts는 광역 진입점이라 자사 footnote 박힘 빈도 낮음
   - 환자 경험·시술 운영·한국 임상·환자 교육 결만 허용
   - 외부 권위가 다루는 결(해부학 표준)에는 자사 [^N] 박지 않음

F. **brand 노출 금지** — 안심튼튼/더웰스/권진열/박성진 + 자사 어조

G. **합쇼체 통일** — ~합니다/~됩니다

H. **Citations 헤딩 분리** — ### 자사 임상 자료 / ### 외부 권위 출처

I. **LOCK 조건** (linkbase_pillar_only_gate_v1.md K절):
   - external unique sources ≥5  (LOCK hard) — body-parts는 권장 ≥3
   - clinic pillar unique sources ≤2  (LOCK hard)

J. **`robots: noindex, follow` 처리**:
   - 본문이 얇은 빈 스텁 body-parts는 검색 노출 차단 (knee/lumbar-spine/wrist 패턴)
   - 풀스펙 발행 시 frontmatter에서 robots 필드 제거
================================================================================
-->
---
layout: entity-hub
entity_id: <slug-here>
entity_type: body_part
permalink: /body-parts/<slug-here>/
title: <한국어 부위명>
title_en: <english body part name>
description: <한 줄 요약 — 해부학적 위치·기능, 30~80자>
aliases:
  - <별칭 1>
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

<!-- 해부학적 위치 + 구성 요소 + 핵심 기능. 1~2 문단.
     외부 권위 출처 (Gray's Anatomy, AAOS 환자 정보 등) 인용 가능. -->

## 관련 증상

<!-- 이 부위에서 환자가 호소하는 증상 목록. symptoms entity로 link 분산.
     본문 설명은 최소화 — 자녀 entity로 넘김.

     예 (팔꿈치):
     - [팔꿈치 통증](../symptoms/elbow-pain.md) — 외측·내측·전방·후방 4영역 통증
     - [팔 저림](../symptoms/arm-numbness.md) — 척골신경·정중신경 압박
-->

## 관련 질환

<!-- 이 부위에서 흔히 발생하는 질환 목록. conditions entity로 link 분산.

     예 (팔꿈치):
     - [외측상과염](../conditions/lateral-epicondylitis.md) — 테니스엘보
     - [내측상과염](../conditions/medial-epicondylitis.md) — 골프엘보
     - [큐비탈 터널 증후군](../conditions/cubital-tunnel-syndrome.md)
-->

## 관련 치료

<!-- 이 부위에 적용되는 시술·치료 목록. treatments entity로 link 분산.

     예 (팔꿈치):
     - [신경차단술](../treatments/nerve-block-injection.md)
     - [PRP 주사](../treatments/prp-injection.md)
     - [체외충격파(ESWT)](../treatments/eswt.md)
-->

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

<!-- LOCK hard 조건: external_footnote_ids 길이 ≥ 5 (body-parts는 권장 ≥3) -->

## Changelog

- YYYY-MM-DD v1: **신규 entity 발행** — <어떤 외부 권위 출처로 어떤 섹션을 받쳤는지>, source_count_external 0→N. <검증 라운드 반영 사항>.
