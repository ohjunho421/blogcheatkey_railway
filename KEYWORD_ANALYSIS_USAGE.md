# 🔍 검색의도 & 고민사항 활용 현황

## ❌ 현재 상태: 미사용

### 확인 결과

**블로그 생성 시 (`/api/projects/:id/generate`)**
```typescript
const generationResult = await strictMorphemeGenerator.generateStrictMorphemeContent(
  project.keyword,           // ✅ 사용됨
  project.subtitles,         // ✅ 사용됨
  project.researchData,      // ✅ 사용됨
  project.businessInfo,      // ✅ 사용됨
  undefined,                 // referenceLinks
  project.customMorphemes    // ✅ 사용됨
);
```

**사용되지 않는 데이터:**
- ❌ `project.keywordAnalysis.searchIntent` (검색 의도)
- ❌ `project.keywordAnalysis.userConcerns` (사용자 고민사항)

---

## 💡 개선 방안

### 1. 검색의도와 고민사항을 블로그 생성에 활용

**위치:** `server/services/anthropic.ts` - `writeOptimizedBlogPost` 함수

**추가할 프롬프트:**
```typescript
📊 키워드 분석 인사이트:
• 검색 의도: ${searchIntent}
• 사용자 고민: ${userConcerns}

💡 작성 지침:
- 검색 의도를 고려하여 사용자가 원하는 정보를 정확히 제공
- 사용자의 고민사항을 서론에서 공감하고 본론에서 해결
- 검색 의도에 맞는 톤과 깊이로 작성
```

### 2. 사용자가 수정할 수 있게 UI 개선

**현재 UI:** 읽기 전용 텍스트
```jsx
<p className="text-sm text-muted-foreground break-keep leading-relaxed">
  {project.keywordAnalysis.searchIntent}
</p>
```

**개선 후:** 편집 가능
```jsx
{isEditingIntent ? (
  <Textarea value={editedIntent} onChange={...} />
) : (
  <p>{project.keywordAnalysis.searchIntent}</p>
)}
<Button onClick={() => setIsEditingIntent(true)}>
  <Edit className="h-4 w-4" /> 수정
</Button>
```

---

## 🎯 구현 계획

1. ✅ 검색의도/고민사항이 사용되는지 확인 → **미사용 확인됨**
2. ⏳ 블로그 생성 함수에 이 데이터 추가
3. ⏳ UI에서 편집 기능 추가
4. ⏳ API 엔드포인트로 수정사항 저장

---

## 📝 다음 단계

사용자에게 다음 중 어떤 것을 먼저 구현할지 확인:
1. **검색의도/고민사항을 블로그 생성에 활용** (더 중요!)
2. **UI에서 편집 가능하게 만들기**

두 가지 모두 구현하는 것이 좋지만, 1번이 먼저 구현되어야 2번이 의미있음!
