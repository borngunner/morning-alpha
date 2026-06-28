const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const PUBLIC_APP_URL = String(process.env.PUBLIC_APP_URL || "http://127.0.0.1:3000");
const KAKAO_REST_API_KEY = String(process.env.KAKAO_REST_API_KEY || "");
const KAKAO_CLIENT_SECRET = String(process.env.KAKAO_CLIENT_SECRET || "");
const KAKAO_ACCESS_TOKEN = String(process.env.KAKAO_ACCESS_TOKEN || "");
const KAKAO_REFRESH_TOKEN = String(process.env.KAKAO_REFRESH_TOKEN || "");
const KAKAO_DAILY_SEND = String(process.env.KAKAO_DAILY_SEND || "0") === "1";
const ROOT = path.join(__dirname, "..");
const WRITE_ROOT = process.env.VERCEL ? os.tmpdir() : ROOT;
const REPORT_FILE = path.join(WRITE_ROOT, "latest-report.json");
const KAKAO_SENT_FILE = path.join(WRITE_ROOT, "kakao-sent.json");

const sectors = [
  {
    name: "반도체",
    query: "AI semiconductor HBM memory chip Korea market",
    tickers: [
      ["삼성전자", "005930", "KOSPI", "005930.KS"],
      ["SK하이닉스", "000660", "KOSPI", "000660.KS"],
      ["한미반도체", "042700", "KOSPI", "042700.KS"]
    ],
    keywords: ["AI", "HBM", "데이터센터", "메모리", "파운드리"]
  },
  {
    name: "에너지",
    query: "oil LNG renewable energy power grid market",
    tickers: [
      ["한화솔루션", "009830", "KOSPI", "009830.KS"],
      ["S-Oil", "010950", "KOSPI", "010950.KS"],
      ["HD현대일렉트릭", "267260", "KOSPI", "267260.KS"]
    ],
    keywords: ["유가", "LNG", "전력", "재생에너지", "원전"]
  },
  {
    name: "조선",
    query: "Korea shipbuilding LNG carrier order market",
    tickers: [
      ["HD한국조선해양", "009540", "KOSPI", "009540.KS"],
      ["한화오션", "042660", "KOSPI", "042660.KS"],
      ["삼성중공업", "010140", "KOSPI", "010140.KS"]
    ],
    keywords: ["LNG선", "수주", "선가", "친환경선", "해운"]
  },
  {
    name: "광통신",
    query: "optical communication data center fiber optics AI network",
    tickers: [
      ["대한광통신", "010170", "KOSDAQ", "010170.KQ"],
      ["오이솔루션", "138080", "KOSDAQ", "138080.KQ"],
      ["이수페타시스", "007660", "KOSPI", "007660.KS"]
    ],
    keywords: ["광모듈", "데이터센터", "네트워크", "AI 인프라", "통신장비"]
  },
  {
    name: "우주·방산",
    query: "aerospace defense contract Korea market",
    tickers: [
      ["한화에어로스페이스", "012450", "KOSPI", "012450.KS"],
      ["한국항공우주", "047810", "KOSPI", "047810.KS"],
      ["LIG넥스원", "079550", "KOSPI", "079550.KS"]
    ],
    keywords: ["수출", "방산", "우주", "항공", "지정학"]
  },
  {
    name: "전력·원전",
    query: "power grid nuclear energy transformer electricity demand",
    tickers: [
      ["두산에너빌리티", "034020", "KOSPI", "034020.KS"],
      ["LS ELECTRIC", "010120", "KOSPI", "010120.KS"],
      ["효성중공업", "298040", "KOSPI", "298040.KS"]
    ],
    keywords: ["전력망", "변압기", "원전", "전기수요", "인프라"]
  }
];

const marketSymbols = [
  ["NASDAQ", "^IXIC"],
  ["S&P 500", "^GSPC"],
  ["KOSPI", "^KS11"],
  ["KOSDAQ", "^KQ11"],
  ["USD/KRW", "KRW=X"]
];

const emergencyQueries = [
  { query: "코스피 코스닥 서킷브레이커 사이드카", sector: "긴급 시장" },
  { query: "KOSPI KOSDAQ circuit breaker sidecar Korea", sector: "긴급 시장" }
];

const portfolioHoldings = [
  { name: "삼성전자", ticker: "005930", market: "KOSPI", quoteSymbol: "005930.KS", averagePrice: 286000, shares: 2 },
  { name: "LG CNS", ticker: "064400", market: "KOSPI", quoteSymbol: "064400.KS", averagePrice: 142500, shares: 4 },
  { name: "두산로보틱스", ticker: "454910", market: "KOSPI", quoteSymbol: "454910.KS", averagePrice: 121300, shares: 3 },
  { name: "SOL AI반도체TOP2플러스", ticker: "0167A0", market: "ETF", quoteSymbol: null, averagePrice: 23000, shares: 8 },
  { name: "대한광통신", ticker: "010170", market: "KOSDAQ", quoteSymbol: "010170.KQ", averagePrice: 24000, shares: 10 },
  { name: "스피어", ticker: null, market: "KOSDAQ", quoteSymbol: null, averagePrice: 40550, shares: 5, note: "정확한 종목명/종목코드 확인 필요" },
  { name: "흥구석유", ticker: "024060", market: "KOSDAQ", quoteSymbol: "024060.KQ", averagePrice: 16353, shares: 10 },
  { name: "현대무벡스", ticker: "319400", market: "KOSDAQ", quoteSymbol: "319400.KQ", averagePrice: 41700, shares: 2 }
];

const fallbackNews = [
  {
    title: "AI 데이터센터 투자가 반도체, 전력기기, 광통신 수요를 함께 자극",
    source: "Morning Alpha",
    region: "GLOBAL",
    sector: "반도체",
    impact: "HBM, 서버용 메모리, 전력 인프라 관련 기업의 실적 흐름을 같이 확인할 필요가 있습니다.",
    url: "https://news.google.com/"
  },
  {
    title: "LNG 운반선 교체 수요와 친환경 선박 발주 흐름이 조선 업종 관심을 유지",
    source: "Morning Alpha",
    region: "GLOBAL",
    sector: "조선",
    impact: "수주잔고, 선가, 환율이 국내 대형 조선사의 실적 기대에 영향을 줄 수 있습니다.",
    url: "https://news.google.com/"
  },
  {
    title: "전력망 교체와 원전 투자 논의가 전력기기 밸류체인에 우호적 배경 제공",
    source: "Morning Alpha",
    region: "US",
    sector: "전력·원전",
    impact: "변압기, 송배전, 원전 기자재 기업은 수주와 마진 추이를 함께 봐야 합니다.",
    url: "https://news.google.com/"
  },
  {
    title: "지정학 긴장과 수출 계약 이슈로 방산 업종의 변동성 확대 가능",
    source: "Morning Alpha",
    region: "GLOBAL",
    sector: "우주·방산",
    impact: "방산주는 장기 수주가 장점이지만 환율과 정책 변화도 같이 확인해야 합니다.",
    url: "https://news.google.com/"
  }
];

fallbackNews.forEach((item) => {
  item.publishedAt = item.publishedAt || new Date().toISOString();
  item.dateKey = item.dateKey || seoulDateKey(new Date(item.publishedAt));
  item.ageLabel = item.ageLabel || newsAgeLabel(item.publishedAt);
});

const lessons = [
  {
    title: "주식은 회사의 일부를 사는 것",
    body: "주가는 매일 흔들리지만, 본질은 회사의 이익과 성장 가능성입니다. 먼저 이 회사가 무엇으로 돈을 버는지 한 문장으로 설명해 보세요.",
    terms: ["매출", "영업이익", "사업모델"]
  },
  {
    title: "좋은 뉴스와 좋은 투자는 다르다",
    body: "뉴스가 좋아도 이미 주가에 반영됐을 수 있습니다. 뉴스, 실적, 가격 위치를 함께 보고 너무 늦게 따라붙는 매수는 피하세요.",
    terms: ["선반영", "추격매수", "모멘텀"]
  },
  {
    title: "초보자는 리스크를 먼저 정한다",
    body: "얼마를 벌 수 있을지보다 얼마까지 잃어도 되는지를 먼저 정하세요. 한 종목에 돈을 몰아넣지 않는 습관이 오래 살아남는 힘입니다.",
    terms: ["손절 기준", "분할 매수", "현금 비중"]
  },
  {
    title: "테마와 종목을 구분하기",
    body: "반도체가 좋다고 반도체 관련주가 전부 좋은 것은 아닙니다. 대장주, 실적주, 단순 동반주를 나눠서 봐야 합니다.",
    terms: ["대장주", "동반주", "밸류체인"]
  }
];

