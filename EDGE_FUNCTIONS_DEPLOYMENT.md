# Edge Functions 배포 가이드

## 📋 필요한 파일들

이미 생성된 TypeScript 파일들:
- `edge-functions/authenticate-toss-user.ts`
- `edge-functions/create-project.ts`
- `edge-functions/get-projects.ts`
- `edge-functions/update-episode.ts`
- `edge-functions/save-chat-history.ts`

## 🚀 배포 방법

### Option 1: Supabase 대시보드 웹 UI (가장 간단)

#### 1단계: Supabase 대시보드 접속
1. https://app.supabase.com 접속
2. 프로젝트 선택: `modupantasy` (tsxxfkpteooocquonehr)

#### 2단계: Edge Functions 생성
1. 좌측 메뉴 → **Edge Functions**
2. **Create a new function** 클릭

#### 3단계: 각 함수 생성 및 배포

##### 3-1. authenticate-toss-user
1. Function name: `authenticate-toss-user`
2. Copy and paste code from `edge-functions/authenticate-toss-user.ts`
3. **Deploy** 클릭

##### 3-2. create-project
1. Function name: `create-project`
2. Copy and paste code from `edge-functions/create-project.ts`
3. **Deploy** 클릭

##### 3-3. get-projects
1. Function name: `get-projects`
2. Copy and paste code from `edge-functions/get-projects.ts`
3. **Deploy** 클릭

##### 3-4. update-episode
1. Function name: `update-episode`
2. Copy and paste code from `edge-functions/update-episode.ts`
3. **Deploy** 클릭

##### 3-5. save-chat-history
1. Function name: `save-chat-history`
2. Copy and paste code from `edge-functions/save-chat-history.ts`
3. **Deploy** 클릭

---

### Option 2: Supabase CLI (로컬 개발)

#### 사전 요구사항
```bash
# Node.js 및 npm 설치 확인
node --version
npm --version
```

#### 1단계: Supabase CLI 설치
```bash
npm install -g supabase
```

#### 2단계: 프로젝트 디렉토리 생성
```bash
mkdir supabase-functions
cd supabase-functions
```

#### 3단계: 프로젝트 초기화
```bash
supabase init
```

#### 4단계: 프로젝트 링크
```bash
supabase link --project-ref tsxxfkpteooocquonehr
```

프롬프트가 나타나면:
- Supabase 비밀번호 입력
- `y` 입력하여 연결 확인

#### 5단계: 함수 생성

```bash
# 각 함수별로 실행
supabase functions new authenticate-toss-user
supabase functions new create-project
supabase functions new get-projects
supabase functions new update-episode
supabase functions new save-chat-history
```

#### 6단계: 코드 복사

각 생성된 파일에 해당 TypeScript 코드를 복사합니다:

```
supabase/functions/authenticate-toss-user/index.ts
supabase/functions/create-project/index.ts
supabase/functions/get-projects/index.ts
supabase/functions/update-episode/index.ts
supabase/functions/save-chat-history/index.ts
```

#### 7단계: 로컬 테스트 (선택사항)

```bash
supabase start  # 로컬 Supabase 시작

# 다른 터미널에서
supabase functions serve
```

#### 8단계: 배포

```bash
supabase functions deploy
```

또는 특정 함수만:
```bash
supabase functions deploy authenticate-toss-user
supabase functions deploy create-project
supabase functions deploy get-projects
supabase functions deploy update-episode
supabase functions deploy save-chat-history
```

---

## ✅ 배포 후 확인

### 1. Supabase 대시보드에서 확인
1. https://app.supabase.com/project/tsxxfkpteooocquonehr/functions
2. 5개 함수 모두 표시되는지 확인

### 2. 함수 URL 확인
각 함수의 URL 형식:
```
https://tsxxfkpteooocquonehr.supabase.co/functions/v1/[함수명]
```

