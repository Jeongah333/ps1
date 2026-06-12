# 오늘 몇 퍼센트?

수면시간, 기분, 피로도를 기반으로 오늘의 체력 점수를 계산하고 컨디션에 맞는 할 일을 추천하는 모바일 우선 React 앱입니다.

## 실행

```bash
npm install
npm run dev
```

Firebase 환경변수가 없으면 브라우저 로컬 저장소를 사용하는 데모 모드로 실행됩니다.

## Firebase 연결

1. `.env.example`을 `.env.local`로 복사하고 Firebase 프로젝트 설정값을 입력합니다.
2. Firebase Console에서 Authentication의 이메일/비밀번호와 Google 공급자를 활성화합니다.
3. Realtime Database를 생성하고 아래 보안 규칙을 적용합니다.

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "$uid === auth.uid",
        ".write": "$uid === auth.uid"
      }
    }
  }
}
```

카카오와 네이버 로그인은 Firebase에서 기본 제공하지 않습니다. 현재 UI는 포함되어 있으며, 실제 운영 연결에는 별도 서버에서 OAuth 인증 후 Firebase Custom Token을 발급하는 과정이 필요합니다.

## 배포

GitHub 저장소에 올린 뒤 Vercel에서 저장소를 연결하고 Firebase 환경변수를 등록합니다. 빌드 명령은 `npm run build`, 출력 폴더는 `dist`입니다.
Vercel 배포
