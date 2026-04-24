# 파일 인덱스 및 설명

## 📂 디렉토리 구조

```
/sessions/vibrant-wonderful-ramanujan/mnt/modupantasy/
├── 📄 프론트엔드 (Front-end)
│   ├── index.html (5000+ 줄)
│   ├── terms-of-service.html
│   ├── privacy-policy.html
│   ├── payment-policy.html
│   ├── ai-creation-terms.html
│   └── marketing-consent.html
│
├── 🔧 백엔드 (Back-end)
│   └── edge-functions/
│       ├── authenticate-toss-user.ts
│       ├── create-project.ts
│       ├── get-projects.ts
│       ├── update-episode.ts
│       └── save-chat-history.ts
│
└── 📚 문서 (Documentation)
    ├── QUICK_START.md (이 폴더)
    ├── TOSS_INTEGRATION_SUMMARY.md
    ├── EDGE_FUNCTIONS_DEPLOYMENT.md
    ├── LAUNCH_CHECKLIST.md
    └── FILE_INDEX.md (현재 파일)
```

---

## 📄 프론트엔드 파일

### 1. **index.html** (메인 애플리케이션)
**크기**: 5000+ 줄
**역할**: 모두의 판타지 핵심 애플리케이션

**주요 구성:**
- **스플래시 화면** (줄 79-250): 로고, 온보딩, 배경 애니메이션
- **홈 화면** (줄 250-1000): 프로젝트 목록, 일일 미션, 통계
- **작업실** (줄 1000-2000): 에피소드 작성, AI 보조
- **Toss 인증** (줄 2735-2827): AppinToss 로그인
- **API 함수들** (줄 2834-3000): Edge Functions 호출
- **유틸리티** (줄 3000+): 저장, 로드, UI 상태 관리

**주요 기능:**
- ✅ 한국 시간(KST) 기준 일일 리셋
- ✅ localStorage 기반 로컬 저장
- ✅ Claude/GPT-4o API 통합
- ✅ Supabase 데이터 동기화
- ✅ XSS 보안 조치
- ✅ 3D 그래픽 효과

**사용 방법:**
```bash
# 로컬 테스트
python3 -m http.server 8000
# 브라우저: http://localhost:8000
```

---

### 2. **terms-of-service.html** (서비스 이용 약관)
**크기**: 약 2000 줄
**용도**: AppinToss 플랫폼 내 약관 페이지

**포함 내용:**
- 서비스 정의 및 제공 범위
- 사용자 권리 및 의무
- AI 보조 기능의 책임
- 데이터 백업 및 보존 정책
- 서비스 중단 시 책임 제한
- 분쟁 해결 절차

**이메일**: 571yjm@gmail.com

---

### 3. **privacy-policy.html** (개인정보 처리 방침)
**크기**: 약 2000 줄
**용도**: 개인정보 보호 정책 안내

**포함 내용:**
- 수집하는 개인정보 항목
- 정보 수집 및 이용 목적
- 정보 제3자 제공
- 정보 보유 및 이용 기간
- SHA-256 암호화 기준
- 5년 신용카드 정보 보관 (한국법 준수)
- 90일 계정 삭제 후 데이터 보관

**보안 표준:**
- SHA-256 암호화
- 역할 기반 접근 제어 (RBAC)

---

### 4. **payment-policy.html** (결제 정책)
**크기**: 약 1500 줄
**용도**: 구독 및 결제 조건

**포함 내용:**
- 동전(Coin) 시스템
- 1년 동전 만료 정책
- 환불 불가 정책
- 구독 자동 갱신
- 구독 취소 방법

---

### 5. **ai-creation-terms.html** (AI 창작 약관)
**크기**: 약 1000 줄
**용도**: AI 생성 콘텐츠 저작권 안내

**포함 내용:**
- AI 생성 콘텐츠 저작권 제한
- 사용자 수정으로 인한 저작권 획득
- 2차 창작 가능성
- 저작권 분쟁 해결

---

### 6. **marketing-consent.html** (마케팅 동의서)
**크기**: 약 500 줄
**용도**: 마케팅 활동 동의 여부

**포함 내용:**
- 이메일 마케팅 명시적 동의
- SMS 마케팅 명시적 동의
- 개인정보 활용 동의
- 철회 방법

---

## 🔧 백엔드 파일 (Edge Functions)

모든 파일은 `/edge-functions/` 디렉토리에 위치합니다.

### 1. **authenticate-toss-user.ts**
**크기**: 약 60줄
**목적**: Toss userKey로 사용자 생성 및 인증

**기능:**
```
1. Authorization 헤더에서 userKey 추출
2. users 테이블에서 사용자 조회
3. 없으면 새 사용자 생성
4. 사용자 ID 반환
```

**HTTP 메소드**: POST
**엔드포인트**: `/functions/v1/authenticate-toss-user`

