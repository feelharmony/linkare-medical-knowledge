---
layout: entity-hub
entity_id: hair-loss
entity_type: symptom
permalink: /symptoms/hair-loss/
title: 탈모
description: 모발이 비정상적으로 빠지거나 가늘어지는 증상 — 원인·패턴에 따라 여러 유형으로 분류
title_en: hair loss / alopecia
aliases:
  - 탈모
  - 머리 빠짐
  - hair loss
  - alopecia
  - hair thinning
last_reviewed: '2026-05-03'
source_count: 1
version: 4
---

## 정의·overview
탈모(hair loss, alopecia)는 모발이 비정상적으로 빠지거나 가늘어지는 증상을 통칭하는 용어입니다. **단일 진단명이 아니라 원인·패턴에 따라 여러 유형으로 분류**되는 임상 카테고리입니다. 환자 입장에서는 "머리가 빠진다"는 호소로 시작되며, 유형별로 병태·진단·치료가 다르므로 정확한 진단을 받는 것이 첫 단계입니다.

## 분류

탈모는 모낭의 손상 여부에 따라 크게 **비반흔성**과 **반흔성**으로 나뉩니다.

### 비반흔성 탈모 (non-scarring) — 모낭 보존
- **안드로겐성 탈모(AGA, androgenetic alopecia)** — 안드로겐·유전 요인. 가장 흔한 유형, 진행성 → [androgenetic-alopecia](../conditions/androgenetic-alopecia.md)
- **원형 탈모(alopecia areata, AA)** — 자가면역. 갑작스러운 원형 탈모반, 자연 회복도 흔함 → [alopecia-areata](../conditions/alopecia-areata.md)
- **휴지기 탈모(telogen effluvium)** — 분만·수술·심한 스트레스·약물·갑상선 등 유발 요인 후 일시적 전반 탈모. 보통 6~12개월 내 회복
- **견인성 탈모(traction alopecia)** — 머리 묶기·헤어스타일에 의한 만성 견인
- **발모벽(trichotillomania)** — 모발 뽑기 행동

### 반흔성 탈모 (scarring / cicatricial) — 모낭 영구 손상
편평태선 모낭염, 원판상 홍반루푸스, 만성 모낭염 등이 모낭을 파괴해 영구 탈모로 진행됩니다. 조기 진단·치료가 핵심이며, 본 entity의 자세한 다룸은 의뢰 영역입니다.

### 기타
- 감염성 탈모(두부 백선 등)
- 약물·항암 치료에 의한 탈모(anagen effluvium)
- 영양 결핍·전신 질환 동반 탈모

## 진단 흐름
1. **탈모 패턴 평가** — 이마선·정수리(AGA 의심) vs 가르마(여성형 AGA) vs 원형 탈모반(AA) vs 전반 탈락(휴지기 탈모) vs 흉터·홍반(반흔성)
2. **병력** — 가족력, 발병 시기, 동반 증상, 약물·식이·스트레스, 갑상선·자가면역 병력
3. **두피·모발 검사** — trichoscopy로 모발 굵기 변이·황색점·흑색점 등 sign 확인
4. **혈액 검사 (선택)** — 갑상선 기능, 페리틴, 비타민D, 호르몬 등 필요 시
5. **두피 조직 검사 (선택)** — 반흔성 탈모 의심 또는 진단이 애매할 때

## 치료 옵션 영역
유형별로 자세한 치료는 해당 disease/treatment entity로 이어집니다.

- **약물 치료** (미녹시딜·5ARI 등) → [hair-loss-medication](../treatments/hair-loss-medication.md)
- **PRP 두피 주사** → [prp-injection](../treatments/prp-injection.md)
- **줄기세포 두피 주사** → [stem-cell-therapy](../treatments/stem-cell-therapy.md)
- **엑소좀 두피 주사** → [exosome-therapy](../treatments/exosome-therapy.md)
- **모발 이식** — 외과적 영역, 본 entity의 evidence 정리 범위 외

## 언제 진료를
- 일정 기간(약 3~6개월) 이상 지속되는 모발 손실
- 갑작스러운 원형·다발성 탈모반
- 반흔·홍반·통증을 동반하는 탈모 → 반흔성 탈모 가능성, **빠른 평가가 필요**
- 어린이·청소년의 탈모
- 전신 증상(피로·체중 변화·생리 이상 등) 동반 시 — 갑상선·자가면역 등 평가 필요

탈모는 외관 변화로 우울·불안·사회적 위축을 동반할 수 있어, 의료진과 함께 진단·치료뿐만 아니라 심리적 지원도 함께 검토하는 것이 권장됩니다. 임상 현장에서 환자별로 약물·시술·생활 관리(스트레스·수면·식이)를 조합한 맞춤 전략이 검토됩니다[^1].

---

## Citations
[^1]: [thewellsr.kr/blog/hair-loss-regeneration-injection-treatment](https://thewellsr.kr/blog/hair-loss-regeneration-injection-treatment)

## Changelog
- 2026-05-03 v4: **canonical "탈모" hub를 symptom entity로 결정** — 탈모는 환자 호소(symptom) 성격이 강해 conditions/hair-thinning 삭제하고 symptoms/hair-loss로 통합. 분류 hub 본문 이전(비반흔성/반흔성·진단 흐름 5단계·치료 옵션 link). conditions/hair-thinning은 같은 commit에서 삭제. data/entities.json·post-entity-map.json에서 hair-thinning entry 정리, hair 글의 primary_entity_id를 hair-loss로 통합. AGA·AA·treatment entity의 hair-thinning link → hair-loss로 정정. aliases에 hair thinning 흡수.
- 2026-05-03 v3: 짧은 증상 entity 정리(legacy 정리, source_count 0→1, hub link 안내) — v4에서 본격 hub로 승급
- 2026-04-23 v2: 정의·흔한 원인·치료 옵션·평가 4섹션 (자체 글 1건 기반)
