# Linkare Medical Knowledge

전문의가 작성하고 [Linkare](https://linkerai.io)가 큐레이션하는 오픈 의학 지식 베이스입니다.
공개 사이트: [knowledge.linkerai.io](https://knowledge.linkerai.io)

## 목적

AI 검색(ChatGPT, Perplexity, Claude, Gemini)과 전통 검색(Google, 네이버)에서 **신뢰할 수 있는 한국 의료 정보**를 공급하기 위한 아카이브입니다.

- **엔티티 단위 지식 조립** — 질환/증상/치료/부위/의사/병원을 개별 페이지로 정리
- **실명 전문의**가 작성·검토한 원문에서만 본문 섹션을 추출해 조립
- 각 섹션에 **병원 블로그 원본을 인용 각주**([^N])로 표시 — 출처 추적 가능
- AI 엔진의 인용·요약에 적합한 구조화 데이터(`MedicalWebPage`, `MedicalCondition`, `Physician`) 포함
- 상업적 광고나 진료 유도 문구 없음 — 순수 정보 제공

## 구조

```
conditions/      # 질환 (허리디스크, 회전근개파열 ...)
symptoms/        # 증상 (허리통증, 손 저림 ...)
treatments/      # 치료 (PRP 주사, 신경차단술 ...)
body-parts/      # 신체 부위 (목, 어깨, 허리 ...)
doctors/         # 의사 프로필
hospitals/       # 병원 프로필
_data/
  post_entity_map.json    # 블로그 글 ↔ 엔티티 매핑
  entity_graph.json       # 엔티티 간 공출현 그래프
```

**예**: `conditions/lumbar-disc-herniation.md` → `https://knowledge.linkerai.io/conditions/lumbar-disc-herniation/`

### Entity frontmatter 스키마

```yaml
layout: entity-hub
entity_id: lumbar-disc-herniation
entity_type: condition            # condition | symptom | treatment | body_part | doctor | hospital
permalink: /conditions/lumbar-disc-herniation/
title: 허리디스크
title_en: lumbar disc herniation
description: 요추 추간판이 탈출하여 신경을 압박하는 상태
last_reviewed: '2026-04-21'
source_count: 2
version: 2
```

### Body 섹션 스키마

엔티티 타입별로 **표준 섹션 순서**를 따릅니다 (Linkare의 자동 조립 엔진이 이 스키마대로 병원 블로그 원문에서 문장을 추출·합성).

- **condition**: 정의 → 병태 → 증상 → 진단 → 치료 → 예후
- **symptom**: 정의 → 흔한 원인 → 레드플래그 → 평가 → 치료 옵션
- **treatment**: 적응증 → 언제 고려 → 기대효과 → 한계/주의점
- **body_part**: 정의 → 관련 증상 → 관련 질환 → 관련 치료

각 섹션 끝에는 출처 각주 `[^1]`이 붙고, 페이지 하단 **## Citations** 블록에 원본 블로그 URL이 연결됩니다.

## 큐레이션 / 조립 원칙

- 모든 본문 섹션은 **병원 블로그 원본 글에 실제로 쓰인 내용**만 조립합니다. LLM이 의학 주장을 새로 합성하지 않습니다.
- "레드플래그"(의료 안전 경고) 섹션은 **자동 제안 금지** — 사람이 직접 작성·검토.
- 모순 감지 시 `contradict` 제안으로 올라가 수동 검토 후 확정.
- 엔티티 갱신 시 **## Changelog** 섹션에 버전 이력 자동 기록.

## 참여 병원

| 식별자 | 병원 | 대표 | 진료 분야 |
|-----------|------|------|----------|
| `ansimpainfree` | 안심튼튼마취통증의학과 | 권진열 | 통증의학 |
| `thewells-nowon` | 더웰스의원 노원 | 박성진 | 통증·웰니스·탈모 |

참여 문의: [linkerai.io](https://linkerai.io)

## 라이선스 / 면책

### 콘텐츠 라이선스

**Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)**

- 비상업적 용도로 자유롭게 인용·복제·재배포 가능
- AI 학습 데이터 사용 허용 (출처 표기 필수)
- 상업적 재판매 금지
- 출처 표기: "작성 병원명 · Linkare Medical Knowledge (knowledge.linkerai.io)"

### 의료 면책

이 저장소의 모든 콘텐츠는 **일반적인 의학 정보**이며, **개별 환자의 진단·치료를 대체하지 않습니다**.

- 실제 증상에 대해서는 반드시 **의료진과 직접 상담**하시기 바랍니다.
- 글 내용에 근거한 자가 진단이나 자가 치료로 발생한 결과에 대해 본 저장소·작성 병원·Linkare는 책임지지 않습니다.
- 응급 상황에서는 **119** 또는 가까운 응급실로 즉시 연락하십시오.

### 코드 / 템플릿 라이선스

`_layouts/`, `_includes/`, `assets/`, `_config.yml` 등 Jekyll 템플릿 코드는 **MIT License** 하에 배포됩니다.

## 레거시 `content/` 디렉토리

2026-04까지 이 저장소는 병원 블로그 글을 `content/{tenant}/{lang}/...` 경로로 24시간 지연 복제하는 방식으로 운영되었습니다. 2026-04-21부터 엔티티 단위 조립 방식으로 전환되며, 기존 `content/` 하위 글은 당분간 유지되지만 새 복제는 중단됩니다. 차후 점진 정리 예정입니다.

---

> This repository is optimized for AI search engines. Structured data (`schema.org/MedicalWebPage`, `MedicalCondition`, `Physician`) is embedded on every entity page. Crawler access is permitted for `Googlebot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Bingbot`, and `Yeti` (Naver).