**요청 헤더:**
```
Authorization: Bearer [userKey]
Content-Type: application/json
```

**요청 본문:**
```json
{
  "userKey": "string"
}
```

**응답:**
```json
{
  "user_id": "uuid",
  "toss_user_key": "string"
}
```

---

### 2. **create-project.ts**
**크기**: 약 70줄
**목적**: 새 프로젝트 생성

**기능:**
```
1. userKey로 사용자 확인
2. 프로젝트 정보 검증
3. 프로젝트 생성
4. 새 프로젝트 반환
```

**HTTP 메소드**: POST
**엔드포인트**: `/functions/v1/create-project`

**요청:**
```json
{
  "title": "프로젝트명",
  "description": "설명",
  "genre": "판타지"
}
```

**응답:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "프로젝트명",
      "created_at": "2026-04-24T..."
    }
  ]
}
```

---

### 3. **get-projects.ts**
**크기**: 약 60줄
**목적**: 사용자의 모든 프로젝트 조회

**기능:**
```
1. userKey로 사용자 확인
2. 해당 사용자의 프로젝트 조회
3. 관련 에피소드 포함
4. 최신순 정렬
```

**HTTP 메소드**: GET
**엔드포인트**: `/functions/v1/get-projects`

**응답:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "프로젝트명",
      "episodes": [
        {
          "id": "uuid",
          "title": "에피소드 1",
          "manuscript": "원문..."
        }
      ]
    }
  ]
}
```

---

### 4. **update-episode.ts**
**크기**: 약 70줄
**목적**: 에피소드 내용 저장

**기능:**
```
1. userKey로 사용자 확인
2. 에피소드 ID 검증
3. 원문, 제목, 상태 업데이트
4. 업데이트된 에피소드 반환
```

**HTTP 메소드**: POST
**엔드포인트**: `/functions/v1/update-episode`

**요청:**
```json
{
  "episode_id": "uuid",
  "manuscript": "원문...",
  "status": "writing",
  "title": "에피소드 제목"
}
```

**응답:**
```json
{
  "data": [
    {
      "id": "uuid",
      "manuscript": "원문...",
      "updated_at": "2026-04-24T..."
    }
  ]
}
```

---

### 5. **save-chat-history.ts**
**크기**: 약 75줄
**목적**: AI 대화 이력 저장

**기능:**
```
1. userKey로 사용자 확인
2. 에피소드 ID 검증
3. 채팅 메시지 저장
4. 저장된 기록 반환
```

**HTTP 메소드**: POST
**엔드포인트**: `/functions/v1/save-chat-history`

**요청:**
```json
{
  "episode_id": "uuid",
  "role": "user|assistant",
  "content": "메시지 내용"
}
```

**응답:**
```json
{
  "data": [
    {
      "id": "uuid",
      "episode_id": "uuid",
      "role": "user",
      "content": "내용",
      "created_at": "2026-04-24T..."
    }
  ]
}
```

---

## 📚 문서 파일

### 1. **QUICK_START.md** ⭐ 시작하기 좋음
**용도**: 5분 만에 이해하기
**주요 내용:**
- 이전 vs 현재 비교
- 핵심 변경사항
- 다음 3단계
- FAQ

**추천 대상**: 빠르게 상황을 파악하고 싶은 사람

---

### 2. **TOSS_INTEGRATION_SUMMARY.md** ⭐ 상세 설명
**용도**: Toss 통합의 모든 세부사항
**주요 내용:**
- 완료된 작업 목록
- 다음 단계 (상세함)
- 파일 위치
- 핵심 변경사항
- 배포 후 예상 흐름

**추천 대상**: 기술적으로 깊이 있게 이해하고 싶은 사람

---

### 3. **EDGE_FUNCTIONS_DEPLOYMENT.md** 🚀 배포 가이드
**용도**: Edge Functions 배포 방법
**주요 내용:**
- 웹 UI 배포 (Option A - 추천)
- CLI 배포 (Option B)
- 배포 후 확인 방법
- cURL 테스트
- 문제 해결

**추천 대상**: 실제 배포를 수행해야 하는 사람

---

### 4. **LAUNCH_CHECKLIST.md** ✅ 출시 준비
**용도**: 출시 전 체크리스트
**주요 내용:**
- 전체 진행 상황 (Step 1-7)
- 우선순위별 할일
- 각 단계별 소요 시간
- 데이터 흐름
- 출시 후 운영 계획
- 최종 체크리스트

**추천 대상**: 출시를 목표로 준비 중인 사람

---

### 5. **FILE_INDEX.md** (현재 파일)
**용도**: 모든 파일 설명 및 인덱스
**주요 내용:**
- 디렉토리 구조
- 각 파일의 목적
- API 엔드포인트
- 주요 기능

**추천 대상**: 어떤 파일이 뭐하는 건지 알고 싶은 사람

---

## 🎯 상황별 어떤 파일을 봐야 할까?