const beginnerGuide = {
  intro: "처음에는 맞히려고 하지 말고 이해하려고 접근하세요. 주식 공부의 목표는 오늘 바로 수익을 내는 것이 아니라, 반복 가능한 판단 기준을 만드는 것입니다.",
  path: [
    {
      step: "1단계",
      title: "시장 분위기 보기",
      body: "나스닥, 코스피, 코스닥, 환율이 강한지 약한지 먼저 봅니다. 시장 전체가 약하면 좋은 종목도 같이 흔들릴 수 있습니다."
    },
    {
      step: "2단계",
      title: "강한 산업 찾기",
      body: "반도체, 조선, 전력, 에너지처럼 돈이 몰리는 산업을 찾습니다. 산업이 강하면 관련 종목을 공부할 이유가 생깁니다."
    },
    {
      step: "3단계",
      title: "회사 이해하기",
      body: "이 회사가 무엇을 팔고, 누가 고객이고, 왜 앞으로 더 벌 수 있는지 확인합니다. 설명이 안 되면 아직 사면 안 됩니다."
    },
    {
      step: "4단계",
      title: "가격과 리스크 정하기",
      body: "좋은 회사도 너무 비싸게 사면 힘듭니다. 매수 전에는 목표 이유, 손절 기준, 분할 매수 계획을 적어 봅니다."
    }
  ],
  glossary: [
    {
      term: "코스피",
      meaning: "한국의 대표 대형주 시장입니다. 삼성전자, 현대차 같은 큰 회사들이 주로 있습니다.",
      example: "코스피가 약하면 대형주 투자 심리가 나쁘다는 뜻일 수 있습니다."
    },
    {
      term: "코스닥",
      meaning: "성장주, 중소형주, 바이오, IT 기업이 많은 시장입니다. 변동성이 코스피보다 큰 편입니다.",
      example: "코스닥이 강하면 개인 투자자 선호 종목이 활발한 날일 수 있습니다."
    },
    {
      term: "나스닥",
      meaning: "미국 기술주 중심 지수입니다. 국내 반도체, 성장주 분위기에 영향을 많이 줍니다.",
      example: "나스닥이 크게 오르면 국내 AI, 반도체주가 관심을 받을 수 있습니다."
    },
    {
      term: "시가총액",
      meaning: "회사의 전체 몸값입니다. 주가에 발행 주식 수를 곱해서 계산합니다.",
      example: "시총이 큰 회사는 안정적일 수 있지만 움직임은 느릴 수 있습니다."
    },
    {
      term: "PER",
      meaning: "주가가 이익 대비 비싼지 보는 지표입니다. 낮다고 무조건 싼 것은 아니고 성장성과 함께 봐야 합니다.",
      example: "PER이 높아도 이익이 빠르게 늘면 시장이 비싸게 평가할 수 있습니다."
    },
    {
      term: "영업이익",
      meaning: "회사가 본업으로 번 돈입니다. 초보자는 매출보다 영업이익이 늘고 있는지 꼭 봐야 합니다.",
      example: "매출은 늘었는데 영업이익이 줄면 비용이 커졌다는 뜻일 수 있습니다."
    },
    {
      term: "수급",
      meaning: "누가 사고 누가 파는지 보는 흐름입니다. 외국인, 기관, 개인 매매 동향을 많이 봅니다.",
      example: "외국인과 기관이 계속 사면 단기 관심이 강해질 수 있습니다."
    },
    {
      term: "분할 매수",
      meaning: "한 번에 전부 사지 않고 여러 번 나누어 사는 방식입니다. 초보자에게 특히 중요합니다.",
      example: "사고 싶은 금액을 3번으로 나눠 사면 가격 변동 부담이 줄어듭니다."
    }
  ],
  checklist: [
    "이 회사가 무엇으로 돈을 버는지 설명할 수 있나요?",
    "최근 매출과 영업이익이 좋아지고 있나요?",
    "지금 뉴스가 실적으로 이어질 가능성이 있나요?",
    "이미 너무 많이 오른 뒤 따라사는 것은 아닌가요?",
    "한 종목에 전체 투자금의 큰 비중을 넣고 있지는 않나요?",
    "틀렸을 때 언제 나올지 기준을 정했나요?"
  ],
  habits: [
    "매수 전 이유를 한 줄로 적기",
    "모르는 용어는 바로 찾아보기",
    "하루 수익률보다 한 달 동안 배운 것 기록하기",
    "한 번에 사지 말고 나눠서 보기",
    "가족과 볼 때는 추천보다 근거를 먼저 말하기"
  ]
};

