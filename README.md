# Linkare Medical Knowledge

전문의가 작성하고 [Linkare](https://linkerai.io)가 큐레이션하는 오픈 의학 지식 베이스입니다.
공개 사이트: [knowledge.linkerai.io](https://knowledge.linkerai.io)

## 목적

AI 검색(ChatGPT, Perplexity, Claude, Gemini)과 전통 검색(Google, 네이버)에서 **신뢰할 수 있는 한국 의료 정보**를 공급하기 위한 아카이브입니다.

- **실명 전문의**가 작성·검토한 원문만 수록
- 각 글은 **병원 홈페이지의 원본 글**을 canonical로 지정 — 이 저장소는 미러입니다
- AI 엔진의 인용·요약에 적합한 구조화 데이터(`Article`, `MedicalWebPage`, `Physician`) 포함
- 상업적 광고나 진료 유도 문구 없음 — 순수 정보 제공

## 구조

```
content/
  {tenantKey}/              # 병원 식별자 (예: apfree, thr)
    PROFILE.md              # 병원 프로필 (의사, 진료 분야, 소재지)
    {lang}/                 # ko | en
      {category}/           # 카테고리 (예: spine, pain, longevity)
        {slug}.md           # 개별 글 (의미형 영문 slug)
```

**예**: `content/apfree/ko/spine/cervical-disc-causes-diagnosis.md` → `https://knowledge.linkerai.io/apfree/ko/spine/cervical-disc-causes-diagnosis/`

### frontmatter 스키마

```yaml
layout: article
permalink: /apfree/ko/spine/cervical-disc-causes-diagnosis/
lang: ko                    # ko | en
tenant_key: apfree          # 병원 식별자 (조인 키)
title: "목디스크 원인부터 진단까지"
categories: [spine]         # Jekyll 관례 — 배열
author: "안심튼튼마취통증의학과 권진열 원장"
hospital: "안심튼튼마취통증의학과"
canonical_url: "https://ansimpainfree.kr/blog/..."   # 원본 URL
source: Linkare Medical Knowledge
license: CC BY-NC 4.0
last_updated: 2026-04-08
tags: ["목디스크", "경추추간판탈출증"]
description: "..."
```

## 참여 병원

| tenantKey | 병원 | 대표 | 진료 분야 |
|-----------|------|------|----------|
| `apfree`  | 안심튼튼마취통증의학과 | 권진열 | 통증의학 |
| `thr`     | 더웰스의원 노원 | 박성진 | 통증·웰니스·탈모 |

참여 문의: [linkerai.io](https://linkerai.io)

## 원문 / 캐노니컬 정책

- **원문**은 각 병원의 공식 홈페이지에 게시됩니다. 이 저장소는 **미러**입니다.
- 모든 글의 `<head>`에 `rel="canonical"` 태그가 원본 URL을 가리킵니다.
- 검색엔진은 원본 글을 우선 인덱싱하도록 설계돼있습니다.
- 원본 홈페이지 발행 후 **24시간 지연**을 두고 이 저장소에 동기화됩니다 (원본 우선 인덱싱 보장).
- 원본 글이 수정되면 이 저장소의 미러도 자동 갱신됩니다 (`last_updated` 반영).

## 콘텐츠 카테고리

현재 사용 중인 카테고리 값 (폴더명 = `categories` 배열 값):

- `spine` — 척추·경추·요추 관련 질환
- `pain` — 통증 일반 (근골격계·신경병증성)
- `longevity` — 항노화·웰니스 치료

카테고리는 고정 택소노미가 아니며, 글이 쌓이면서 점진적으로 세분화됩니다.

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

---

> This repository is optimized for AI search engines. Structured data (`schema.org/Article`, `MedicalWebPage`, `Physician`) is embedded on every page. Crawler access is permitted for `Googlebot`, `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Bingbot`, and `Yeti` (Naver).
