# 빠른 시작 가이드 (Quick Start)

## 🚀 5분 만에 이해하기

### 이전 vs 현재

#### 이전 (로그인 화면 필요)
```
사용자 → [이메일 입력] → [비밀번호 입력] → Supabase 인증 → 앱 사용
```

#### 현재 (자동 로그인)
```
사용자 → AppinToss 로드 → 자동 인증 (Toss userKey) → 앱 사용
```

---

## 📌 핵심 변경사항

### 1. Toss 자동 인증 추가
```javascript
// AppinToss 프레임워크 로드
<script src="https://cdn.jsdelivr.net/npm/@apps-in-toss/web-framework"></script>

// 앱 로드 시 자동 실행
async function initializeTossAuth() {
  const res = await window.getAnonymousKey();
  const userKey = res.userKey;
  // ... 인증 처리
}
```

### 2. 인증 토큰 변경
```javascript
// 이전
Authorization: "Bearer [JWT 토큰]"

// 현재
Authorization: "Bearer [Toss userKey]"
```

### 3. 이메일/비밀번호 인증 제거
```javascript
// 제거된 함수들
- signUpUser(email, password)   // ❌ 삭제됨
- signInUser(email, password)   // ❌ 삭제됨

// 추가된 함수
+ signInWithToss()              // ✅ 새로 추가 (실제로는 자동)
```

---

## 📂 파일 구조

### 프론트엔드
```
index.html
├── 라인 1495: AppinToss 프레임워크
├── 라인 2738-2827: Toss 인증 초기화
├── 라인 2834: getAuthHeader() - userKey 반환
└── 라인 3170-3226: 인증 함수들
```

### 백엔드 (Edge Functions)
```
edge-functions/
├── authenticate-toss-user.ts  → 사용자 생성/확인
├── create-project.ts          → 프로젝트 생성
├── get-projects.ts            → 프로젝트 조회
├── update-episode.ts          → 에피소드 저장
└── save-chat-history.ts       → 채팅 이력 저장
```

---

## 🎯 다음 3단계

### Step 1: 데이터베이스 확인 (5분)
```bash
# Supabase SQL Editor에서 실행
ALTER TABLE users ADD COLUMN user_id TEXT UNIQUE;
```

### Step 2: Edge Functions 배포 (20분)
```bash
# Option A: 웹 UI (추천)
1. https://app.supabase.com 접속
2. Edge Functions 메뉴
3. 5개 함수 코드 복사-붙여넣기
4. Deploy 버튼 클릭

# Option B: CLI
npm install -g supabase
supabase link --project-ref tsxxfkpteooocquonehr
supabase functions deploy
```

### Step 3: Vercel 배포 (10분)
```bash
npm install -g vercel
vercel login
vercel --prod
```

---

## 🔑 핵심 개념

### userKey란?
- **Toss에서 제공**: AppinToss 플랫폼에서 사용자를 식별하는 고유 키
- **자동 생성**: 사용자가 앱을 열면 자동으로 부여
- **한 번만**: 매번 새로 생성되지 않음 (localStorage에 저장)
- **보안**: Toss에서 검증된 값

### Edge Functions?
- **서버 함수**: Supabase에서 제공하는 서버리스 함수
- **역할**:
  - 사용자 인증 확인
  - 데이터베이스 접근
  - API 호출
- **위치**: `https://tsxxfkpteooocquonehr.supabase.co/functions/v1/[함수명]`

### 데이터 흐름
```
1. 사용자: AppinToss 앱 열기
2. 프론트: getAnonymousKey() 호출
3. Toss: userKey 반환
4. 프론트: localStorage에 저장
5. 프론트: Edge Function 호출 (userKey 함께)
6. 백엔드: userKey로 사용자 확인/생성
7. 백엔드: 데이터베이스 작업 처리
8. 결과: JSON으로 반환
```

---

## ⚡ 테스트 명령어

