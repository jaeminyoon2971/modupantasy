# 모두의 판타지 (modupantasy) 출시 체크리스트

## 📊 전체 진행 상황

### ✅ 완료됨
- [x] 기본 UI/UX 디자인 (스플래시, 홈, 작업실)
- [x] 3D 그래픽 효과 (box-shadow 다층 구조)
- [x] 글쓰기 기능 (에피소드 작성 및 관리)
- [x] AI 보조 기능 (Claude API 통합)
- [x] 코드 품질 검토 및 버그 수정
  - [x] 한국 시간(KST) 자정 기준 일일 리셋
  - [x] XSS 취약점 제거
  - [x] 채팅 이력 동기화
- [x] 약관 및 정책 문서
  - [x] 서비스 이용 약관
  - [x] 개인정보 처리 방침
  - [x] 결제 정책
  - [x] AI 창작 약관
  - [x] 마케팅 동의서
- [x] Supabase 데이터베이스 설계
- [x] Toss AppinToss 로그인 통합

### 🚀 진행 중
- [ ] Edge Functions 배포 (Supabase)
- [ ] 데이터베이스 스키마 최종 확인
- [ ] 프론트엔드 테스트 (AppinToss 환경)

### ⏳ 예정
- [ ] 최종 코드 리뷰
- [ ] Vercel 배포
- [ ] AppinToss 플랫폼 등록 및 심사

---

## 🎯 현재 상태: Step 5 - Backend Infrastructure

### 5-1단계: Supabase 설정 ✅
- Supabase 프로젝트 생성
- 데이터베이스 스키마 생성 (users, projects, episodes, chat_history)
- 기본 클라이언트 초기화

### 5-2단계: Toss AppinToss 통합 ✅
- AppinToss web-framework 추가
- getAnonymousKey() 기반 자동 인증
- Toss userKey localStorage 저장
- 인증 함수 변경 (이메일/비밀번호 → Toss)

### 5-3단계: Edge Functions 개발 ✅ (배포 대기)
- authenticate-toss-user: 사용자 인증/생성
- create-project: 프로젝트 생성
- get-projects: 프로젝트 목록 조회
- update-episode: 에피소드 저장
- save-chat-history: 채팅 이력 저장

### 5-4단계: Edge Functions 배포 ⏳
현재 상태: **준비 완료, 배포 대기**

---

## 🔧 즉시 해야 할 일 (우선순위 순서)

### 1단계: 데이터베이스 스키마 확인 (5분)
```sql
-- Supabase SQL Editor에서 실행
SELECT column_name FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'user_id';
```

**없으면 추가:**
```sql
ALTER TABLE users ADD COLUMN user_id TEXT UNIQUE;
CREATE INDEX idx_users_user_id ON users(user_id);
```

### 2단계: Edge Functions 배포 (20분)

#### Option A: 웹 UI (권장 - 가장 간단)
1. Supabase 대시보드 접속
2. Edge Functions 메뉴
3. 5개 함수 코드 복사-붙여넣기
4. 각각 Deploy 클릭

#### Option B: CLI
```bash
npm install -g supabase
supabase link --project-ref tsxxfkpteooocquonehr
# edge-functions 폴더의 .ts 파일들 복사
supabase functions deploy
```

자세한 가이드: `EDGE_FUNCTIONS_DEPLOYMENT.md` 참고

### 3단계: 프론트엔드 테스트 (30분)
```bash
# 로컬에서 index.html 실행
python3 -m http.server 8000
# 브라우저: http://localhost:8000
```

**테스트 항목:**
- [ ] 앱 로드 시 자동 Toss 인증
- [ ] localStorage에 toss_user_key 저장됨
- [ ] 프로젝트 생성 가능
- [ ] 프로젝트 목록 조회 가능
- [ ] 에피소드 저장 가능
- [ ] 채팅 이력 저장 가능
- [ ] 로그아웃 시 userKey 삭제됨

### 4단계: Vercel 배포 (10분)
```bash
npm install -g vercel
vercel login
cd /path/to/modupantasy
vercel --prod
```

### 5단계: AppinToss 플랫폼 등록
https://developers-apps-in-toss.toss.im에서:
1. 앱 정보 입력
2. 앱 아이콘/스크린샷 업로드
3. 약관 및 정책 링크 추가
4. 심사 신청

---

## 📁 핵심 파일 및 경로

### 프론트엔드
```
/sessions/vibrant-wonderful-ramanujan/mnt/GitHub/modupantasy/
├── index.html (메인 애플리케이션)
├── terms-of-service.html
├── privacy-policy.html
├── payment-policy.html
├── ai-creation-terms.html
└── marketing-consent.html
```

### 백엔드 (Edge Functions)
```
/sessions/vibrant-wonderful-ramanujan/mnt/modupantasy/edge-functions/
├── authenticate-toss-user.ts
├── create-project.ts
├── get-projects.ts
├── update-episode.ts
└── save-chat-history.ts
```

