# GitHub 동기화 스크립트

Write-Host "📤 로컬 변경사항을 GitHub에 업로드합니다..." -ForegroundColor Cyan

# 1. railway.json 변경사항 (중요)
Write-Host "`n✅ railway.json 업데이트 (db:push 제거)" -ForegroundColor Green
git add railway.json

# 2. 문서 파일 추가
Write-Host "✅ 문서 파일 추가" -ForegroundColor Green
git add GITHUB_BRANCH_CLEANUP.md
git add CHATBOT_ENHANCEMENT.md

# 3. DB 설정 파일 추가 (중요)
Write-Host "✅ DB 설정 파일 추가" -ForegroundColor Green
git add create-tables.js
git add init-railway-db.sql

# 4. 임시 스크립트 파일은 .gitignore에 추가
Write-Host "`n⚠️  임시 스크립트 파일은 .gitignore에 추가" -ForegroundColor Yellow
Add-Content -Path .gitignore -Value "`n# Temporary scripts`ncleanup-branches.ps1`ncommit-*.ps1`nsetup-*.ps1`nsetup-*.js"

# 5. 상태 확인
Write-Host "`n📊 커밋할 파일:" -ForegroundColor Cyan
git status --short

# 6. 커밋
Write-Host "`n💾 변경사항 커밋..." -ForegroundColor Cyan
git commit -m "chore: Sync local changes with GitHub

- Update railway.json (remove db:push from build)
- Add documentation (branch cleanup, chatbot enhancement)
- Add database setup files (create-tables.js, init-railway-db.sql)
- Update .gitignore for temporary scripts"

# 7. 푸시
Write-Host "`n🚀 GitHub에 푸시..." -ForegroundColor Cyan
git push origin main

Write-Host "`n✅ GitHub 동기화 완료!" -ForegroundColor Green
Write-Host "`n📊 최종 상태:" -ForegroundColor Cyan
git log --oneline -3
