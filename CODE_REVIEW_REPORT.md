# 🔍 모두의 판타지 - 종합 코드 리뷰 보고서

**작성일**: 2026년 4월 19일
**앱 이름**: 모두의 판타지 (Everyone's Fantasy)
**검토 범위**: index.html, api/chat.js
**심각도 분류**: 🔴 심각, 🟠 중간, 🟡 낮음

---

## 📋 발견된 주요 이슈

### 🔴 심각 (Severity: Critical)

#### 1. **타임존 불일치 - localStorage 일일 리셋 로직 오류**
**위치**: index.html 라인 4024, 4054
**문제**:
```javascript
const today = new Date().toISOString().slice(0, 10);
```
- `toISOString()`은 UTC 기준이므로 한국 시간(KST, UTC+9)과 9시간 차이 발생
- 예: 한국 오후 3시 = UTC 오전 6시 → 다른 날짜로 인식
- 무료 횟수(`USAGE_STORE`), 광고 시청(`AD_STORE`)의 일일 리셋이 정상 작동하지 않음

**권장사항**:
```javascript
const today = new Date().toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' });
// 또는
const date = new Date();
date.setHours(date.getHours() + 9); // KST 변환
const today = date.toISOString().slice(0, 10);
```

**영향도**: 매우 높음 - 사용자가 실제로 무료 횟수를 제대로 못 쓸 수 있음

---

#### 2. **XSS(Cross-Site Scripting) 취약점**
**위치**: index.html 라인 4510
**문제**:
```javascript
function addWcMsg(role, text, scroll = true) {
  const div = document.createElement('div');
  div.className = 'wc-msg ' + role;
  div.innerHTML = `<div class="wc-bubble">${text.replace(/\n/g,'<br>')}</div>`;
  // ⚠️ 사용자 입력 text가 그대로 HTML에 삽입됨
}
```
- 악의적 사용자가 `<script>` 태그 포함 메시지 전송 가능
- 대사에 `<img onerror="...">` 등으로 임의 코드 실행 가능
- API 응답도 동일 위험 (라인 4791, 4815)

**수정**:
```javascript
function addWcMsg(role, text, scroll = true) {
  const div = document.createElement('div');
  div.className = 'wc-msg ' + role;
  const bubble = document.createElement('div');
  bubble.className = 'wc-bubble';
  bubble.textContent = text; // innerHTML 대신 textContent 사용
  div.appendChild(bubble);
  msgEl.insertBefore(div, typing);
}
```

**영향도**: 높음 - 보안 위반. AppinToss에서 거절될 수 있음

---

#### 3. **상태 동기화 불일치**
**위치**: index.html 라인 4741, 4860
**문제**:
```javascript
// _execWritingAI에서
writingHistory.push({ role: 'user', content: userMsg });

// autoSaveEpisode에서
S.episodes[currentEpIdx].chatHistory = writingHistory;
```
- `writingHistory`는 메모리에만 존재, DB 저장은 별도
- 페이지 새로고침 → writingHistory 손실 → 복원 로직이 있지만 중간 과정 누락 가능
- 여러 탭에서 동시 편집 시 마지막 저장 이전 기록 손실

**수정**:
```javascript
async function _execWritingAI(userMsg) {
  const epIdx = currentEpIdx;
  writingHistory.push({ role: 'user', content: userMsg });
  S.episodes[epIdx].chatHistory = [...writingHistory]; // 실시간 동기화
  save(); // 즉시 저장

  try {
    const res = await fetch('/api/chat', { ... });
    const reply = data.content?.[0]?.text;
    writingHistory.push({ role: 'assistant', content: reply });
    S.episodes[epIdx].chatHistory = [...writingHistory];
    save(); // 응답 후 다시 저장
  }
}
```

**영향도**: 높음 - 작성 중인 대화 기록 손실 가능

---

### 🟠 중간 심각도 (Severity: Medium)

#### 4. **Race Condition - 중복 API 요청 방지 미흡**
**위치**: index.html 라인 4722-4731
**문제**:
```javascript
async function callWritingAI(userMsg) {
  if (writingLoading) return; // ✅ 체크
  if (!canWriteNow()) {
    updateWritingInputState();
    return; // ⚠️ 이 사이에 상태 변경 가능
  }
  _execWritingAI(userMsg); // 여기서 writingLoading = true로 설정
}
```
- `canWriteNow()` 체크와 `_execWritingAI()` 호출 사이의 마이크로초 차이로 상태 불일치 가능
- 빠른 클릭으로 중복 요청 발생 가능

**수정**:
```javascript
async function callWritingAI(userMsg) {
  if (writingLoading || !canWriteNow()) {
    updateWritingInputState();
    return;
  }
  writingLoading = true; // 즉시 플래그 설정
  setWritingLoading(true);
  await _execWritingAI(userMsg);
}
```

**영향도**: 중간 - 불필요한 API 호출로 토큰 소모

---

#### 5. **메모리 누수 - 타이머 미정리**
**위치**: index.html 라인 4535-4541
**문제**:
```javascript
function setWritingLoading(v) {
  if(v && loadingText) {
    _loadingMsgTimer = setInterval(() => { ... }, 2500);
  } else {
    if(_loadingMsgTimer) {
      clearInterval(_loadingMsgTimer);
      _loadingMsgTimer = null;
    }
  }
}
```
- `setWritingLoading(false)` 호출 전에 페이지 이동 → 타이머 계속 실행
- 특히 goBack() 호출 시 타이머 정리 확인 필요

**관련 코드**: index.html 라인 2790-2815 (goBack 함수)

**수정**:
```javascript
function goBack() {
  // 타이머 정리 추가
  setWritingLoading(false); // 또는 명시적으로 clearInterval
  if (_loadingMsgTimer) {
    clearInterval(_loadingMsgTimer);
    _loadingMsgTimer = null;
  }

  // 기존 로직...
  const ep = S.episodes[navHistory[navHistory.length - 1]];
}
```

**영향도**: 중간 - 배터리 소모, 성능 저하

---

#### 6. **입력값 검증 부족**
**위치**: index.html 라인 3492-3499, 3478-3488
**문제**:
```javascript
function createProject() {
  const titleVal = document.getElementById('inp-proj-title')?.value.trim();
  if (!titleVal) {
    showToast('제목을 입력해주세요');
    return;
  }
  // ⚠️ 길이 제한 없음, 특수문자 검증 없음

  const newProject = {
    projectTitle: titleVal, // 무제한 길이
    // ...
  };
}

function createEpisode() {
  const title = document.getElementById('inp-ep-title')?.value.trim();
  if(!title) {
    showToast('제목을 입력해주세요');
    return;
  }
  // ⚠️ 여기도 길이 제한 없음
}
```

**수정**:
```javascript
function createProject() {
  const titleVal = document.getElementById('inp-proj-title')?.value.trim();
  if (!titleVal) { showToast('제목을 입력해주세요'); return; }
  if (titleVal.length > 100) { showToast('제목은 100자 이내여야 해요'); return; }
  // ...
}
```

**영향도**: 낮음 - UI 깨짐 가능성

---

#### 7. **API 응답 파싱 오류 처리 부족**
**위치**: index.html 라인 4789-4790
**문제**:
```javascript
const reply = data.content?.[0]?.text || '오류가 발생했어요. 다시 시도해주세요.';
writingHistory.push({ role: 'assistant', content: reply });
const chatText = extractManuscript(reply);
if (chatText) {
  incrementUsage(); // 원고가 없어도 차감됨 (대화만 있어도)
}
```
- `data.content[0].text`가 빈 문자열이면?
- 응답 구조가 예상과 다르면?

**수정**:
```javascript
const reply = data.content?.[0]?.text;
if (!reply || typeof reply !== 'string') {
  addWcMsg('ai', '⚠️ API 응답이 올바르지 않아요');
  setWritingLoading(false);
  return;
}
writingHistory.push({ role: 'assistant', content: reply });
```

**영향도**: 낮음 - 안정성 개선

---

### 🟡 낮은 심각도 (Severity: Low)

#### 8. **null 참조 위험**
**위치**: 라인 4856-4864
**문제**:
```javascript
function autoSaveEpisode() {
  if(currentEpIdx === null) return; // ✅ 체크 있음
  const wmText = document.getElementById('wm-text');
  S.episodes[currentEpIdx].manuscript = wmText.innerText.trim(); // ⚠️ wmText가 null이면?
}
```

**수정**:
```javascript
function autoSaveEpisode() {
  if(currentEpIdx === null || !S.episodes[currentEpIdx]) return;
  const wmText = document.getElementById('wm-text');
  if (!wmText) return;
  S.episodes[currentEpIdx].manuscript = wmText.innerText.trim();
}
```

---

#### 9. **삭제 작업 시 인덱스 검증**
**위치**: 라인 3214-3219
**문제**:
```javascript
function deleteChar(idx) {
  S.characters.splice(idx, 1); // idx 유효성 검증 없음
  save(); refreshAll();
}
```

**수정**:
```javascript
function deleteChar(idx) {
  if (idx < 0 || idx >= S.characters.length) return;
  S.characters.splice(idx, 1);
  save(); refreshAll();
}
```

---

#### 10. **localStorage 용량 체크 부재**
**위치**: 여러 save() 호출 지점
**문제**:
- localStorage 제한은 보통 5-10MB
- 에피소드 많아지면 저장 실패 가능

**권장사항**:
```javascript
function save() {
  try {
    const data = JSON.stringify(DB);
    localStorage.setItem(STORE_KEY, data);
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      showToast('저장 공간이 가득 찼어요. 불필요한 데이터를 삭제해주세요.');
    }
  }
}
```

---

## ✅ 잘된 부분

1. **API 폴백 시스템** - Claude → GPT 자동 전환 (좋음)
2. **deductCount 플래그** - 실패 시 차감 방지 (좋음)
3. **타이핑 애니메이션 XSS 방지** - `addWcMsgAnimated`의 이스케이프 처리 (좋음)
4. **Responsive 레이아웃** - flexbox 사용 (좋음)
5. **네비게이션 히스토리** - goBack() 함수 구현 (좋음)

---

## 🎯 출시 전 필수 수정 리스트

| 순위 | 이슈 | 수정 여부 | 테스트 방법 |
|------|------|----------|-----------|
| 1️⃣ | 타임존 UTC 변환 | ❌ | 오후 3시 이후 앱 새로고침 후 무료 횟수 확인 |
| 2️⃣ | XSS 취약점 (`innerHTML` → `textContent`) | ❌ | 채팅에 `<script>alert('xss')</script>` 입력 |
| 3️⃣ | 상태 동기화 (writingHistory ↔ chatHistory) | ❌ | 페이지 새로고침 후 채팅 기록 확인 |
| 4️⃣ | Race condition (writingLoading 플래그) | ❌ | 빠른 연속 클릭으로 중복 요청 확인 |
| 5️⃣ | 타이머 메모리 누수 | ❌ | 화면 이동 중 로딩 중단 시 DevTools 메모리 확인 |
| 6️⃣ | 입력값 길이 검증 추가 | ❌ | 매우 긴 제목 입력 후 UI 확인 |
| 7️⃣ | API 응답 파싱 견고성 | ❌ | 네트워크 느림으로 시뮬레이션 |

---

## 🧪 테스트 체크리스트

### 모바일 환경 (AppinToss WebView)
- [ ] 안드로이드 기기에서 오후 3시~자정 사이 앱 테스트 (타임존)
- [ ] 빠른 네트워크 (와이파이)와 느린 네트워크 (4G) 모두 테스트
- [ ] 배터리 절약 모드에서 앱 동작 확인
- [ ] 화면 회전 시 상태 유지 확인

### 기능 테스트
- [ ] 새 프로젝트 생성 → 집필 → 저장 → 새로고침 → 복원 확인
- [ ] 무료 1회 소진 → 광고 시청 → 추가 횟수 확인
- [ ] 자정 넘어가기 (시뮬레이션 가능하면)
- [ ] 채팅 기록 많음 (100개 메시지 이상)
- [ ] 원고 길어짐 (5,000자 이상)

### 보안 테스트
- [ ] 입력 필드에 `<script>` 태그 입력
- [ ] 매우 긴 문자열 입력 (10,000자+)
- [ ] 특수문자 및 이모지 포함 입력

---

## 📌 추가 권장사항

1. **DevTools 콘솔 확인** - 출시 전 모든 경고/오류 메시지 제거
2. **오프라인 테스트** - Wi-Fi 끄고 앱 동작 확인
3. **앱인토스 가이드라인** - WebView viewport-fit, 터치 영역 등 재확인
4. **성능 최적화** - 매우 많은 에피소드 (1,000화) 시뮬레이션
5. **다국어 대응** - 현재 한국어만 지원하지만 UI 텍스트 검토

---

**작성자**: Claude AI
**검토 완료**: 2026년 4월 19일