### 문서
```
/sessions/vibrant-wonderful-ramanujan/mnt/modupantasy/
├── TOSS_INTEGRATION_SUMMARY.md
├── EDGE_FUNCTIONS_DEPLOYMENT.md
└── LAUNCH_CHECKLIST.md (이 파일)
```

---

## 🔍 각 파일의 역할

### index.html (5000+ 줄)
- **스플래시 화면**: 로고 및 온보딩
- **홈 화면**: 프로젝트 목록 및 일일 미션
- **작업실**: 에피소드 작성 및 AI 보조
- **AppinToss 통합**: Toss 자동 로그인
- **API 호출**: Edge Functions과 연동

### Edge Functions (Supabase)
각 함수는 Toss userKey를 기반으로 인증하고:
1. users 테이블에서 사용자 확인
2. 요청된 작업 수행
3. JSON으로 결과 반환

---

## 📊 데이터 흐름

### 사용자 로그인
```
1. 앱 로드 (index.html)
2. AppinToss getAnonymousKey() 호출
3. Toss userKey 획득
4. localStorage에 저장
5. Edge Function 호출: authenticate-toss-user
6. 사용자 생성/확인
7. 프로젝트 로드
8. 홈 화면 표시
```

### 프로젝트 생성
```
1. 사용자가 "새 프로젝트" 클릭
2. 제목, 설명, 장르 입력
3. callCreateProject() 호출
4. Edge Function: create-project
5. Supabase에 저장
6. 프로젝트 목록 새로고침
```

### 에피소드 작성
```
1. 사용자가 에피소드 작성 시작
2. AI에게 조언 요청
3. Claude API 호출 (또는 GPT-4o 폴백)
4. 응답 표시
5. 사용자가 저장 버튼 클릭
6. callUpdateEpisode() 호출
7. Edge Function: update-episode
8. Supabase에 저장
9. 채팅 이력 저장: callSaveChatHistory()
```

---

## 🚀 출시 후 운영 계획

### 즉시 (1주)
- 사용자 피드백 수집
- 버그 리포트 대응
- 성능 모니터링 (Supabase 대시보드)

### 단기 (1개월)
- 사용자 수 증가 대응 (데이터베이스 최적화)
- 결제 시스템 개선 (동전 제도)
- AI 응답 개선 (프롬프트 튜닝)

### 중기 (3개월)
- 소셜 기능 추가 (공유, 팔로우)
- 출판 기능 (e-book 생성)
- 마케팅 캠페인

### 장기 (6개월+)
- 모바일 네이티브 앱 개발
- 오프라인 저장 기능
- AI 이미지 생성 (삽화)

---

## ⚠️ 주의사항

### 보안
- [ ] CORS 설정 확인 (Edge Functions)
- [ ] Row Level Security (RLS) 정책 설정 검토
- [ ] API 키 환경변수로 관리 확인
- [ ] HTTPS 사용 확인

### 성능
- [ ] Supabase 데이터베이스 인덱스 확인
- [ ] Edge Functions 응답 시간 모니터링
- [ ] 로컬스토리지 용량 관리 (1MB 제한)
- [ ] 이미지 최적화

### 호환성
- [ ] AppinToss WebView 버전 확인
- [ ] iOS/Android 브라우저 호환성
- [ ] 다양한 화면 크기 테스트

---

## 📞 문제 발생 시 대응

### Edge Functions 배포 실패
1. Supabase 대시보드 → Edge Functions → 로그 확인
2. TypeScript 구문 오류 확인
3. 환경변수 (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY) 확인

### 사용자 인증 오류
1. localStorage에서 `toss_user_key` 확인
2. users 테이블에 데이터 저장되었는지 확인
3. getAuthHeader() 함수 테스트

### API 호출 오류
1. 네트워크 탭에서 요청/응답 확인
2. CORS 오류인지 확인
3. Authorization 헤더 형식 확인 (`Bearer [userKey]`)

---

## ✨ 최종 체크리스트

배포 전 마지막 확인:

- [ ] index.html의 모든 기능 정상 작동
- [ ] Edge Functions 5개 모두 배포됨
- [ ] 데이터베이스 스키마 확인 및 user_id 필드 추가됨
- [ ] 약관 및 정책 모두 작성됨
- [ ] Vercel에 배포되고 HTTPS 작동
- [ ] AppinToss 플랫폼에서 앱 테스트 완료
- [ ] 사용자 정보 수집 및 처리 정책 준수
- [ ] 법적 검토 완료 (선택사항)

---

## 🎉 출시 전 최종 메시지

모두의 판타지가 출시될 준비가 거의 다 되었습니다!

**남은 일:**
1. Edge Functions 배포 (20분)
2. 프론트엔드 테스트 (30분)
3. Vercel 배포 (10분)
4. AppinToss 심사 신청

**총 예상 시간: 약 1시간**

성공적인 출시를 기원합니다! 🚀

---

*마지막 업데이트: 2026-04-24*
*상태: Step 5 진행 중 (Edge Functions 배포 대기)*
