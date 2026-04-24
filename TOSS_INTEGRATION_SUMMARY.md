# Toss AppinToss 로그인 통합 진행 현황

## ✅ 완료된 작업

### 1. 프론트엔드 통합
- **AppinToss 프레임워크 추가**: `<script src="https://cdn.jsdelivr.net/npm/@apps-in-toss/web-framework"></script>`
- **자동 인증 구현**:
  - `initializeTossAuth()` 함수로 앱 로드 시 자동 실행
  - `getAnonymousKey()` 호출로 Toss userKey 획득
  - localStorage에 `toss_user_key` 저장

- **인증 함수 변경**:
  - `signUpUser()` 제거
  - `signInUser()` 제거
  - `signInWithToss()` 추가 (사실상 자동)
  - `signOutUser()` 업데이트 (userKey 초기화)

- **API 호출 변경**:
  - `getAuthHeader()` 수정: Toss userKey를 Bearer 토큰으로 반환
  - 모든 Edge Functions 호출 시 userKey 자동 전송

### 2. Edge Functions 개선
다음 4개 함수를 Toss userKey 기반으로 변경:

#### 2-1. create-project
- Authorization 헤더에서 userKey 추출
- users 테이블에서 사용자 확인
- 프로젝트 생성 시 user_id 필터링

#### 2-2. get-projects
- userKey로 사용자 확인
- 해당 사용자의 프로젝트만 반환
- 관련 episodes 포함

#### 2-3. update-episode
- userKey 기반 인증
- 에피소드 업데이트

#### 2-4. save-chat-history
- userKey 기반 인증
- 채팅 이력 저장

## 🚀 다음 단계

### 1단계: Supabase 데이터베이스 스키마 확인
```sql
-- users 테이블에 user_id 필드 확인
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'user_id';

-- 없으면 추가
ALTER TABLE users ADD COLUMN user_id TEXT UNIQUE;
```

### 2단계: Edge Functions 배포

#### 2-1. Supabase CLI 설치 및 링크
```bash
npm install -g supabase
supabase link --project-ref tsxxfkpteooocquonehr
```

#### 2-2. 각 함수 배포
5개의 파일을 만들어야 합니다:
- `supabase/functions/authenticate-toss-user/index.ts`
- `supabase/functions/create-project/index.ts`
- `supabase/functions/get-projects/index.ts`
- `supabase/functions/update-episode/index.ts`
- `supabase/functions/save-chat-history/index.ts`

#### 2-3. 배포 명령
```bash
supabase functions deploy
```

### 3단계: 테스트
1. AppinToss에서 앱 로드
2. 자동으로 Toss userKey 획득 확인
3. localStorage에서 `toss_user_key` 확인
4. 프로젝트 생성/조회 기능 테스트
5. 에피소드 저장 및 채팅 이력 저장 테스트

## 📋 파일 위치

### Edge Functions 코드
- `authenticate-toss-user.js`
- `create-project-toss.js`
- `get-projects-toss.js`
- `update-episode-toss.js`
- `save-chat-history-toss.js`

### 프론트엔드
- `/sessions/vibrant-wonderful-ramanujan/mnt/GitHub/modupantasy/index.html`
  - 라인 1495: AppinToss 프레임워크 스크립트
  - 라인 2735~2827: Toss 인증 초기화 함수
  - 라인 2834: getAuthHeader() 수정
  - 라인 3170~3226: 인증 함수 수정

## 🔑 핵심 변경사항

### 프론트엔드
```javascript
// 이전 (이메일/비밀번호)
await signUpUser(email, password);
await signInUser(email, password);

// 이후 (Toss 자동 인증)
// 앱 로드 시 자동 실행, 사용자 입력 필요 없음
await initializeTossAuth(); // 자동 호출됨
```

### 백엔드 (Edge Functions)
```typescript
// 이전 (Supabase JWT 토큰)
const token = req.headers.get('Authorization'); // "Bearer jwt_token"

// 이후 (Toss userKey)
const authHeader = req.headers.get('Authorization'); // "Bearer userKey"
const userKey = authHeader.split(' ')[1]; // userKey 추출
```

## 📝 주의사항

1. **users 테이블**: user_id 필드 추가 필수
2. **Edge Functions**: TypeScript 또는 JavaScript로 변환 후 배포
3. **UUID import**: `v4` 함수는 `https://deno.land/std@0.208.0/uuid/mod.ts`에서 import
4. **CORS**: 모든 함수에서 CORS 헤더 포함
5. **localStorage**: `toss_user_key`는 로그아웃 시에만 삭제

## ✨ 배포 후 예상 흐름

1. **앱 로드**
   ```
   index.html 로드
   → AppinToss 프레임워크 로드
   → initializeTossAuth() 실행
   → getAnonymousKey() 호출
   → userKey 획득
   → localStorage에 저장
   → authenticateWithTossKey() 호출
   → Edge Function으로 userKey 전송
   → users 테이블에 사용자 생성/조회
   → 프로젝트 로드
   → 홈 화면 표시
   ```

2. **API 호출**
   ```
   프로젝트 생성 요청
   → getAuthHeader() 호출
   → "Bearer [userKey]" 반환
   → Edge Function 호출
   → userKey로 인증 확인
   → 프로젝트 생성
   → 응답
   ```

## 🔄 Vercel 배포 후

현재는 로컬 index.html 파일입니다. Vercel에 배포할 때:

```bash
# 1. Vercel 로그인
vercel login

# 2. 배포
vercel --prod

# 3. 확인
# https://modupantasy.vercel.app/
```

## 📊 현재 상태

- ✅ 프론트엔드: Toss 인증 구현 완료
- ⏳ 백엔드: Edge Functions 배포 대기
- ⏳ 테스트: 배포 후 진행
- ⏳ 최종 배포: AppinToss 플랫폼 등록

---

**마지막 커밋**: Step 5-2: Toss AppinToss 로그인 통합
