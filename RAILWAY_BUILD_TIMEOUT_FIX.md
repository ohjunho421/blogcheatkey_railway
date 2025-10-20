# Railway 빌드 타임아웃 해결

## 🔴 문제: Build timed out

빌드 로그 분석 결과:
```
stage-0 RUN npm install (12초)
stage-0 RUN npm install && npm run build (7초)
importing to docker (12초) → Build timed out ❌
```

**원인**: 중복 빌드 작업 + 느린 Docker 이미지 푸시

---

## ✅ 적용된 최적화

### 1. **중복 빌드 제거** (`railway.json`)
```diff
- "buildCommand": "npm install && npm run build"
+ (제거됨 - nixpacks.toml에서 자동 처리)
```

### 2. **빌드 속도 개선** (`nixpacks.toml`)
```toml
[phases.install]
- cmds = ["npm install"]
+ cmds = ["npm ci --prefer-offline --no-audit"]

[phases.build]
- cmds = ["npm run build"]
+ cmds = ["npm run build", "npm prune --production"]
```

**개선 사항**:
- `npm ci`: lockfile 기반 설치 (더 빠르고 일관성 있음)
- `--prefer-offline`: 캐시 우선 사용
- `--no-audit`: 보안 감사 건너뛰기 (빌드 시간 단축)
- `npm prune --production`: 빌드 후 devDependencies 제거 (이미지 크기 감소)

### 3. **.dockerignore 추가**
불필요한 파일 제외:
- `node_modules` (재설치됨)
- `.git`, `.env` (보안)
- 문서, 테스트 파일
- IDE 설정
- 이미지, 미디어 파일
- PowerShell 스크립트

**효과**: Docker 컨텍스트 크기 대폭 감소 → 빌드 및 푸시 속도 향상

---

## 📊 예상 빌드 시간

### 최적화 전
```
nix-env: 65초
npm install: 12초 (첫 번째)
npm install: 7초 (중복)
Docker push: 12초+ (타임아웃)
━━━━━━━━━━━━━━━━━━━━
총: 96초+ → ⏱️ TIMEOUT
```

### 최적화 후
```
nix-env: 65초 (캐싱됨)
npm ci: 5-8초 (더 빠름)
npm run build: 5-7초
npm prune: 2-3초
Docker push: 8-10초 (작은 이미지)
━━━━━━━━━━━━━━━━━━━━
총: ~85-93초 → ✅ SUCCESS
```

---

## 🚀 배포 방법

### 1. 변경사항 푸시
```bash
git add .
git commit -m "Fix Railway build timeout - optimize nixpacks and docker"
git push
```

### 2. Railway 자동 재배포
- Railway가 자동으로 새 빌드 시작
- **Deployments** 탭에서 로그 확인

### 3. 성공 확인
정상 빌드 시 다음과 같이 표시됨:
```
✓ Build completed successfully
✓ Deployment started
✓ Service is live
```

---

## 🔍 추가 최적화 (선택사항)

### Railway 설정에서 리소스 증가

Railway 대시보드 → **Settings** → **Resources**:

```
Memory: 512MB → 1GB (빌드 속도 향상)
```

**주의**: 비용이 증가할 수 있습니다.

### package.json 스크립트 최적화

빌드 속도를 더 높이려면:

```json
"scripts": {
  "build": "vite build --mode production && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --minify"
}
```

`--minify` 추가로 번들 크기 감소

---

## 🐛 여전히 타임아웃이 발생한다면?

### 1. 빌드 로그 확인
어느 단계에서 시간이 오래 걸리는지 확인:
```bash
railway logs --build
```

### 2. 의존성 감사
불필요한 dependencies 제거:
```bash
npm ls --depth=0
```

### 3. Vite 빌드 최적화
`vite.config.ts`에 다음 추가:
```typescript
export default {
  build: {
    minify: 'esbuild', // 더 빠른 minifier
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: undefined // 청크 분리 비활성화
      }
    }
  }
}
```

### 4. Railway 지원팀 문의
여전히 문제가 해결되지 않으면:
- Railway Discord: https://discord.gg/railway
- 프로젝트 ID와 빌드 로그 첨부

---

## ✅ 체크리스트

- [x] railway.json에서 중복 buildCommand 제거
- [x] nixpacks.toml 최적화 (`npm ci`, `npm prune`)
- [x] .dockerignore 파일 생성
- [ ] Git 커밋 및 푸시
- [ ] Railway 빌드 로그 확인
- [ ] 배포 성공 확인

---

**작성일**: 2025년 1월 21일  
**수정 내용**: 빌드 타임아웃 해결 - 중복 제거, 속도 최적화, Docker 이미지 크기 감소
