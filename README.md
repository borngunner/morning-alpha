# Morning Alpha 2.0

가족끼리 쓰는 주식 브리핑 웹앱입니다.

매일 오전 7시에 시장 리포트를 만들고, 카카오톡에는 전체 내용이 아니라 짧은 요약만 보냅니다. 자세한 내용은 웹에서 확인합니다.

## 핵심 변화

- Render를 사용하지 않습니다.
- `server.js`를 사용하지 않습니다.
- Vercel의 Serverless API와 Cron으로 동작합니다.
- 화면 파일은 `public/`에 있습니다.
- 리포트, 카카오, 보유종목 점검 로직은 `services/`에 있습니다.
- 로그인, 요청, 응답 같은 공통 기능은 `lib/`에 있습니다.

## 폴더 구조

```text
morning-alpha/
├─ public/
│  ├─ index.html          # 웹 화면
│  ├─ app.js              # 화면 동작
│  └─ styles.css          # 디자인
├─ api/
│  ├─ health.js           # 서비스 상태 확인
│  ├─ login.js            # PIN 로그인
│  ├─ logout.js           # 로그아웃
│  ├─ session.js          # 로그인 상태 확인
│  ├─ report.js           # 현재 리포트 조회/생성
│  ├─ kakao/
│  │  ├─ status.js        # 카카오 설정 상태 확인
│  │  └─ send-today.js    # 현재 리포트 요약 카카오 전송
│  ├─ portfolio/
│  │  └─ analyze.js       # 내가 입력한 보유종목 점검
│  └─ cron/
│     └─ morning-report.js # 매일 오전 7시 자동 리포트 생성/카카오 전송
├─ services/
│  ├─ morningAlphaCore.cjs # 시장/뉴스/종목 분석 핵심 로직
│  ├─ reportService.js    # 리포트 서비스
│  └─ kakaoService.js     # 카카오 요약 전송 서비스
├─ lib/
│  ├─ http.js             # JSON 응답, 요청 본문 읽기
│  └─ session.js          # PIN 로그인 세션
├─ vercel.json            # Vercel Cron 설정
└─ .env.example           # 환경변수 예시
```

## 기능

- PIN 로그인
- 글로벌 시장, KOSPI, KOSDAQ, 환율 확인
- 반도체, 에너지, 조선, 광통신, 우주·방산, 전력·원전 섹터 점검
- 국내 관심 종목 후보 분석
- AI 투자 보조판
- 내가 직접 입력하는 보유종목 점검
- 오늘 뉴스와 어제·이전 뉴스 분리
- 긴급사항은 사이트 안의 종모양 메모로만 표시
- 카카오톡 요약 전송
- 매일 오전 7시 자동 리포트 생성 및 카카오톡 요약 전송

## 카카오톡 발송 방식

카카오톡에는 전체 리포트를 보내지 않습니다.

카카오톡에는 아래처럼 짧은 요약만 보냅니다.

- 리포트 생성 시간
- 시장 분위기
- 주요 리스크
- 관심 테마
- 주요 뉴스 몇 개
- `웹에서 자세히 보기` 버튼

자세한 종목 분석, 공부 내용, 보유종목 점검은 웹에서 봅니다.

## 매일 오전 7시 자동 발송

`vercel.json`에 Vercel Cron이 설정되어 있습니다.

```json
{
  "crons": [
    {
      "path": "/api/cron/morning-report",
      "schedule": "0 22 * * *"
    }
  ]
}
```

Vercel Cron은 UTC 기준입니다.

한국시간 오전 7시는 UTC 전날 22시라서 `0 22 * * *`를 사용합니다.

자동 발송 흐름은 이렇습니다.

```text
오전 7시
→ /api/cron/morning-report 실행
→ 최신 리포트 생성
→ KAKAO_DAILY_SEND=1이면 카카오톡 요약 발송
```

## 웹의 카카오 전송 버튼

웹에서 `카카오톡으로 보내기` 버튼을 누르면 `/api/kakao/send-today`가 실행됩니다.

이 버튼은 새 전체 리포트를 카카오로 보내는 것이 아니라, 현재 리포트를 짧게 요약해서 보냅니다.

카카오 메시지에는 `웹에서 자세히 보기` 버튼이 들어갑니다.

## Vercel 환경변수

Vercel 프로젝트에서 아래로 들어갑니다.

```text
Settings > Environment Variables
```

아래 값을 넣습니다.

```env
APP_PIN=가족이 사용할 PIN
SESSION_SECRET=길고_아무거나_복잡한_문자
PUBLIC_APP_URL=https://내-vercel-주소.vercel.app

KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=
KAKAO_ACCESS_TOKEN=
KAKAO_REFRESH_TOKEN=
KAKAO_DAILY_SEND=1

KAKAO_SEND_SECRET=길고_아무거나_복잡한_문자
CRON_SECRET=길고_아무거나_복잡한_문자
```

처음에는 카카오 자동 발송을 끄고 테스트하고 싶다면 이렇게 둡니다.

```env
KAKAO_DAILY_SEND=0
```

테스트가 끝나면 `1`로 바꿉니다.

## 배포 방법

1. GitHub 저장소에 이 프로젝트 파일을 올립니다.
2. Vercel에 로그인합니다.
3. `New Project`를 누릅니다.
4. GitHub 저장소를 선택합니다.
5. 환경변수를 넣습니다.
6. `Deploy`를 누릅니다.

Vercel은 자동으로:

- `public/`을 웹 화면으로 배포합니다.
- `api/`를 Serverless API로 배포합니다.
- `vercel.json`의 Cron을 등록합니다.

## 로컬에서 확인

Vercel CLI를 사용할 수 있다면:

```bash
npx vercel dev
```

검사는:

```bash
npm run check
```

## 주의

이 앱은 가족용 투자 공부 및 점검 도구입니다.

매수·매도 지시가 아니라 공부와 판단 보조용입니다. 최종 투자 판단과 책임은 사용자에게 있습니다.

## Vercel에서 `document is not defined`가 뜰 때

Vercel 로그에 `/var/task/app.cjs`가 보이면, 루트에 남아 있는 예전 `app.js`가 Serverless Function으로 포장된 경우일 수 있습니다.

Morning Alpha 2.0에서 브라우저 코드는 `public/app.js`에만 있어야 합니다.

아래 파일은 루트에 있으면 안 됩니다.

```text
app.js
app.cjs
index.html
styles.css
server.js
render.yaml
```

이 프로젝트는 `.vercelignore`에서 위 파일들을 배포 대상에서 제외합니다.

Vercel은 `public/` 안의 파일을 자동으로 정적 파일로 제공합니다.

따라서 `/` 접속은 `public/index.html`을 보여줘야 합니다.

Vercel 프로젝트 설정에서 `Root Directory`는 이 파일들이 들어 있는 프로젝트 최상위 폴더여야 합니다.

정상 Root Directory에는 아래가 바로 보여야 합니다.

```text
api/
lib/
services/
public/
scripts/
package.json
vercel.json
```

`vercel.json`은 `/api/**`가 아닌 모든 화면 요청을 `/index.html`로 보내도록 설정되어 있습니다.
