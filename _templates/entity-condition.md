<!--
================================================================================
Entity 형판 — condition (질환)
================================================================================

복제 방법:
  cp _templates/entity-condition.md conditions/<slug>.md

작성 규칙 (linkbase_pillar_only_gate_v1.md 룰 + yhlinker backend 명세 정합):

0. **anchor enum + H2 헤딩 매핑** (Entity Anchor Enum v1, 2026-05-20)
   wiki/decisions/entity_anchor_enum_v1.md 결정문 — yhlinker backend
   pillar-patch-proposer.service.ts ANCHOR_TO_HEADING_BY_TYPE.condition 와 일치.

   | anchor (영문)   | H2 헤딩 (한국어) | 필수 여부 |
   |-----------------|-----------------|-----------|
   | definition      | 정의           | 필수      |
   | pathophysiology | 병태           | 필수      |
   | symptoms        | 증상           | 필수      |
   | diagnosis       | 진단           | 필수      |
   | treatment       | 치료           | 필수      |
   | prognosis       | 예후           | 필수      |

   condition은 6개 모두 1:1 매핑 — 운영본 30+개 일관 준수.

1. **frontmatter 필수 필드 12개** (아래 frontmatter 그대로 채우기)
   - 기본 8개: entity_id / entity_type / permalink / title / title_en / description / last_reviewed / version / locked / source_count
   - footnote 4개: source_count_external / source_count_clinic_pillar / clinic_footnote_ids / external_footnote_ids
   - aliases, verified_by, next_review 권장

2. **본문 6섹션 H2(##) 헤딩 고정**: 정의 / 병태 / 증상 / 진단 / 치료 / 예후
   - md-body-patcher.service.ts:226 splitBody가 H2 기준 분할
   - pillar-patch-proposer.service.ts:52 ANCHOR_TO_HEADING이 이 한국어 이름과 매칭
   - 6섹션 외 추가 H2(예: "관련 임상 자료") 허용. H3 이하는 해당 H2 섹션 body에 포함

3. **footnote ID는 숫자만** (`[^1]` `[^2]` ...). 명명형(`[^p1]`/`[^e1]`/`[^clinic-1]`) 금지
   - kramdown 2.4 GFM 모드에서 자동 재번호로 렌더 깨짐
   - estimateNextFootnoteId가 `\[\^(\d+)\]:` 정규식으로 숫자만 추출

4. **자사 [^N] 본문 박힘 = pillar 글만** (spoke 금지)
   - anchor 2~3개에만 박힘 (anchor 1개 = anchor enum 1개, 같은 anchor 안에서는 누적 가능)
   - pillar-patch-proposer가 발행 시점에 patch 제안 → 마케팅 탭 Anchor Review에서 승인
   - 형판에서는 외부 권위 [^N]만 박고, 자사 [^N] 자리는 비워둠 (백필 흐름이 채움)

5. **자사 [^N]은 외부 권위가 안 다루는 결만**:
   - 환자 경험 묘사 / 시술 운영 / 한국 임상 환경 / 환자 교육
   - 정의/병태 메커니즘, RCT evidence, 가이드라인 권고에는 자사 [^N] 박지 않음

6. **brand/병원/의사명 본문 등장 금지** (deterministic detector 차단)
   - 안심튼튼/더웰스/권진열/박성진/ansimpainfree/linkare/linkerai/thewells
   - "한국에서는/우리는/본원에서는/저희 병원/국내에서는" 같은 자사 어조 금지

7. **합쇼체 통일** — `~합니다/~됩니다`로 작성. `~한다/~된다/~이다/~있다/~없다` 같은 ~다체 금지

8. **Citations 섹션 헤딩 분리**:
   ## Citations
   ### 자사 임상 자료     ← clinic_footnote_ids 정의 영역
   ### 외부 권위 출처    ← external_footnote_ids 정의 영역

9. **LOCK 조건** (linkbase_pillar_only_gate_v1.md K절):
   - external unique sources ≥5  (LOCK hard)
   - clinic pillar unique sources ≤2  (LOCK hard)
   - clinic inline occurrence ≤30% (warning), ≤40% (block)

10. **`## 관련 임상 자료` 섹션은 자동 빌드**:
    - _data/post_entity_map.json + sub_topic_type 분류로 _layouts/entity-hub.html이 카테고리당 최신 3개 박음
    - 형판은 헤딩 placeholder만 남겨둠 (수동 작성 X)
================================================================================
-->
---
layout: entity-hub
entity_id: <slug-here>
entity_type: condition
permalink: /conditions/<slug-here>/
title: <한국어 질환명>
title_en: <english condition name>
description: <한 줄 요약, 30~80자>
aliases:
  - <별칭 1>
  - <별칭 2 (영문)>
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

<!-- 외부 권위 출처 1~2개로 받친 정의. 외부 출처가 다루는 결.
     예: "X 질환은 ...이며, ICD-10 ...로 분류됩니다 [^1]." -->

## 병태

<!-- 발생 기전, 위험 요인. 외부 review/CPG로 받침.
     ### 위험 요인 으로 하위 분리 가능. -->

## 증상

<!-- 주요 증상 + 동반 증상. 외부 권위 또는 임상 review로 받침.
     자사 [^N]은 박지 않음 — pillar-patch가 anchor='symptoms'일 때 보강될 자리. -->

## 진단

<!-- 임상 진단 vs 영상 검사 위계. CPG/가이드라인 인용.
     ### 감별 진단 으로 하위 분리 가능. -->

## 치료

<!-- 보존/주사/시술/수술 단계. CPG/메타분석/SR 인용.
     자사 [^N]은 박지 않음 — pillar-patch가 anchor='treatment'일 때 보강될 자리. -->

## 예후

<!-- 자한정적 경과·재발률·만성화 패턴. 외부 review 인용.
     자사 [^N]은 박지 않음 — pillar-patch가 anchor='prognosis'일 때 보강될 자리. -->

→ <related-treatment-slug>, <related-condition-slug> 참조 <!-- 선택 -->

---

## 관련 임상 자료

<!-- 이 섹션은 _layouts/entity-hub.html이 _data/post_entity_map.json에서 자동 빌드.
     수동 작성 X. placeholder 헤딩만 남김.
     pillar-patch 흐름에서 자사 [^N] footnote 정의가 본문 섹션 안에 박힐 수도 있음
     (md-body-patcher.service.ts:81-95 F3 — section-local footnote 허용). -->

---

## Citations

### 자사 임상 자료

<!-- pillar-patch 백필이 자동으로 채움. 빈 entity 작성 시점에는 비워두기.
     예시 (백필 후):
     [^7]: [안심튼튼 — 글 제목](https://ansimpainfree.kr/blog/slug)
-->

### 외부 권위 출처

[^1]: <author>. <title>. *<journal>*. <year>;<vol>(<issue>):<pages>. PMID <pmid>. URL: <url>

[^2]: <author>. <title>. *<journal>*. <year>. DOI <doi>. URL: <url>

<!-- LOCK hard 조건: external_footnote_ids 길이 ≥ 5 -->

## Changelog

- YYYY-MM-DD v1: 신규 entity 발행 — <어떤 외부 권위 출처로 어떤 섹션을 받쳤는지>, source_count_external 0→N. <주요 변경 사항>.