예시:
```
https://tsxxfkpteooocquonehr.supabase.co/functions/v1/create-project
https://tsxxfkpteooocquonehr.supabase.co/functions/v1/get-projects
https://tsxxfkpteooocquonehr.supabase.co/functions/v1/update-episode
https://tsxxfkpteooocquonehr.supabase.co/functions/v1/save-chat-history
https://tsxxfkpteooocquonehr.supabase.co/functions/v1/authenticate-toss-user
```

### 3. 테스트 (cURL)

#### 테스트 데이터 준비
```bash
# 테스트용 userKey (임시)
TOSS_USER_KEY="test_user_key_12345"
```

#### create-project 테스트
```bash
curl -X POST https://tsxxfkpteooocquonehr.supabase.co/functions/v1/create-project \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOSS_USER_KEY" \
  -d '{
    "title": "테스트 프로젝트",
    "description": "테스트 설명",
    "genre": "판타지"
  }'
```

예상 응답:
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "user_uuid",
      "title": "테스트 프로젝트",
      "description": "테스트 설명",
      "genre": "판타지",
      "created_at": "2026-04-24T..."
    }
  ]
}
```

---

## 🔐 데이터베이스 스키마 확인

배포 전에 다음을 확인하세요:

### 1. users 테이블
```sql
-- Supabase 대시보드 → SQL Editor에서 실행
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'users';
```

출력 결과에 `user_id` 컬럼이 있는지 확인합니다.

없으면 추가:
```sql
ALTER TABLE users
ADD COLUMN user_id TEXT UNIQUE;

-- 인덱스 생성 (성능 향상)
CREATE INDEX idx_users_user_id ON users(user_id);
```

### 2. projects 테이블 확인
```sql
-- user_id 외래 키 확인
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'projects' AND constraint_type = 'FOREIGN KEY';
```

필요시 추가:
```sql
ALTER TABLE projects
ADD CONSTRAINT projects_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
```

### 3. episodes, chat_history 테이블 확인
마찬가지로 필요한 컬럼과 관계 확인

---

## 🐛 문제 해결

### 1. "Authentication required" 오류
- **원인**: Authorization 헤더 누락 또는 형식 잘못
- **해결**:
```bash
# 올바른 형식
curl -H "Authorization: Bearer [userKey]" ...
```

### 2. "User not found" 오류
- **원인**: 사용자가 users 테이블에 없음
- **해결**: 먼저 `authenticate-toss-user` 함수 호출

### 3. CORS 오류
- **확인**: Edge Functions에 CORS 헤더 포함되어 있음
- **해결**: 브라우저 개발자 도구 → Network → 응답 헤더 확인

### 4. UUID import 오류
```typescript
// 올바른 import
import { v4 as uuid } from 'https://deno.land/std@0.208.0/uuid/mod.ts'
```

### 5. Supabase client import 오류
```typescript
// 올바른 import
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
```

---

## 📝 배포 체크리스트

- [ ] users 테이블에 user_id 컬럼 추가
- [ ] projects 테이블 외래 키 확인
- [ ] episodes 테이블 외래 키 확인
- [ ] authenticate-toss-user 배포
- [ ] create-project 배포
- [ ] get-projects 배포
- [ ] update-episode 배포
- [ ] save-chat-history 배포
- [ ] 모든 함수 URL 테스트
- [ ] 프론트엔드 index.html의 Edge Functions URL 확인

---

## 🎯 배포 후 다음 단계

1. **로컬 테스트**
   ```bash
   # AppinToss 로컬 개발 환경에서 테스트
   ```

2. **Vercel 배포**
   ```bash
   vercel --prod
   ```

3. **AppinToss 플랫폼 등록**
   - https://developers-apps-in-toss.toss.im 접속
   - 앱 정보 업로드
   - 심사 신청

---

## 📞 추가 지원

- **Supabase 문서**: https://supabase.com/docs/guides/functions
- **Deno 문서**: https://deno.land/manual
- **AppinToss 문서**: https://developers-apps-in-toss.toss.im