const dailyCourse = [
  {
    day: 1,
    title: "주식은 종이 가격이 아니라 회사의 일부다",
    source: "벤저민 그레이엄, 현명한 투자자",
    goal: "주식을 가격 맞히기 게임이 아니라 기업을 이해하는 공부로 바꿉니다.",
    lesson: "주식을 산다는 것은 회사의 아주 작은 지분을 사는 것입니다. 오늘 가격이 오르내리는 것보다 중요한 질문은 이 회사가 무엇을 팔고, 누구에게 팔고, 앞으로 돈을 더 벌 수 있는가입니다.",
    action: "관심 종목 하나를 골라 '이 회사는 무엇으로 돈을 버는가?'를 한 문장으로 써보세요."
  },
  {
    day: 2,
    title: "시장 전체 분위기부터 본다",
    source: "하워드 막스, 투자와 마켓 사이클의 법칙",
    goal: "좋은 종목도 시장 분위기에 흔들린다는 것을 배웁니다.",
    lesson: "초보자는 종목부터 보지만, 경험 많은 투자자는 시장부터 봅니다. 나스닥, 코스피, 코스닥, 환율이 약하면 좋은 종목도 같이 내려갈 수 있습니다.",
    action: "오늘 나스닥과 코스피가 강한지 약한지 먼저 적고 종목 뉴스를 보세요."
  },
  {
    day: 3,
    title: "모르는 회사는 사지 않는다",
    source: "피터 린치, 전설로 떠나는 월가의 영웅",
    goal: "내가 이해할 수 있는 범위에서 투자하는 습관을 만듭니다.",
    lesson: "유명한 종목이라고 좋은 투자가 되는 것은 아닙니다. 내가 사업을 설명할 수 없고, 왜 오를지 남의 말로만 알고 있다면 아직 공부가 부족한 상태입니다.",
    action: "관심 종목의 제품, 고객, 경쟁사를 각각 하나씩 찾아보세요."
  },
  {
    day: 4,
    title: "매출과 영업이익을 먼저 본다",
    source: "필립 피셔, 위대한 기업에 투자하라",
    goal: "뉴스보다 실적이 더 중요하다는 기준을 세웁니다.",
    lesson: "뉴스가 좋아도 회사가 돈을 못 벌면 주가는 오래 버티기 어렵습니다. 초보자는 매출이 늘고 있는지, 영업이익이 좋아지는지부터 확인하면 됩니다.",
    action: "관심 종목의 최근 분기 매출과 영업이익이 전년 대비 늘었는지 확인하세요."
  },
  {
    day: 5,
    title: "싼 주식과 좋은 주식은 다르다",
    source: "벤저민 그레이엄, 증권분석",
    goal: "가격이 낮다는 이유만으로 사지 않는 습관을 만듭니다.",
    lesson: "주가가 싸 보이는 종목이 실제로는 실적이 나빠서 싼 것일 수 있습니다. 반대로 비싸 보이는 종목도 이익이 빠르게 늘면 시장이 높은 가격을 줄 수 있습니다.",
    action: "관심 종목의 PER을 보고 같은 업종 다른 회사와 비교해 보세요."
  },
  {
    day: 6,
    title: "안전마진을 남긴다",
    source: "벤저민 그레이엄, 현명한 투자자",
    goal: "틀릴 가능성을 인정하고 여유를 두는 법을 배웁니다.",
    lesson: "투자는 늘 틀릴 수 있습니다. 그래서 너무 비싼 가격에 사지 않고, 한 번에 전부 사지 않고, 현금을 남겨두는 것이 안전마진입니다.",
    action: "오늘 사고 싶은 종목이 있다면 바로 사지 말고 3번에 나눠 살 계획을 적어보세요."
  },
  {
    day: 7,
    title: "분할 매수와 분할 매도",
    source: "초보 투자 원칙",
    goal: "한 번에 맞히려는 습관을 줄입니다.",
    lesson: "초보자는 가장 좋은 가격을 맞히기 어렵습니다. 여러 번 나누어 사고 나누어 팔면 마음이 흔들리는 것을 줄일 수 있습니다.",
    action: "100만 원을 투자한다면 30만 원, 30만 원, 40만 원처럼 나누는 예시를 만들어 보세요."
  },
  {
    day: 8,
    title: "손절은 실패가 아니라 규칙이다",
    source: "윌리엄 오닐, 최고의 주식 최적의 타이밍",
    goal: "손실을 작게 제한하는 기준을 세웁니다.",
    lesson: "틀렸을 때 버티기만 하면 작은 손실이 큰 손실이 됩니다. 손절은 창피한 일이 아니라 다음 기회를 남기는 방법입니다.",
    action: "매수 전 '이유가 틀리면 어디서 나올지'를 숫자로 적어보세요."
  },
  {
    day: 9,
    title: "테마와 실적을 구분한다",
    source: "피터 린치, 이기는 투자",
    goal: "뉴스에 흔들리지 않고 실적 연결성을 봅니다.",
    lesson: "테마가 강하면 관련주가 함께 움직이지만, 결국 오래 가는 종목은 돈을 버는 회사입니다. 테마 뉴스가 매출로 이어지는지 확인해야 합니다.",
    action: "오늘의 핵심 테마가 어느 회사 매출에 직접 연결되는지 표시해 보세요."
  },
  {
    day: 10,
    title: "대장주와 동반주",
    source: "시장 관찰 원칙",
    goal: "같은 테마 안에서도 우선순위를 나눕니다.",
    lesson: "대장주는 테마 안에서 가장 먼저 움직이고 거래대금이 큰 종목입니다. 동반주는 뒤따라 움직이지만 힘이 약할 수 있습니다.",
    action: "관심 테마에서 시가총액과 거래대금이 큰 종목 3개를 찾아보세요."
  },
  {
    day: 11,
    title: "수급은 인기의 흐름이다",
    source: "시장 미시구조 기초",
    goal: "외국인, 기관, 개인 매매 흐름을 이해합니다.",
    lesson: "수급은 누가 사고 누가 파는지입니다. 실적이 좋아도 큰 자금이 팔고 있으면 단기 주가는 약할 수 있습니다.",
    action: "관심 종목의 최근 외국인/기관 순매수 흐름을 확인하세요."
  },
  {
    day: 12,
    title: "거래량은 관심의 크기다",
    source: "윌리엄 오닐, 최고의 주식 최적의 타이밍",
    goal: "가격뿐 아니라 거래량을 함께 보는 습관을 만듭니다.",
    lesson: "주가가 오르는데 거래량도 늘면 시장 관심이 커졌다는 신호일 수 있습니다. 반대로 거래량 없는 상승은 힘이 약할 수 있습니다.",
    action: "오늘 오른 종목이 평소보다 거래량이 늘었는지 확인하세요."
  },
  {
    day: 13,
    title: "차트는 미래 예언이 아니라 기록이다",
    source: "기술적 분석 기초",
    goal: "차트를 과신하지 않고 보조 도구로 사용합니다.",
    lesson: "차트는 사람들이 과거에 어떤 가격에서 사고팔았는지 보여줍니다. 차트만으로 사는 것이 아니라 실적과 뉴스의 보조로 봐야 합니다.",
    action: "관심 종목의 최근 고점과 저점을 표시해 보세요."
  },
  {
    day: 14,
    title: "지지선과 저항선",
    source: "기술적 분석 기초",
    goal: "가격 위치를 대략적으로 판단합니다.",
    lesson: "지지선은 사람들이 사려는 가격대, 저항선은 팔려는 가격대입니다. 초보자는 저항선 바로 아래에서 추격 매수하지 않도록 조심해야 합니다.",
    action: "차트에서 최근 여러 번 막힌 가격대를 찾아보세요."
  },
  {
    day: 15,
    title: "환율과 금리는 왜 중요한가",
    source: "거시경제 투자 기초",
    goal: "주식이 회사만의 문제가 아니라는 것을 이해합니다.",
    lesson: "환율과 금리는 외국인 자금, 수출기업 실적, 성장주 평가에 영향을 줍니다. 특히 한국 시장은 환율 변화에 민감합니다.",
    action: "오늘 달러/원 환율이 오르는지 내리는지 확인하고 시장 분위기와 연결해 보세요."
  },
  {
    day: 16,
    title: "성장주와 가치주",
    source: "투자 스타일 기초",
    goal: "종목의 성격을 구분합니다.",
    lesson: "성장주는 앞으로 이익이 커질 기대를 사는 종목이고, 가치주는 현재 이익이나 자산 대비 싸다고 보는 종목입니다. 둘은 보는 기준이 다릅니다.",
    action: "관심 종목이 성장주인지 가치주인지 이유와 함께 적어보세요."
  },
  {
    day: 17,
    title: "배당주는 왜 보는가",
    source: "장기 투자 기초",
    goal: "주가 차익 외의 수익을 이해합니다.",
    lesson: "배당은 회사가 번 돈 일부를 주주에게 나눠주는 것입니다. 안정적인 회사일수록 배당이 투자 판단의 한 요소가 될 수 있습니다.",
    action: "관심 종목의 배당수익률과 배당 지속성을 찾아보세요."
  },
  {
    day: 18,
    title: "재무제표에서 이것만 먼저 본다",
    source: "재무제표 기초",
    goal: "초보자가 볼 핵심 숫자를 줄입니다.",
    lesson: "처음부터 모든 재무제표를 볼 필요는 없습니다. 매출, 영업이익, 순이익, 부채비율, 현금흐름부터 보면 됩니다.",
    action: "관심 종목의 매출, 영업이익, 부채비율을 찾아 한 줄로 정리하세요."
  },
  {
    day: 19,
    title: "영업이익률은 체력이다",
    source: "필립 피셔, 위대한 기업에 투자하라",
    goal: "많이 파는 회사와 잘 버는 회사를 구분합니다.",
    lesson: "매출이 커도 이익이 적으면 경쟁이 치열하거나 비용 부담이 큰 회사일 수 있습니다. 영업이익률은 본업의 체력을 보여줍니다.",
    action: "관심 종목의 영업이익률이 좋아지는지 나빠지는지 확인하세요."
  },
  {
    day: 20,
    title: "부채는 성장의 도구이자 위험이다",
    source: "재무 안정성 기초",
    goal: "회사가 빚으로 버티는지 확인합니다.",
    lesson: "부채가 무조건 나쁜 것은 아니지만, 이자 부담이 커지면 실적이 흔들릴 수 있습니다. 금리 상승기에는 부채가 큰 회사가 더 위험할 수 있습니다.",
    action: "관심 종목의 부채비율과 이자비용을 확인하세요."
  },
  {
    day: 21,
    title: "현금흐름은 진짜 돈의 흐름이다",
    source: "재무제표 기초",
    goal: "회계상 이익과 실제 현금을 구분합니다.",
    lesson: "이익이 나도 현금이 들어오지 않으면 회사가 힘들 수 있습니다. 영업활동현금흐름이 꾸준한 회사는 체력이 좋을 가능성이 큽니다.",
    action: "최근 영업활동현금흐름이 플러스인지 확인하세요."
  },
  {
    day: 22,
    title: "뉴스 제목보다 원인을 본다",
    source: "하워드 막스, 투자에 대한 생각",
    goal: "뉴스를 해석하는 힘을 기릅니다.",
    lesson: "주식 뉴스는 결과를 말하는 경우가 많습니다. 왜 올랐는지, 그 이유가 계속될 수 있는지, 이미 가격에 반영됐는지를 봐야 합니다.",
    action: "오늘 뉴스 하나를 골라 '일회성인지 지속성인지' 표시하세요."
  },
  {
    day: 23,
    title: "좋은 회사도 나쁜 가격이면 위험하다",
    source: "벤저민 그레이엄, 현명한 투자자",
    goal: "회사와 가격을 분리해서 생각합니다.",
    lesson: "좋은 회사라는 사실만으로 좋은 투자가 되지는 않습니다. 너무 높은 기대가 이미 주가에 들어가 있으면 작은 실망에도 크게 떨어질 수 있습니다.",
    action: "관심 종목이 최근 3개월 동안 얼마나 올랐는지 확인하세요."
  },
  {
    day: 24,
    title: "내가 틀릴 수 있다는 가정",
    source: "하워드 막스, 투자에 대한 생각",
    goal: "겸손한 투자 태도를 배웁니다.",
    lesson: "투자에서 확신은 필요하지만 과신은 위험합니다. 항상 반대 시나리오를 생각해야 합니다.",
    action: "관심 종목이 하락할 수 있는 이유 3가지를 적어보세요."
  },
  {
    day: 25,
    title: "포트폴리오로 생각하기",
    source: "현대 포트폴리오 기초",
    goal: "한 종목이 아니라 전체 자산을 봅니다.",
    lesson: "좋은 종목도 비중이 너무 크면 위험합니다. 여러 산업과 현금 비중을 함께 관리해야 마음이 흔들리지 않습니다.",
    action: "현재 관심 종목을 산업별로 나눠보고 한쪽에 몰려 있는지 확인하세요."
  },
  {
    day: 26,
    title: "현금도 포지션이다",
    source: "리스크 관리 원칙",
    goal: "쉬는 것도 투자라는 것을 배웁니다.",
    lesson: "항상 주식을 들고 있어야 하는 것은 아닙니다. 현금은 하락장에서 좋은 기회를 살 수 있게 해주는 선택권입니다.",
    action: "내 전체 투자금 중 현금 비중을 몇 퍼센트로 둘지 정해보세요."
  },
  {
    day: 27,
    title: "투자 일지를 쓴다",
    source: "행동재무학 기초",
    goal: "반복되는 실수를 발견합니다.",
    lesson: "사고팔 때 이유를 적어두면 나중에 내가 무엇에 흔들리는지 보입니다. 기록은 초보자를 빠르게 성장시킵니다.",
    action: "오늘부터 매수 전 이유, 기대, 리스크, 결과를 간단히 기록하세요."
  },
  {
    day: 28,
    title: "감정이 매매를 망친다",
    source: "대니얼 카너먼, 생각에 관한 행동경제학",
    goal: "공포와 탐욕을 알아차립니다.",
    lesson: "주가가 오르면 더 사고 싶고, 떨어지면 팔고 싶어집니다. 이 감정이 자연스럽다는 것을 알고 규칙으로 대응해야 합니다.",
    action: "내가 매수 버튼을 누르려는 이유가 분석인지 불안인지 구분해 보세요."
  },
  {
    day: 29,
    title: "좋은 투자 질문 5개",
    source: "장기 투자 공통 원칙",
    goal: "종목을 볼 때 반복할 질문을 만듭니다.",
    lesson: "좋은 질문은 나쁜 매수를 줄입니다. 회사, 실적, 가격, 리스크, 내 계획을 매번 같은 순서로 확인하세요.",
    action: "관심 종목에 대해 회사는 무엇을 하는가, 왜 좋아지는가, 얼마가 위험한가를 답해보세요."
  },
  {
    day: 30,
    title: "나만의 투자 원칙 만들기",
    source: "투자 고전들의 공통 결론",
    goal: "공부를 내 기준으로 바꿉니다.",
    lesson: "결국 남의 추천보다 내 기준이 중요합니다. 어떤 종목을 살지보다 어떤 경우에는 사지 않을지를 정하는 것이 더 중요합니다.",
    action: "나의 투자 원칙 5개와 절대 하지 않을 행동 5개를 적어보세요."
  }
];

