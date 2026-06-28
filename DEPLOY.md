# 배포 안내

Morning Alpha 2.0은 Render가 아니라 Vercel에 배포합니다.

## 순서

1. GitHub 저장소에 파일을 업로드합니다.
2. Vercel에서 `New Project`를 누릅니다.
3. GitHub 저장소를 선택합니다.
4. 환경변수를 입력합니다.
5. Deploy를 누릅니다.

자세한 설명은 [README.md](./README.md)를 보면 됩니다.

## 중요한 점

- `server.js`는 사용하지 않습니다.
- `public/`은 웹 화면입니다.
- `api/`는 Vercel Serverless API입니다.
- 매일 오전 7시 실행은 `vercel.json`의 Cron이 담당합니다.
- Vercel의 `Root Directory`는 `api`, `public`, `package.json`, `vercel.json`이 바로 보이는 폴더여야 합니다.
- `/`에서 404가 나오면 대부분 Root Directory가 한 단계 위/아래로 잘못 잡힌 경우입니다.
