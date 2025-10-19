# 관리자 기능 배포 스크립트

Write-Host "🎯 관리자 페이지 개선 사항 배포 시작..." -ForegroundColor Cyan

# 1. 변경사항 확인
Write-Host "`n📊 변경된 파일 목록:" -ForegroundColor Cyan
git status --short

# 2. 파일 추가
Write-Host "`n📦 파일 추가 중..." -ForegroundColor Cyan
git add shared/schema.ts
git add server/admin-routes.ts
git add server/routes.ts
git add client/src/pages/admin-dashboard.tsx
git add client/src/components/admin/UserManagementTab.tsx
git add client/src/components/admin/PaymentManagementTab.tsx
git add client/src/components/admin/ActivityLogTab.tsx
git add client/src/App.tsx
git add migration-admin-features.sql
git add ADMIN_FEATURES_README.md

# 3. 커밋
Write-Host "`n💾 커밋 중..." -ForegroundColor Cyan
git commit -m "feat: Enhanced admin dashboard with payment and activity management

Features:
- User subscription management (grant/revoke)
- Payment confirmation system (bank transfer)
- Activity logging (content, image, chatbot usage)
- Token usage tracking
- Detailed user statistics
- Real-time subscription status

Database:
- Added user_activity_log table
- Added payment_records table
- Added token tracking fields to users

UI Components:
- New admin dashboard with 3 tabs
- User management tab (subscription control)
- Payment management tab (confirm/reject)
- Activity log tab (usage tracking)

Migration required: run migration-admin-features.sql"

# 4. 푸시
Write-Host "`n🚀 GitHub에 푸시 중..." -ForegroundColor Cyan
git push origin main

Write-Host "`n✅ 코드 배포 완료!" -ForegroundColor Green

# 5. DB Migration 안내
Write-Host "`n⚠️  다음 단계: DB Migration 실행 필요" -ForegroundColor Yellow
Write-Host ""
Write-Host "Railway에서 다음 명령어를 실행하세요:" -ForegroundColor White
Write-Host "railway run node -e `"require('fs').readFileSync('migration-admin-features.sql','utf8').split(';').forEach(sql=>require('pg').Pool({connectionString:process.env.DATABASE_URL}).query(sql))`"" -ForegroundColor Gray
Write-Host ""
Write-Host "또는 Railway 대시보드의 PostgreSQL Query 탭에서" -ForegroundColor White
Write-Host "migration-admin-features.sql 파일 내용을 직접 실행하세요." -ForegroundColor White
Write-Host ""
Write-Host "📖 자세한 내용: ADMIN_FEATURES_README.md" -ForegroundColor Cyan
