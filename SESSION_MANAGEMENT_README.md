# 세션 관리 기능 (Session Management)

## 개요

블로그 작성 내역을 저장하고 나중에 불러올 수 있는 세션 관리 기능입니다. 이 기능을 통해:

- ✅ 작성 중인 글을 세션으로 저장
- ✅ 저장된 세션을 불러와서 수정
- ✅ 같은 세션을 기반으로 새로운 글 작성
- ✅ 챗봇 대화 내역도 함께 저장

## 설치 및 마이그레이션

### 1. 데이터베이스 마이그레이션 실행

```bash
node run-session-migration.js
```

이 명령어는 `project_sessions` 테이블을 데이터베이스에 추가합니다.

### 2. 환경 변수 확인

`.env` 파일에 다음이 설정되어 있는지 확인:

```env
DATABASE_URL=your_postgresql_connection_string
```

## 기능 설명

### 세션 저장

1. 프로젝트에서 콘텐츠를 작성합니다
2. "세션 관리" 카드에서 **"현재 작업 저장"** 버튼 클릭
3. 세션 이름과 설명을 입력
4. 저장 버튼 클릭

**저장되는 내용:**
- 키워드 및 키워드 분석
- 생성된 콘텐츠
- 비즈니스 정보
- 참조 링크
- SEO 메트릭
- 챗봇 대화 내역
- 이미지 등 모든 프로젝트 데이터

### 세션 불러오기

1. "세션 관리" 카드에서 저장된 세션 목록 확인
2. 원하는 세션의 **"+"** 버튼 클릭
3. 자동으로 새 프로젝트가 생성되며 해당 세션의 모든 내용이 복원됨
4. 챗봇을 통해 콘텐츠를 수정하거나 새로운 방향으로 작성 가능

### 세션 삭제

1. 세션 카드에서 **휴지통 아이콘** 클릭
2. 확인 대화상자에서 "삭제" 클릭

## 사용 시나리오

### 시나리오 1: 초안 버전 관리
```
1. 블로그 글 초안 작성
2. "초안 v1"로 세션 저장
3. 계속 수정 작업
4. "초안 v2"로 다시 저장
5. 나중에 원하는 버전을 불러와서 비교/수정
```

### 시나리오 2: A/B 테스트
```
1. 기본 콘텐츠 작성
2. "버전 A - 캐주얼 톤"으로 저장
3. 세션 불러오기
4. 챗봇으로 "더 전문적인 톤으로 바꿔줘" 요청
5. "버전 B - 전문적 톤"으로 저장
6. 두 버전을 비교하여 최선의 선택
```

### 시나리오 3: 시리즈 글 작성
```
1. 첫 번째 시리즈 글 작성 및 저장
2. 세션 불러오기
3. 챗봇으로 "이 내용을 바탕으로 2편 작성해줘" 요청
4. 일관된 톤과 스타일로 시리즈 작성
```

## API 엔드포인트

### POST `/api/projects/:id/sessions`
현재 프로젝트를 세션으로 저장

**Request Body:**
```json
{
  "sessionName": "세션 이름",
  "sessionDescription": "설명 (선택사항)"
}
```

### GET `/api/sessions`
현재 사용자의 모든 세션 조회

### POST `/api/sessions/:sessionId/load`
세션을 새 프로젝트로 불러오기

**Request Body:**
```json
{
  "createNew": true
}
```

### DELETE `/api/sessions/:sessionId`
세션 삭제

## 데이터베이스 스키마

```sql
CREATE TABLE project_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  project_id INTEGER,
  session_name TEXT NOT NULL,
  session_description TEXT,
  keyword TEXT NOT NULL,
  keyword_analysis JSONB,
  subtitles JSONB,
  research_data JSONB,
  business_info JSONB,
  generated_content TEXT,
  seo_metrics JSONB,
  reference_links JSONB,
  generated_images JSONB,
  reference_blog_links JSONB,
  custom_morphemes TEXT,
  chat_history JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 주의사항

1. **세션 저장 시점**: 프로젝트가 생성되어야 세션을 저장할 수 있습니다
2. **저장 용량**: 각 세션은 프로젝트의 전체 스냅샷을 저장하므로, 많은 이미지나 긴 콘텐츠가 있는 경우 저장 공간을 차지할 수 있습니다
3. **세션 복원**: 세션을 불러오면 항상 **새 프로젝트**가 생성됩니다. 기존 프로젝트를 덮어쓰지 않습니다

## 트러블슈팅

### 세션이 저장되지 않음
- 프로젝트가 정상적으로 생성되었는지 확인
- 데이터베이스 연결 상태 확인
- 브라우저 콘솔에서 오류 메시지 확인

### 세션 불러오기 실패
- 해당 세션이 존재하는지 확인
- 권한이 있는지 확인 (다른 사용자의 세션은 불러올 수 없음)
- 데이터베이스 마이그레이션이 정상적으로 완료되었는지 확인

### 챗봇 대화 내역이 복원되지 않음
- 세션 저장 시 챗봇 대화가 있었는지 확인
- `chat_history` 필드가 올바르게 저장되었는지 데이터베이스에서 확인

## 향후 개선 사항

- [ ] 세션 태그/카테고리 기능
- [ ] 세션 검색 기능
- [ ] 세션 공유 기능
- [ ] 세션 비교 기능
- [ ] 세션 자동 저장 (Auto-save)
- [ ] 세션 버전 관리 (Git-like versioning)