const decodeXml = (text) => text
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
  .replace(/&amp;/g, "&")
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">");

const stripTags = (text) => decodeXml(text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());

function seoulDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function newsAgeLabel(publishedAt) {
  if (!publishedAt) return "날짜 확인 필요";
  const today = seoulDateKey();
  const dateKey = seoulDateKey(new Date(publishedAt));
  if (dateKey === today) return "오늘";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateKey === seoulDateKey(yesterday) ? "어제" : dateKey;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 5500) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchRss(query, sector) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=ko&gl=KR&ceid=KR:ko`;
  const response = await fetchWithTimeout(url, {
    headers: { "user-agent": "MorningAlpha/1.0" }
  });
  if (!response.ok) throw new Error(`RSS ${response.status}`);
  const xml = await response.text();

  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 3).map((match) => {
    const item = match[1];
    const value = (tag) => decodeXml(item.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))?.[1] || "");
    const rawTitle = stripTags(value("title"));
    const source = stripTags(value("source")) || rawTitle.split(" - ").at(-1) || "Google News";
    const title = rawTitle.replace(new RegExp(` - ${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`), "");
    const publishedAt = new Date(stripTags(value("pubDate")) || Date.now()).toISOString();
    return {
      title,
      source,
      region: query.includes("Korea") ? "KR/GLOBAL" : "GLOBAL",
      sector,
      impact: makeImpact(sector, title),
      publishedAt,
      dateKey: seoulDateKey(new Date(publishedAt)),
      ageLabel: newsAgeLabel(publishedAt),
      url: stripTags(value("link")) || "https://news.google.com/"
    };
  });
}

function makeImpact(sectorName, title) {
  const sector = sectors.find((item) => item.name === sectorName);
  const keyword = sector?.keywords.find((word) => title.toLowerCase().includes(word.toLowerCase())) || sector?.keywords[0];
  return `${sectorName}에서 '${keyword}' 흐름이 포착되었습니다. 관련주는 주가보다 실적, 수주, 환율 영향을 먼저 확인하세요.`;
}

async function fetchQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  const response = await fetchWithTimeout(url, { headers: { "user-agent": "MorningAlpha/1.0" } }, 4500);
  if (!response.ok) throw new Error(`Quote ${symbol} ${response.status}`);
  const json = await response.json();
  const result = json.chart?.result?.[0];
  const quote = result?.indicators?.quote?.[0];
  const timestamps = result?.timestamp || [];
  const points = (quote?.close || [])
    .map((close, index) => ({ close, time: timestamps[index] ? timestamps[index] * 1000 : null }))
    .filter((point) => typeof point.close === "number");
  const lastPoint = points.at(-1);
  const prevPoint = points.at(-2);
  const last = lastPoint?.close;
  const prev = prevPoint?.close;
  if (!last || !prev) throw new Error(`No quote ${symbol}`);
  const tradeDate = lastPoint?.time ? new Date(lastPoint.time) : new Date();
  return {
    price: Number(last.toFixed(symbol.includes("KRW") ? 2 : 2)),
    changePercent: Number((((last - prev) / prev) * 100).toFixed(2)),
    isLive: true,
    source: "Yahoo Finance",
    tradeDate: tradeDate.toISOString(),
    dateKey: seoulDateKey(tradeDate),
    ageLabel: newsAgeLabel(tradeDate.toISOString()),
    fetchedAt: new Date().toISOString()
  };
}

function formatPrice(value) {
  if (typeof value !== "number") return null;
  return Number(value.toFixed(0));
}

function nearestClose(points, targetTime) {
  let nearest = null;
  for (const point of points) {
    const distance = Math.abs(point.time - targetTime);
    if (!nearest || distance < nearest.distance) {
      nearest = { ...point, distance };
    }
  }
  return nearest;
}

function toYmd(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}${month}${day}`;
}

function buildHistoryItems(points, source) {
  const now = Date.now();
  const latest = points.at(-1);
  const targets = [
    ["3년 전", 365 * 3],
    ["1년 전", 365],
    ["3개월 전", 92],
    ["1개월 전", 30]
  ];
  const items = targets.map(([label, days]) => {
    const point = nearestClose(points, now - days * 24 * 60 * 60 * 1000);
    const changePercent = latest && point ? Number((((latest.close - point.close) / point.close) * 100).toFixed(1)) : null;
    return {
      label,
      price: formatPrice(point?.close),
      date: point ? new Date(point.time).toISOString().slice(0, 10) : null,
      changePercent
    };
  });
  items.push({
    label: "현재",
    price: formatPrice(latest.close),
    date: new Date(latest.time).toISOString().slice(0, 10),
    changePercent: 0
  });

  return {
    isLive: true,
    source,
    fetchedAt: new Date().toISOString(),
    items
  };
}

async function fetchNaverStockHistory(ticker) {
  const end = new Date();
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 3);
  start.setDate(start.getDate() - 10);
  const url = `https://api.finance.naver.com/siseJson.naver?symbol=${encodeURIComponent(ticker)}&requestType=1&startTime=${toYmd(start)}&endTime=${toYmd(end)}&timeframe=day`;
  const response = await fetchWithTimeout(url, {
    headers: {
      "user-agent": "MorningAlpha/1.0",
      "referer": `https://finance.naver.com/item/sise_day.naver?code=${encodeURIComponent(ticker)}`
    }
  }, 8500);
  if (!response.ok) throw new Error(`Naver history ${ticker} ${response.status}`);
  const text = await response.text();
  const rows = [...text.matchAll(/\[\s*"?(\d{8})"?\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/g)];
  const points = rows.map((match) => {
    const date = match[1];
    const year = Number(date.slice(0, 4));
    const month = Number(date.slice(4, 6)) - 1;
    const day = Number(date.slice(6, 8));
    return {
      time: new Date(Date.UTC(year, month, day)).getTime(),
      close: Number(match[5])
    };
  }).filter((point) => Number.isFinite(point.close));
  if (points.length < 2) throw new Error(`No Naver history ${ticker}`);
  return buildHistoryItems(points, "네이버 금융");
}

