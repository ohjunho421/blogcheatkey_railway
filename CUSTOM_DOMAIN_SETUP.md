# blogcheatkey.ai 커스텀 도메인 설정 가이드

## 📋 체크리스트

- [ ] blogcheatkey.ai 도메인 구매 완료
- [ ] Railway 프로젝트 배포 완료
- [ ] Cloudflare 계정 생성 (권장)
- [ ] DNS 제공업체 접속 가능

---

## 🚀 설정 단계

### 1. Railway에 커스텀 도메인 추가

1. Railway 대시보드 접속
2. 프로젝트 → 서비스 선택
3. **Settings** 탭 클릭
4. **Public Networking** 섹션에서 **+ Custom Domain** 클릭
5. 도메인 입력: `blogcheatkey.ai`
6. **CNAME 값 복사** (예: `abc123.up.railway.app`)

---

### 2. Cloudflare DNS 설정

#### A. 네임서버 변경 (처음 설정하는 경우)

1. **Cloudflare 대시보드** 접속
2. **Add a Site** 클릭
3. `blogcheatkey.ai` 입력
4. 플랜 선택 (Free 가능)
5. Cloudflare 네임서버 확인 (예):
   ```
   ns1.cloudflare.com
   ns2.cloudflare.com
   ```

6. **도메인 제공업체**(구매한 곳)에서:
   - 도메인 관리 페이지 접속
   - 네임서버 변경
   - Cloudflare 네임서버 입력
   - 저장

#### B. DNS 레코드 추가

Cloudflare에서:

1. **DNS** 탭 클릭
2. **Add record** 클릭

**루트 도메인 (blogcheatkey.ai)**:
```
Type: CNAME
Name: @
Target: [Railway에서 받은 CNAME 값]
Proxy status: Proxied (주황색 구름)
TTL: Auto
```

**www 서브도메인 (선택사항)**:
```
Type: CNAME
Name: www
Target: @
Proxy status: Proxied
TTL: Auto
```

3. **Save** 클릭

#### C. SSL/TLS 설정

1. Cloudflare에서 **SSL/TLS** 탭
2. **Overview** 선택
3. Encryption mode: **Full** 선택
   - ⚠️ **Full (Strict) 아님!**

4. **Edge Certificates** 선택
5. **Universal SSL**: ON 확인

---

### 3. www → 루트 도메인 리디렉션 (선택사항)

www.blogcheatkey.ai → blogcheatkey.ai 자동 리디렉션 설정:

1. Cloudflare 대시보드에서 **Bulk Redirects** 클릭
2. **Create Bulk Redirect List** 클릭
3. 이름: `www-redirect`
4. **Or, manually add URL redirects** 클릭
5. 추가:
   ```
   Source URL: https://www.blogcheatkey.ai
   Target URL: https://blogcheatkey.ai
   Status: 301
   ```
6. 옵션 체크:
   - ✅ Preserve query string
   - ✅ Include subdomains
   - ✅ Subpath matching
   - ✅ Preserve path suffix
7. **Save and Deploy**

---

### 4. Railway 확인

1. Railway 대시보드 → **Settings** → **Public Networking**
2. 도메인 상태 확인:
   ```
   ✅ blogcheatkey.ai (녹색 체크)
   🟠 Cloudflare proxy detected
   ```

**DNS 전파**: 5분 ~ 72시간 (보통 10-30분)

---

### 5. Google OAuth 업데이트

도메인 활성화 후:

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **API 및 서비스** → **사용자 인증 정보**
4. OAuth 2.0 클라이언트 ID 클릭
5. **승인된 자바스크립트 원본**에 추가:
   ```
   https://blogcheatkey.ai
   ```
6. **승인된 리디렉션 URI**에 추가:
   ```
   https://blogcheatkey.ai/api/auth/google/callback
   ```
7. **저장**

---

### 6. Railway 환경 변수 업데이트 (선택사항)

Railway Variables에 추가:
```bash
FRONTEND_URL=https://blogcheatkey.ai
```

---

## 🔍 문제 해결

### DNS가 전파되지 않음

**확인 방법**:
```bash
nslookup blogcheatkey.ai
```

또는 온라인 도구: https://dnschecker.org

**대기 시간**: 최대 72시간 (보통 5-30분)

### Cloudflare "Cloudflare proxy detected" 안 뜸

- DNS 레코드의 **Proxy status**가 **Proxied**(주황색 구름)인지 확인
- 시간이 좀 더 지나면 표시됨

### SSL 인증서 오류

1. Cloudflare SSL/TLS 모드: **Full** (Strict 아님!)
2. Railway에서 자동 발급까지 5-10분 대기

### "Invalid redirect_uri" (Google OAuth 에러)

- Google Cloud Console에서 리디렉션 URI 정확히 입력했는지 확인
- `https://` 포함 필수
- 끝에 `/` 없이 입력

---

## ✅ 최종 확인

설정 완료 후:

1. ✅ https://blogcheatkey.ai 접속 테스트
2. ✅ HTTPS 자물쇠 표시 확인
3. ✅ Google 로그인 테스트
4. ✅ 모든 기능 정상 작동 확인

---

## 📞 추가 도움

- Cloudflare 문서: https://developers.cloudflare.com/dns/
- Railway 문서: https://docs.railway.com/guides/public-networking
- Cloudflare Discord: https://discord.gg/cloudflare
- Railway Discord: https://discord.gg/railway

---

**작성일**: 2025년 1월 21일  
**도메인**: blogcheatkey.ai  
**플랫폼**: Railway + Cloudflare