### "지금 뭘 해야 하지?"
→ **QUICK_START.md** 먼저 읽기 (5분)

### "전체 상황을 파악하고 싶어"
→ **LAUNCH_CHECKLIST.md** 읽기 (10분)

### "기술적으로 깊이 있게 알고 싶어"
→ **TOSS_INTEGRATION_SUMMARY.md** 읽기 (15분)

### "Edge Functions를 배포해야 해"
→ **EDGE_FUNCTIONS_DEPLOYMENT.md** 읽기 (배포 전 필수)

### "어떤 파일이 뭐하는 건지 모르겠어"
→ **FILE_INDEX.md** (현재 파일) 읽기

---

## 📊 파일 읽는 순서 (추천)

### 처음 시작하는 사람
```
1. QUICK_START.md (5분)
   ↓
2. TOSS_INTEGRATION_SUMMARY.md (15분)
   ↓
3. LAUNCH_CHECKLIST.md (10분)
   ↓
4. EDGE_FUNCTIONS_DEPLOYMENT.md (배포 전)
```

### 이미 상황을 아는 사람
```
1. QUICK_START.md (2분 - 요약만)
   ↓
2. EDGE_FUNCTIONS_DEPLOYMENT.md (배포 직진)
```

### 특정 파일에 대해 알고 싶은 사람
```
FILE_INDEX.md → 해당 섹션 읽기
```

---

## 🔗 파일 간 참조

```
index.html
  ├── terms-of-service.html (약관 링크)
  ├── privacy-policy.html (개인정보 링크)
  ├── payment-policy.html (결제 링크)
  ├── ai-creation-terms.html (AI 약관 링크)
  └── marketing-consent.html (마케팅 동의 링크)

Edge Functions (Supabase)
  ├── authenticate-toss-user.ts
  ├── create-project.ts
  ├── get-projects.ts
  ├── update-episode.ts
  └── save-chat-history.ts

Documentation
  ├── QUICK_START.md (입문)
  ├── TOSS_INTEGRATION_SUMMARY.md (상세)
  ├── EDGE_FUNCTIONS_DEPLOYMENT.md (배포)
  ├── LAUNCH_CHECKLIST.md (체크리스트)
  └── FILE_INDEX.md (참조)
```

---

## 📈 코드 라인 수 통계

| 파일 | 줄 수 | 주요 기능 |
|------|------|---------|
| index.html | 5000+ | 전체 앱 |
| terms-of-service.html | 2000 | 약관 |
| privacy-policy.html | 2000 | 개인정보 |
| payment-policy.html | 1500 | 결제 |
| ai-creation-terms.html | 1000 | AI 약관 |
| marketing-consent.html | 500 | 마케팅 |
| authenticate-toss-user.ts | 60 | 인증 |
| create-project.ts | 70 | 프로젝트 생성 |
| get-projects.ts | 60 | 프로젝트 조회 |
| update-episode.ts | 70 | 에피소드 저장 |
| save-chat-history.ts | 75 | 채팅 저장 |
| **합계** | **약 14,000** | - |

---

## ✅ 배포 전 체크리스트 (파일별)

### index.html
- [ ] AppinToss 스크립트 포함 (줄 1495)
- [ ] Toss 인증 함수 포함 (줄 2735-2827)
- [ ] getAuthHeader() Toss userKey 사용
- [ ] Edge Functions URL 올바름

### 약관 파일들
- [ ] 이메일 주소: 571yjm@gmail.com
- [ ] URL이 올바름
- [ ] 한국어 표현이 자연스러움

### Edge Functions
- [ ] 5개 모두 배포됨
- [ ] CORS 헤더 포함
- [ ] 환경변수 설정됨 (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

### 문서
- [ ] 모든 링크가 유효함
- [ ] 코드 예시가 최신 버전과 일치

---

## 🎓 학습 포인트

### 이 프로젝트에서 배운 것
1. **AppinToss 플랫폼 통합**: Toss 자동 인증
2. **Supabase 사용**: 데이터베이스 + Edge Functions
3. **TypeScript/Deno**: 서버리스 함수 작성
4. **보안**: XSS 방지, 데이터 보호
5. **한국 특화**: KST 타임존, 한국법 준수

### 추천 학습 자료
- AppinToss 공식 문서
- Supabase 튜토리얼
- Deno 학습 가이드

---

## 🚀 다음 단계

1. **데이터베이스 확인**: users.user_id 필드 추가
2. **Edge Functions 배포**: EDGE_FUNCTIONS_DEPLOYMENT.md 참고
3. **Vercel 배포**: index.html 배포
4. **AppinToss 심사**: 약관 링크 등 확인
5. **출시**: 🎉

---

**생성일**: 2026-04-24
**상태**: Step 5-2 완료 (Edge Functions 배포 준비)
**다음**: Step 5-3 배포 시작

