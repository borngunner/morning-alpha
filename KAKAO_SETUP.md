# 카카오톡 발송 설정

Morning Alpha 2.0은 카카오 Developers의 `나에게 보내기` API를 사용합니다.

카카오톡에는 전체 리포트를 보내지 않고, 짧은 요약과 `웹에서 자세히 보기` 버튼만 보냅니다.

## 필요한 값

Vercel의 `Settings > Environment Variables`에 아래 값을 넣습니다.

```env
PUBLIC_APP_URL=https://내-vercel-주소.vercel.app
KAKAO_REST_API_KEY=
KAKAO_CLIENT_SECRET=
KAKAO_ACCESS_TOKEN=
KAKAO_REFRESH_TOKEN=
KAKAO_DAILY_SEND=1
KAKAO_SEND_SECRET=길고_복잡한_문자
CRON_SECRET=길고_복잡한_문자
```

## 수동 발송

웹에서 PIN 로그인 후 `주식관련 뉴스` 탭의 `카카오톡으로 보내기` 버튼을 누릅니다.

이 버튼은 현재 리포트를 요약해서 카카오톡으로 보냅니다.

## 매일 오전 7시 자동 발송

Vercel Cron이 매일 한국시간 오전 7시에 아래 API를 실행합니다.

```text
/api/cron/morning-report
```

`KAKAO_DAILY_SEND=1`이면 리포트를 생성한 뒤 카카오톡 요약도 자동으로 보냅니다.

끄려면:

```env
KAKAO_DAILY_SEND=0
```

## 주의

Vercel Cron은 Vercel 배포 후 동작합니다.

로컬 컴퓨터에서 `start-morning-alpha.cmd`를 켜지 않아도, Vercel에 배포되어 있으면 자동 실행됩니다.