### 로컬 테스트
```bash
cd /sessions/vibrant-wonderful-ramanujan/mnt/GitHub/modupantasy
python3 -m http.server 8000
# 브라우저: http://localhost:8000
```

### API 테스트 (배포 후)
```bash
# create-project 테스트
curl -X POST https://tsxxfkpteooocquonehr.supabase.co/functions/v1/create-project \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test_userkey_123" \
  -d '{
    "title": "테스트",
    "description": "설명",
    "genre": "판타지"
  }'
```

---

## 📊 상태 확인

### Step 5 진행 상황
```
Step 5-1: Supabase 설정           ✅ 완료
Step 5-2: Toss 로그인 통합        ✅ 완료
Step 5-3: Edge Functions 개발      ✅ 완료
Step 5-4: Edge Functions 배포      ⏳ 대기 중
Step 5-5: 최종 테스트            ⏳ 대기 중
Step 6:  출시                    ⏳ 예정
```

---

## 🆘 자주 묻는 질문 (FAQ)

### Q1. 이메일/비밀번호는 어디로?
**A.** Toss 계정으로 대체되었습니다. 사용자가 AppinToss를 통해 이미 Toss 계정으로 로그인한 상태에서 앱이 실행되므로 별도의 로그인이 필요 없습니다.

### Q2. 기존 사용자 데이터는?
**A.** 현재는 아직 출시 전이므로 기존 사용자가 없습니다. 출시 후 모든 사용자는 자동으로 생성됩니다.

### Q3. localStorage의 toss_user_key는?
**A.** 앱 재로드 시에도 같은 사용자로 로그인하기 위해 저장합니다. 로그아웃하면 삭제됩니다.

### Q4. Edge Functions 배포가 실패하면?
**A.** Supabase 대시고판 → Edge Functions → 로그에서 오류를 확인하고, TypeScript 문법을 다시 확인하세요.

### Q5. Vercel과 Supabase의 차이는?
**A.**
- **Vercel**: 프론트엔드 호스팅 (index.html)
- **Supabase**: 백엔드 (데이터베이스 + Edge Functions)

---

## 💡 팁

### 1. 로컬 테스트 팁
```bash
# 개발자 도구 → Console에서 확인
console.log(localStorage.getItem('toss_user_key'));
```

### 2. 배포 후 디버깅
- Supabase 대시고판 → Logs
- Vercel 대시고판 → Functions
- 브라우저 개발자 도구 → Network 탭

### 3. 성능 최적화
- Edge Functions 응답 시간 체크
- 데이터베이스 쿼리 최적화
- 로컬스토리지 용량 관리

---

## 🎓 학습 자료

### 새로 배운 기술
- **AppinToss**: Toss 미니앱 플랫폼
- **Edge Functions**: 서버리스 함수
- **Deno**: JavaScript/TypeScript 런타임
- **Toss OAuth**: 사용자 인증

### 추천 리소스
- [AppinToss 공식 문서](https://developers-apps-in-toss.toss.im)
- [Supabase 공식 문서](https://supabase.com/docs)
- [Deno 공식 문서](https://deno.land/manual)

---

## 📋 배포 전 체크리스트

- [ ] users 테이블에 user_id 컬럼 추가
- [ ] 5개 Edge Functions 모두 배포 완료
- [ ] 각 함수 URL 테스트 완료
- [ ] index.html이 정상 작동
- [ ] localStorage에 toss_user_key 저장됨 확인
- [ ] Vercel에 배포 완료
- [ ] HTTPS 작동 확인

---

## 🚀 출시 명령어

```bash
# 1. Edge Functions 배포
supabase functions deploy

# 2. Vercel 배포
vercel --prod

# 3. AppinToss 앱 등록
# https://developers-apps-in-toss.toss.im 접속 → 앱 등록 → 심사 신청

# 완료! 🎉
```

---

**상태**: Step 5-2 완료 ✅ (Edge Functions 배포 준비 완료)
**다음**: Step 5-3 Edge Functions 배포
**예상 시간**: 1시간