async function fetchYahooStockHistory(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=3y&interval=1d`;
  const response = await fetchWithTimeout(url, { headers: { "user-agent": "MorningAlpha/1.0" } }, 6500);
  if (!response.ok) throw new Error(`History ${symbol} ${response.status}`);
  const json = await response.json();
  const result = json.chart?.result?.[0];
  const timestamps = result?.timestamp || [];
  const closes = result?.indicators?.quote?.[0]?.close || [];
  const points = timestamps
    .map((timestamp, index) => ({ time: timestamp * 1000, close: closes[index] }))
    .filter((point) => typeof point.close === "number");
  if (points.length < 2) throw new Error(`No history ${symbol}`);
  return buildHistoryItems(points, "Yahoo Finance");
}

async function fetchStockHistory(stock) {
  const errors = [];
  if (["KOSPI", "KOSDAQ", "ETF"].includes(stock.market) && stock.ticker) {
    try {
      return await fetchNaverStockHistory(stock.ticker);
    } catch (error) {
      errors.push(error.message);
    }
  }
  if (stock.quoteSymbol) {
    try {
      return await fetchYahooStockHistory(stock.quoteSymbol);
    } catch (error) {
      errors.push(error.message);
    }
  }
  throw new Error(errors.join(" / ") || "가격 데이터 연결 실패");
}

async function enrichStocksWithHistory(stocks) {
  const results = await Promise.allSettled(stocks.map((stock) => fetchStockHistory(stock)));
  const enriched = stocks.map((stock, index) => {
    const result = results[index];
    if (result.status === "fulfilled") {
      const stockWithHistory = { ...stock, history: result.value };
      const stockWithOpinion = { ...stockWithHistory, aiOpinion: buildAiOpinion(stockWithHistory) };
      return finalizeStockRecommendation(stockWithOpinion);
    }
    const stockWithFailedHistory = {
      ...stock,
      history: {
        isLive: false,
        source: "연결 실패",
        error: result.reason?.message || "가격 데이터 연결 실패",
        items: []
      }
    };
    const stockWithOpinion = { ...stockWithFailedHistory, aiOpinion: buildAiOpinion(stockWithFailedHistory) };
    return finalizeStockRecommendation(stockWithOpinion);
  });
  return enriched.sort((a, b) => (b.score || 0) - (a.score || 0));
}

function historyChange(history, label) {
  return history?.items?.find((item) => item.label === label)?.changePercent;
}

function clampScore(value, min = 30, max = 95) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function stockRecommendationAdjustment(stock) {
  const oneMonth = historyChange(stock.history, "1개월 전");
  const threeMonth = historyChange(stock.history, "3개월 전");
  const oneYear = historyChange(stock.history, "1년 전");
  const aiClass = stock.aiOpinion?.className || "hold";
  let adjustment = 0;
  const reasons = [];

  if (!stock.history?.isLive) {
    adjustment -= 14;
    reasons.push("가격 데이터 없음 -14");
  }

  if (typeof oneMonth === "number") {
    if (oneMonth <= -20) {
      adjustment -= 18;
      reasons.push(`1개월 급락 ${oneMonth}% -18`);
    } else if (oneMonth <= -12) {
      adjustment -= 12;
      reasons.push(`1개월 약세 ${oneMonth}% -12`);
    } else if (oneMonth >= 35) {
      adjustment -= 10;
      reasons.push(`1개월 과열 ${oneMonth}% -10`);
    } else if (oneMonth > 0) {
      adjustment += 6;
      reasons.push(`1개월 상승 ${oneMonth}% +6`);
    }
  }

  if (typeof threeMonth === "number") {
    if (threeMonth <= -20) {
      adjustment -= 12;
      reasons.push(`3개월 하락 ${threeMonth}% -12`);
    } else if (threeMonth >= 120) {
      adjustment -= 10;
      reasons.push(`3개월 과열 ${threeMonth}% -10`);
    } else if (threeMonth >= 10) {
      adjustment += 8;
      reasons.push(`3개월 추세 ${threeMonth}% +8`);
    } else if (threeMonth >= 0) {
      adjustment += 3;
      reasons.push(`3개월 방어 ${threeMonth}% +3`);
    }
  }

  if (typeof oneYear === "number") {
    if (oneYear >= 20 && oneYear <= 120) {
      adjustment += 4;
      reasons.push(`1년 우상향 ${oneYear}% +4`);
    } else if (oneYear <= -20) {
      adjustment -= 6;
      reasons.push(`1년 약세 ${oneYear}% -6`);
    }
  }

  if (aiClass === "buy") {
    adjustment += 10;
    reasons.push("AI 투자 검토 +10");
  } else if (aiClass === "watch") {
    adjustment += 4;
    reasons.push("AI 관심 유지 +4");
  } else if (aiClass === "warning") {
    adjustment -= 8;
    reasons.push("AI 익절/과열 경고 -8");
  } else if (aiClass === "sell") {
    adjustment -= 16;
    reasons.push("AI 손절 점검 -16");
  }

  return { adjustment, reasons };
}

function finalizeStockRecommendation(stock) {
  const baseScore = Number(stock.score || 0);
  const recommendation = stockRecommendationAdjustment(stock);
  const finalScore = clampScore(baseScore + recommendation.adjustment);
  const band = interestBand(finalScore, { mode: stock.regimeMode || "normal" });
  return {
    ...stock,
    sectorScore: baseScore,
    score: finalScore,
    action: band.tone,
    className: band.className,
    guidance: band.guidance,
    scoreReasons: [
      ...(stock.scoreReasons || []),
      `섹터기초 ${baseScore}점`,
      `가격보정 ${recommendation.adjustment > 0 ? "+" : ""}${recommendation.adjustment}점`
    ],
    recommendationReasons: recommendation.reasons,
    scoreExplanation: `${stock.scoreExplanation || ""} / 종목 가격·AI 보정 ${recommendation.adjustment > 0 ? "+" : ""}${recommendation.adjustment}점`
  };
}

function buildAiOpinion(stock) {
  if (!stock.history?.isLive) {
    if (stock.score >= 85) {
      return {
        signal: "투자 검토",
        className: "watch",
        summary: "섹터와 뉴스 신호는 강하지만 가격 데이터가 없어 최종 판단은 보류합니다. 현재가와 1개월/3개월 급등 여부를 먼저 확인하세요.",
        reasons: [`관심 점수 ${stock.score}점`, "가격 데이터 미연결", "최신성 확인 필요"],
        checklist: ["현재가 직접 확인", "최근 1개월 급등 여부 확인", "분할 매수 기준 작성"]
      };
    }
    if (stock.score >= 70) {
      return {
        signal: "관망",
        className: "hold",
        summary: "뉴스와 섹터 기준으로는 볼 만하지만 가격 데이터가 없어 매수 판단은 아직 이릅니다.",
        reasons: [`관심 점수 ${stock.score}점`, "가격 데이터 미연결"],
        checklist: ["네이버 금융 현재가 확인", "최근 실적 확인", "추격매수 여부 점검"]
      };
    }
    return {
      signal: "판단 보류",
      className: "hold",
      summary: "가격 데이터가 연결되지 않아 AI 판단을 보류합니다.",
      reasons: ["과거 가격 없음", "최신성 확인 필요"],
      checklist: ["데이터 연결 후 다시 분석", "네이버 금융에서 현재가 직접 확인"]
    };
  }

  const oneMonth = historyChange(stock.history, "1개월 전");
  const threeMonth = historyChange(stock.history, "3개월 전");
  const oneYear = historyChange(stock.history, "1년 전");
  const reasons = [];
  const checklist = ["실적 발표 확인", "뉴스가 매출로 이어지는지 확인", "분할 매수/매도 기준 정하기"];
  let signal = "관망";
  let className = "hold";
  let summary = "신호가 애매합니다. 지금은 무리하게 따라가기보다 추가 확인이 필요합니다.";

  if (typeof oneMonth === "number") reasons.push(`1개월 수익률 ${oneMonth > 0 ? "+" : ""}${oneMonth}%`);
  if (typeof threeMonth === "number") reasons.push(`3개월 수익률 ${threeMonth > 0 ? "+" : ""}${threeMonth}%`);
  if (typeof oneYear === "number") reasons.push(`1년 수익률 ${oneYear > 0 ? "+" : ""}${oneYear}%`);
  reasons.push(`관심 점수 ${stock.score}점`);

  if ((oneMonth >= 35 || threeMonth >= 80) && stock.score >= 70) {
    signal = "익절 검토";
    className = "warning";
    summary = "이미 많이 오른 구간입니다. 신규 매수자는 추격매수를 조심하고, 보유자는 일부 차익실현 기준을 검토하세요.";
    checklist.unshift("현재가가 최근 고점 근처인지 확인");
  } else if (stock.score >= 85 && threeMonth >= 10 && oneMonth < 30) {
    signal = "투자 검토";
    className = "buy";
    summary = "관심 점수와 추세가 모두 양호합니다. 단, 바로 매수보다 가격 위치와 실적을 확인한 뒤 분할 접근을 검토하세요.";
  } else if (stock.score >= 70 && threeMonth >= 0) {
    signal = "관심 유지";
    className = "watch";
    summary = "섹터 신호와 가격 흐름이 나쁘지 않습니다. 관심 목록에 두고 조정 구간과 실적 변화를 확인하세요.";
  } else if (oneMonth <= -15 && stock.score < 65) {
    signal = "손절 점검";
    className = "sell";
    summary = "단기 하락과 낮은 관심 점수가 겹쳤습니다. 보유 중이라면 처음 정한 손절/보유 이유가 아직 유효한지 점검하세요.";
    checklist.unshift("하락 이유가 일시적인지 구조적인지 확인");
  }

  return { signal, className, summary, reasons, checklist };
}

function buildHoldingOpinion(holding, history) {
  if (!history?.isLive || !history.items?.length) {
    return {
      signal: "데이터 확인 필요",
      className: "hold",
      summary: holding.note || "현재가를 가져오지 못해 매도/보유 판단을 보류합니다.",
      rule: "종목코드 또는 현재가 연결이 안 되어 손익 계산을 보류합니다.",
      reasons: ["현재가 없음", "수익률 계산 불가"]
    };
  }

  const current = history.items.find((item) => item.label === "현재");
  const currentPrice = current?.price;
  const invested = holding.averagePrice * holding.shares;
  const value = currentPrice * holding.shares;
  const profit = value - invested;
  const profitPercent = Number(((currentPrice - holding.averagePrice) / holding.averagePrice * 100).toFixed(1));
  const oneMonth = historyChange(history, "1개월 전");
  const threeMonth = historyChange(history, "3개월 전");
  const reasons = [
    `평균단가 ${holding.averagePrice.toLocaleString("ko-KR")}원`,
    `현재가 ${currentPrice.toLocaleString("ko-KR")}원`,
    `수익률 ${profitPercent > 0 ? "+" : ""}${profitPercent}%`
  ];
  if (typeof oneMonth === "number") reasons.push(`1개월 ${oneMonth > 0 ? "+" : ""}${oneMonth}%`);
  if (typeof threeMonth === "number") reasons.push(`3개월 ${threeMonth > 0 ? "+" : ""}${threeMonth}%`);

  let signal = "보유 유지";
  let className = "watch";
  let summary = "큰 과열이나 손절 신호는 약합니다. 보유 이유가 아직 유효한지 점검하면서 지켜볼 수 있습니다.";
  let rule = "급한 과열이나 손절 신호가 약해 보유 기준을 유지하는 구간입니다.";

  if (profitPercent >= 40 && oneMonth >= 20) {
    signal = "익절 검토";
    className = "warning";
    summary = "수익이 크고 단기 급등도 겹쳤습니다. 전량 매도보다 일부 차익실현 기준을 검토하세요.";
    rule = "수익률 40% 이상이고 최근 1개월도 20% 이상 오른 경우입니다.";
  } else if (profitPercent >= 20 && oneMonth < 0) {
    signal = "일부 익절 검토";
    className = "warning";
    summary = "수익 구간이지만 단기 흐름이 꺾였습니다. 보유 수량 일부를 줄일지 검토할 수 있습니다.";
    rule = "수익률 20% 이상이지만 최근 1개월 흐름이 꺾인 경우입니다.";
  } else if (profitPercent <= -20) {
    signal = "손절 점검";
    className = "sell";
    summary = "손실 폭이 큽니다. 처음 매수 이유가 깨졌는지 확인하고 손절 기준을 다시 정하세요.";
    rule = "평균단가 대비 손실이 -20% 이하인 경우입니다.";
  } else if (profitPercent <= -10 && oneMonth < 0) {
    signal = "보유 이유 재점검";
    className = "sell";
    summary = "손실과 단기 약세가 겹쳤습니다. 물타기보다 보유 이유와 손절 기준을 먼저 확인하세요.";
    rule = "손실이 -10% 이하이고 최근 1개월 흐름도 약한 경우입니다.";
  } else if (profitPercent >= 10) {
    signal = "보유 유지";
    className = "buy";
    summary = "수익 구간입니다. 급등이 과하지 않다면 보유하되 익절 기준을 미리 정해두세요.";
    rule = "수익률 10% 이상이고 과열 조건에는 아직 걸리지 않은 경우입니다.";
  }

  return {
    signal,
    className,
    summary,
    rule,
    reasons,
    currentPrice,
    invested,
    value,
    profit,
    profitPercent
  };
}

function normalizePortfolioHolding(holding = {}) {
  const ticker = String(holding.ticker || "").trim().toUpperCase();
  const market = String(holding.market || "").trim().toUpperCase() || "KOSPI";
  let quoteSymbol = null;
  if (ticker && !market.includes("ETF")) {
    quoteSymbol = `${ticker}.${market.includes("KOSDAQ") ? "KQ" : "KS"}`;
  }
  return {
    name: String(holding.name || "").trim() || ticker || "이름 미입력",
    ticker: ticker || null,
    market,
    quoteSymbol,
    averagePrice: Number(holding.averagePrice || 0),
    shares: Number(holding.shares || 0),
    note: String(holding.note || "").trim()
  };
}

function normalizePortfolioInput(holdings = []) {
  return holdings
    .slice(0, 30)
    .map(normalizePortfolioHolding)
    .filter((holding) => holding.name && holding.averagePrice > 0 && holding.shares > 0);
}

async function buildPortfolioReport(holdings = portfolioHoldings) {
  const normalizedHoldings = normalizePortfolioInput(holdings);
  const results = await Promise.allSettled(normalizedHoldings.map(async (holding) => {
    if (!holding.ticker) {
      const history = { isLive: false, source: "종목코드 없음", items: [] };
      return { ...holding, history, opinion: buildHoldingOpinion(holding, history) };
    }
    const history = await fetchStockHistory(holding);
    return { ...holding, history, opinion: buildHoldingOpinion(holding, history) };
  }));

  return results.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    const holding = normalizedHoldings[index];
    const history = {
      isLive: false,
      source: "연결 실패",
      error: result.reason?.message || "현재가 연결 실패",
      items: []
    };
    return { ...holding, history, opinion: buildHoldingOpinion(holding, history) };
  });
}

async function fetchMarkets() {
  const results = await Promise.allSettled(marketSymbols.map(async ([name, symbol]) => ({
    name,
    symbol,
    ...(await fetchQuote(symbol))
  })));

  const fallback = [
    { name: "NASDAQ", symbol: "^IXIC", price: null, changePercent: 0, isLive: false, source: "연결 실패" },
    { name: "S&P 500", symbol: "^GSPC", price: null, changePercent: 0, isLive: false, source: "연결 실패" },
    { name: "KOSPI", symbol: "^KS11", price: null, changePercent: 0, isLive: false, source: "연결 실패" },
    { name: "KOSDAQ", symbol: "^KQ11", price: null, changePercent: 0, isLive: false, source: "연결 실패" },
    { name: "USD/KRW", symbol: "KRW=X", price: null, changePercent: 0, isLive: false, source: "연결 실패" }
  ];

  return results.map((result, index) => result.status === "fulfilled" ? result.value : fallback[index]);
}


function marketEmergencyAlerts(markets = []) {
  const checkedAt = new Date().toISOString();
  const today = seoulDateKey();
  return markets
    .filter((market) => ["KOSPI", "KOSDAQ"].includes(market.name) && typeof market.changePercent === "number")
    .filter((market) => market.dateKey === today)
    .flatMap((market) => {
      const change = market.changePercent;
      if (change <= -8) {
        return [{
          level: "danger",
          title: market.name + " 서킷브레이커급 급락 확인 필요",
          message: market.name + " 지수가 " + change + "% 하락 중입니다. 실제 거래소 서킷브레이커/매매중단 공시를 즉시 확인하고 신규 매수는 보류하세요.",
          source: market.source || "시장 지수",
          checkedAt
        }];
      }
      if (change <= -5) {
        return [{
          level: "danger",
          title: market.name + " 급락 경보",
          message: market.name + " 지수가 " + change + "% 하락 중입니다. 사이드카/서킷브레이커 가능성을 확인하고 보유종목 손절 기준을 먼저 점검하세요.",
          source: market.source || "시장 지수",
          checkedAt
        }];
      }
      if (change <= -3) {
        return [{
          level: "watch",
          title: market.name + " 변동성 주의",
          message: market.name + " 지수가 " + change + "% 하락 중입니다. 추격매수보다 현금 비중과 리스크를 먼저 확인하세요.",
          source: market.source || "시장 지수",
          checkedAt
        }];
      }
      return [];
    });
}

function newsEmergencyAlerts(news = []) {
  const checkedAt = new Date().toISOString();
  const keywords = ["서킷브레이커", "사이드카", "circuit breaker", "sidecar", "매매중단", "거래중단"];
  const today = seoulDateKey();
  return news
    .filter((item) => (item.dateKey || seoulDateKey(new Date(item.publishedAt || Date.now()))) === today)
    .filter((item) => keywords.some((keyword) => (item.title + " " + item.impact).toLowerCase().includes(keyword.toLowerCase())))
    .slice(0, 3)
    .map((item) => ({
      level: "danger",
      title: "서킷브레이커/사이드카 뉴스 감지",
      message: item.title,
      source: item.source || "뉴스",
      url: item.url,
      checkedAt
    }));
}

function buildEmergencyAlerts(markets = [], news = []) {
  const seen = new Set();
  return [...marketEmergencyAlerts(markets), ...newsEmergencyAlerts(news)]
    .filter((alert) => {
      const key = alert.title + "-" + alert.message;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
}

function marketRegime(markets = []) {
  const today = seoulDateKey();
  const getChange = (name) => {
    const market = markets.find((item) => item.name === name);
    if (!market || (market.dateKey && market.dateKey !== today)) return 0;
    return market.changePercent || 0;
  };
  const kospi = getChange("KOSPI");
  const kosdaq = getChange("KOSDAQ");
  const nasdaq = getChange("NASDAQ");
  const worst = Math.min(kospi, kosdaq, nasdaq);

  if (kospi <= -5 || kosdaq <= -5 || (kospi <= -3 && kosdaq <= -3)) {
    return {
      mode: "emergency",
      label: "급락장",
      penalty: -24,
      message: "시장 급락 구간입니다. 신규매수보다 현금, 손절 기준, 보유 이유 점검이 우선입니다."
    };
  }
  if (worst <= -3 || kospi <= -2.5 || kosdaq <= -2.5) {
    return {
      mode: "riskOff",
      label: "위험 관리",
      penalty: -12,
      message: "시장 변동성이 큽니다. 관심 종목은 보되 매수 판단은 한 박자 늦추는 편이 안전합니다."
    };
  }
  return {
    mode: "normal",
    label: "일반장",
    penalty: 0,
    message: "일반적인 시장 구간입니다. 섹터 뉴스와 가격 흐름을 함께 봅니다."
  };
}

function scoreSector(sector, news, markets, regime = marketRegime(markets)) {
  const sectorNews = news.filter((item) => item.sector === sector.name);
  const keywordHits = sector.keywords.reduce((sum, keyword) => {
    const lower = keyword.toLowerCase();
    return sum + sectorNews.filter((item) => `${item.title} ${item.impact}`.toLowerCase().includes(lower)).length;
  }, 0);
  const today = seoulDateKey();
  const currentChange = (name) => {
    const market = markets.find((item) => item.name === name);
    if (!market || (market.dateKey && market.dateKey !== today)) return 0;
    return market.changePercent || 0;
  };
  const nasdaq = currentChange("NASDAQ");
  const kospi = currentChange("KOSPI");
  const kosdaq = currentChange("KOSDAQ");
  const marketBoost = Math.max(-10, Math.min(6, nasdaq * 0.6 + kospi * 0.8 + kosdaq * 0.6)) + regime.penalty;
  const rawScore = 52 + sectorNews.length * 6 + keywordHits * 3 + marketBoost;
  const score = Math.max(35, Math.min(92, Math.round(rawScore)));
  const reasons = [
    `관련 뉴스 ${sectorNews.length}건`,
    `핵심 키워드 ${keywordHits}회`,
    `나스닥 ${nasdaq > 0 ? "+" : ""}${nasdaq}%`,
    `코스피 ${kospi > 0 ? "+" : ""}${kospi}%`,
    `코스닥 ${kosdaq > 0 ? "+" : ""}${kosdaq}%`,
    `시장상태 ${regime.label}`
  ];
  const explanation = `기본 52점 + 뉴스 ${sectorNews.length * 6}점 + 키워드 ${keywordHits * 3}점 + 시장 보정 ${marketBoost.toFixed(1)}점`;
  return { score, reasons, explanation };
}

function interestBand(score, regime = { mode: "normal" }) {
  if (regime.mode === "emergency") {
    if (score >= 75) {
      return {
        tone: "급락장 관찰 1순위",
        className: "warning",
        guidance: "시장 급락 중에는 신규매수 추천이 아니라 관찰 후보입니다. 거래 안정 후 실적과 수급을 다시 확인하세요."
      };
    }
    if (score >= 60) {
      return {
        tone: "급락장 관찰",
        className: "observe",
        guidance: "뉴스 신호는 있지만 시장 위험이 큽니다. 매수보다 리스크 관리와 현금 비중 확인이 먼저입니다."
      };
    }
    return {
      tone: "급락장 보류",
      className: "caution",
      guidance: "급락장에서는 신호가 약한 종목을 굳이 볼 필요가 없습니다."
    };
  }

  if (regime.mode === "riskOff") {
    if (score >= 85) {
      return {
        tone: "강한 관심, 매수 보류",
        className: "strong",
        guidance: "관심도는 높지만 시장 변동성이 큽니다. 바로 매수보다 조정 이후 가격과 수급을 확인하세요."
      };
    }
    if (score >= 70) {
      return {
        tone: "관심",
        className: "watch",
        guidance: "관심 목록에 두되 시장이 진정되는지 먼저 확인하세요."
      };
    }
  }

  if (score >= 90) {
    return {
      tone: "매수 검토 최우선",
      className: "priority",
      guidance: "신호는 매우 강하지만 바로 매수보다 실적, 가격 위치, 손절 기준을 확인하세요."
    };
  }
  if (score >= 80) {
    return {
      tone: "강한 관심",
      className: "strong",
      guidance: "오늘 우선적으로 공부할 만합니다. 관련 종목의 실적과 수급을 함께 보세요."
    };
  }
  if (score >= 70) {
    return {
      tone: "관심",
      className: "watch",
      guidance: "관심 목록에 넣고 뉴스가 실적으로 이어지는지 확인하세요."
    };
  }
  if (score >= 60) {
    return {
      tone: "관찰",
      className: "observe",
      guidance: "아직 확신은 약합니다. 추가 뉴스와 지수 흐름을 더 지켜보세요."
    };
  }
  if (score >= 50) {
    return {
      tone: "중립",
      className: "neutral",
      guidance: "공부는 가능하지만 매수 판단은 서두르지 않는 구간입니다."
    };
  }
  return {
    tone: "보류",
    className: "caution",
    guidance: "현재 신호가 약합니다. 더 좋은 기회를 기다리는 편이 안전합니다."
  };
}

function buildReport(news, markets, dataHealth = {}) {
  const regime = marketRegime(markets);
  const sectorReports = sectors.map((sector) => {
    const scoring = scoreSector(sector, news, markets, regime);
    const band = interestBand(scoring.score, regime);
    const headline = news.find((item) => item.sector === sector.name);
    return {
      name: sector.name,
      score: scoring.score,
      tone: band.tone,
      className: band.className,
      guidance: band.guidance,
      scoreReasons: scoring.reasons,
      scoreExplanation: scoring.explanation,
      issue: headline?.title || `${sector.name} 관련 주요 뉴스는 적지만, 시장 변화는 계속 확인하세요.`,
      keywords: sector.keywords
    };
  }).sort((a, b) => b.score - a.score);

  const stocks = sectorReports.flatMap((report) => {
    const sector = sectors.find((item) => item.name === report.name);
    const pickCount = Math.min(sector.tickers.length, sector.query.includes("semiconductor") ? 3 : 2);
    return sector.tickers.slice(0, pickCount).map(([name, ticker, market, quoteSymbol], index) => {
      const stockScore = Math.max(42, report.score - index * 5);
      const band = interestBand(stockScore, regime);
      return {
        name,
        ticker,
        market,
        sector: report.name,
        quoteSymbol,
        score: stockScore,
        action: band.tone,
        className: band.className,
        guidance: band.guidance,
        scoreReasons: report.scoreReasons,
        scoreExplanation: report.scoreExplanation,
        regimeMode: regime.mode,
        reason: `${report.name} 이슈 강도 ${report.score}점. ${regime.message} '${report.issue.slice(0, 72)}${report.issue.length > 72 ? "..." : ""}' 흐름과 실적 민감도를 확인하세요.`
      };
    });
  }).sort((a, b) => b.score - a.score).slice(0, 8);

  const marketAverage = markets
    .filter((item) => item.name !== "USD/KRW")
    .filter((item) => !item.dateKey || item.dateKey === seoulDateKey())
    .reduce((sum, item) => sum + (item.changePercent || 0), 0) / 4;
  const moodScore = Math.max(30, Math.min(90, Math.round(
    sectorReports.reduce((sum, item) => sum + item.score, 0) / sectorReports.length + marketAverage * 4
  )));
  const top = sectorReports[0];
  const today = seoulDateKey();
  const weakMarket = markets.find((item) => (!item.dateKey || item.dateKey === today) && item.changePercent < -1);
  const courseIndex = Math.floor(Date.now() / 86400000) % dailyCourse.length;
  const todayCourse = dailyCourse[courseIndex];

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      mood: regime.mode === "emergency" ? "방어 우선" : moodScore >= 72 ? "위험 감수 가능" : moodScore >= 58 ? "선별 접근" : "방어 우선",
      moodScore,
      moodNote: regime.mode === "normal" ? "뉴스 강도와 주요 지수 흐름을 합친 참고 지표입니다." : regime.message,
      topTheme: top.name,
      topThemeNote: regime.mode === "emergency"
        ? `급락장에서는 ${top.name}도 매수 추천이 아니라 관찰 후보입니다. 점수는 ${top.score}점입니다.`
        : `오늘 가장 강한 섹터 신호는 ${top.name}입니다. 점수는 ${top.score}점입니다.`,
      riskSignal: regime.mode === "emergency" ? "시장 급락 경보" : weakMarket ? `${weakMarket.name} 약세` : "금리·환율 변동",
      riskNote: regime.mode === "emergency"
        ? "서킷브레이커/사이드카 가능성을 확인하고 신규매수보다 보유종목 리스크 관리가 우선입니다."
        : weakMarket
        ? `${weakMarket.name}이 ${weakMarket.changePercent}% 움직였습니다. 추격 매수보다 분할 접근을 검토하세요.`
        : "미국 금리, 달러/원 환율, 장전 선물 흐름을 함께 확인하세요."
    },
    markets,
    dataHealth,
    stocks,
    sectors: sectorReports,
    news: news.slice(0, 14),
    lessons,
    beginnerGuide,
    dailyCourse,
    todayCourse,
    disclaimer: "이 서비스는 가족용 공부 도구이며 매수·매도 지시가 아닙니다. 최종 판단과 책임은 투자자 본인에게 있습니다."
  };
}

async function generateReport() {
  const [newsResults, emergencyNewsResults, markets] = await Promise.all([
    Promise.allSettled(sectors.map((sector) => fetchRss(sector.query, sector.name))),
    Promise.allSettled(emergencyQueries.map((item) => fetchRss(item.query, item.sector))),
    fetchMarkets()
  ]);
  const sectorNews = newsResults.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const emergencyNews = emergencyNewsResults.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  const usedFallbackNews = sectorNews.length < 4;
  const liveMarketCount = markets.filter((market) => market.isLive).length;
  const failedNewsSectors = newsResults.filter((result) => result.status !== "fulfilled").length;
  const allNewsForAlerts = [...sectorNews, ...emergencyNews];
  const emergencyAlerts = buildEmergencyAlerts(markets, allNewsForAlerts);
  const hasEmergency = emergencyAlerts.some((alert) => alert.level === "danger");
  const dataHealth = {
    status: hasEmergency ? "emergency" : !usedFallbackNews && liveMarketCount === markets.length ? "live" : liveMarketCount > 0 || sectorNews.length > 0 ? "partial" : "fallback",
    label: hasEmergency ? "긴급 시장 경보 확인" : !usedFallbackNews && liveMarketCount === markets.length ? "실시간 데이터 연결 정상" : liveMarketCount > 0 || sectorNews.length > 0 ? "일부 데이터만 실시간" : "예시 데이터 사용 중",
    generatedAt: new Date().toISOString(),
    liveMarketCount,
    totalMarketCount: markets.length,
    liveNewsCount: sectorNews.length + emergencyNews.length,
    failedNewsSectors,
    usedFallbackNews,
    emergencyAlertCount: emergencyAlerts.length,
    note: hasEmergency
      ? "서킷브레이커/사이드카 또는 급락 신호가 감지됐습니다. 거래소 공시와 증권사 알림을 즉시 확인하세요."
      : usedFallbackNews
        ? "뉴스 연결이 부족해서 기본 브리핑을 얹었습니다. 투자 판단 전 최신 뉴스를 직접 확인하세요."
        : "뉴스와 지수 데이터를 실시간으로 반영했습니다."
  };
  const report = buildReport(usedFallbackNews ? fallbackNews : sectorNews, markets, dataHealth);
  report.emergencyAlerts = emergencyAlerts;
  if (emergencyNews.length) {
    report.news = [...emergencyNews, ...report.news].slice(0, 14);
  }
  report.stocks = await enrichStocksWithHistory(report.stocks);
  if (report.stocks[0]) {
    report.summary.topStock = report.stocks[0].name;
    report.summary.topStockNote = `종목 후보 1위는 가격 흐름까지 보정한 ${report.stocks[0].name}입니다. 테마 1위와 종목 1위는 다를 수 있습니다.`;
  }
  report.portfolio = await buildPortfolioReport();
  const liveHistoryCount = report.stocks.filter((stock) => stock.history?.isLive).length;
  report.dataHealth.liveHistoryCount = liveHistoryCount;
  report.dataHealth.totalHistoryCount = report.stocks.length;
  if (liveHistoryCount < report.stocks.length) {
    report.dataHealth.status = report.dataHealth.status === "live" ? "partial" : report.dataHealth.status;
    report.dataHealth.label = report.dataHealth.status === "fallback" ? report.dataHealth.label : report.dataHealth.label;
    report.dataHealth.note = report.dataHealth.note + " 종목 과거 가격은 " + liveHistoryCount + "/" + report.stocks.length + "개만 연결됐습니다.";
  }
  await fs.writeFile(REPORT_FILE, JSON.stringify(report, null, 2), "utf8");
  return report;
}

async function getReport(force) {
  if (force) return generateReport();
  try {
    const report = JSON.parse(await fs.readFile(REPORT_FILE, "utf8"));
    const age = Date.now() - new Date(report.generatedAt).getTime();
    const stocks = Array.isArray(report.stocks) ? report.stocks : [];
    const hasHistory = stocks.length > 0 && stocks.some((stock) => stock.history?.isLive && stock.history.items?.length);
    const hasAiOpinion = stocks.length > 0 && stocks.every((stock) => stock.aiOpinion?.signal);
    const hasVisibleAiLabels = stocks.some((stock) => ["투자 검토", "익절 검토", "손절 점검", "관망", "관심 유지"].includes(stock.aiOpinion?.signal));
    const hasDataHealth = Boolean(report.dataHealth);
    if (age < 5 * 60 * 1000 && hasHistory && hasAiOpinion && hasVisibleAiLabels && hasDataHealth) return report;
  } catch {
    // Generate a fresh report below.
  }
  return generateReport();
}

function truncateText(text = "", max = 42) {
  const value = String(text).replace(/\s+/g, " ").trim();
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}

function kakaoConfigStatus() {
  const missing = [];
  if (!KAKAO_REST_API_KEY) missing.push("KAKAO_REST_API_KEY");
  if (!KAKAO_REFRESH_TOKEN && !KAKAO_ACCESS_TOKEN) missing.push("KAKAO_REFRESH_TOKEN 또는 KAKAO_ACCESS_TOKEN");
  return {
    configured: missing.length === 0,
    dailySend: KAKAO_DAILY_SEND,
    missing
  };
}

function summarizeNewsForKakao(report) {
  const generated = new Date(report.generatedAt || Date.now()).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
  const headlines = (report.news || []).slice(0, 4)
    .map((item, index) => `${index + 1}. ${truncateText(item.title, 38)}`)
    .join("\n");
  const alerts = (report.emergencyAlerts || [])
    .filter((item) => item.level === "danger")
    .slice(0, 2)
    .map((item) => `! ${truncateText(item.title, 36)}`)
    .join("\n");
  const lead = [
    `모닝알파 ${generated}`,
    `시장: ${report.summary?.mood || "확인 필요"} / ${report.summary?.riskSignal || "위험 신호 확인"}`,
    `관심 테마: ${report.summary?.topTheme || "확인 필요"}`
  ].join("\n");
  return [lead, alerts, headlines].filter(Boolean).join("\n\n").slice(0, 950);
}

async function postForm(url, params, headers = {}) {
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded;charset=utf-8",
      ...headers
    },
    body: new URLSearchParams(params).toString()
  }, 7000);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error_description || data.msg || `Kakao API ${response.status}`);
  }
  return data;
}

async function refreshKakaoAccessToken() {
  if (!KAKAO_REST_API_KEY || !KAKAO_REFRESH_TOKEN) return KAKAO_ACCESS_TOKEN;
  const params = {
    grant_type: "refresh_token",
    client_id: KAKAO_REST_API_KEY,
    refresh_token: KAKAO_REFRESH_TOKEN
  };
  if (KAKAO_CLIENT_SECRET) params.client_secret = KAKAO_CLIENT_SECRET;
  const data = await postForm("https://kauth.kakao.com/oauth/token", params);
  return data.access_token || KAKAO_ACCESS_TOKEN;
}

async function sendKakaoMemo(text) {
  const status = kakaoConfigStatus();
  if (!status.configured) {
    throw new Error(`카카오 설정이 필요합니다: ${status.missing.join(", ")}`);
  }
  const accessToken = await refreshKakaoAccessToken();
  if (!accessToken) throw new Error("카카오 access token을 만들 수 없습니다.");

  const template = {
    object_type: "text",
    text: truncateText(text, 200),
    link: {
      web_url: PUBLIC_APP_URL,
      mobile_web_url: PUBLIC_APP_URL
    },
    button_title: "웹에서 자세히 보기"
  };

  await postForm("https://kapi.kakao.com/v2/api/talk/memo/default/send", {
    template_object: JSON.stringify(template)
  }, {
    authorization: `Bearer ${accessToken}`
  });
}

function kstDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

async function readKakaoSentState() {
  try {
    return JSON.parse(await fs.readFile(KAKAO_SENT_FILE, "utf8"));
  } catch {
    return {};
  }
}

async function markKakaoSent(dateKey) {
  await fs.writeFile(KAKAO_SENT_FILE, JSON.stringify({
    lastSentDate: dateKey,
    lastSentAt: new Date().toISOString()
  }, null, 2), "utf8");
}

async function sendKakaoTodayBriefing(force = false, oncePerDay = false) {
  const dateKey = kstDateKey();
  if (oncePerDay) {
    const state = await readKakaoSentState();
    if (state.lastSentDate === dateKey) {
      return {
        ok: true,
        skipped: true,
        reason: "Already sent today.",
        sentAt: state.lastSentAt
      };
    }
  }

  const report = await getReport(force);
  const text = summarizeNewsForKakao(report);
  await sendKakaoMemo(text);
  if (oncePerDay) await markKakaoSent(dateKey);
  return {
    ok: true,
    skipped: false,
    sentAt: new Date().toISOString(),
    preview: text
  };
}

module.exports = {
  buildReport,
  buildPortfolioReport,
  generateReport,
  getReport,
  kakaoConfigStatus,
  summarizeNewsForKakao,
  sendKakaoTodayBriefing
};
