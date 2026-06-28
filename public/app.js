if (typeof document !== "undefined" && typeof window !== "undefined") {
const $ = (selector) => document.querySelector(selector);

const elements = {
  authOverlay: $("#authOverlay"),
  authForm: $("#authForm"),
  pinInput: $("#pinInput"),
  authError: $("#authError"),
  refresh: $("#refreshBtn"),
  notification: $("#notificationBtn"),
  clock: $("#marketClock"),
  countdown: $("#countdown"),
  marketMood: $("#marketMood"),
  moodMeter: $("#moodMeter"),
  marketMoodNote: $("#marketMoodNote"),
  topTheme: $("#topTheme"),
  topThemeNote: $("#topThemeNote"),
  newsCount: $("#newsCount"),
  updatedAt: $("#updatedAt"),
  riskSignal: $("#riskSignal"),
  riskNote: $("#riskNote"),
  disclaimer: $("#disclaimer"),
  dataHealth: $("#dataHealth"),
  alertMemo: $("#alertMemo"),
  alertMemoToggle: $("#alertMemoToggle"),
  alertMemoCount: $("#alertMemoCount"),
  alertMemoSummary: $("#alertMemoSummary"),
  emergencyAlerts: $("#emergencyAlerts"),
  portfolio: $("#portfolioList"),
  portfolioForm: $("#portfolioForm"),
  portfolioEditIndex: $("#portfolioEditIndex"),
  portfolioName: $("#portfolioName"),
  portfolioTicker: $("#portfolioTicker"),
  portfolioMarket: $("#portfolioMarket"),
  portfolioAverage: $("#portfolioAverage"),
  portfolioShares: $("#portfolioShares"),
  portfolioReset: $("#portfolioResetBtn"),
  portfolioEditorList: $("#portfolioEditorList"),
  portfolioEditorStatus: $("#portfolioEditorStatus"),
  aiDecisions: $("#aiDecisionList"),
  markets: $("#marketList"),
  stocks: $("#stockList"),
  news: $("#newsList"),
  kakaoSend: $("#kakaoSendBtn"),
  kakaoStatus: $("#kakaoStatus"),
  sectors: $("#sectorList"),
  lessons: $("#lessonList"),
  beginnerIntro: $("#beginnerIntro"),
  learningPath: $("#learningPath"),
  beginnerChecklist: $("#beginnerChecklist"),
  glossary: $("#glossaryList"),
  habits: $("#habitList"),
  todayCourse: $("#todayCourse"),
  courseList: $("#courseList"),
  tabButtons: document.querySelectorAll(".tab-button"),
  tabPanels: document.querySelectorAll(".tab-panel")
};

const escapeHtml = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

const formatTime = (iso) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul"
  }).format(new Date(iso));

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "확인 중";
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 2 }).format(value);
};

const formatPrice = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
};

function renderStockHistory(history = {}) {
  if (!history.isLive || !history.items?.length) {
    return `<div class="history-table empty-history">${escapeHtml(history.error || "가격 데이터 연결 실패")}</div>`;
  }
  return `
    <div class="history-table">
      <div class="history-source">출처: ${escapeHtml(history.source || "가격 데이터")}</div>
      ${history.items.map((item) => {
        const change = item.changePercent;
        const tone = change > 0 ? "up" : change < 0 ? "down" : "flat";
        const sign = change > 0 ? "+" : "";
        return `
          <div class="history-cell ${tone}">
            <span>${escapeHtml(item.label)}</span>
            <strong>${formatPrice(item.price)}</strong>
            <small>${item.label === "현재" ? escapeHtml(item.date || "") : `${sign}${formatNumber(change)}%`}</small>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderAiOpinion(opinion = {}) {
  if (!opinion.signal) return "";
  return `
    <div class="ai-opinion ${escapeHtml(opinion.className || "hold")}">
      <div>
        <span>AI 판단 보조</span>
        <strong>${escapeHtml(opinion.signal)}</strong>
      </div>
      <p>${escapeHtml(opinion.summary || "")}</p>
      <div class="ai-reasons">
        ${(opinion.reasons || []).map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}
      </div>
    </div>
  `;
}

function fallbackAiOpinion(stock = {}) {
  const score = Number(stock.score || 0);
  if (stock.aiOpinion?.signal) return stock.aiOpinion;
  if (score >= 90) {
    return {
      signal: "투자 검토",
      className: "buy",
      summary: "관심 점수가 매우 높습니다. 단, 가격 위치와 실적을 확인한 뒤 분할 접근만 검토하세요.",
      reasons: [`관심 점수 ${score}점`, "AI 보조 임시 판단"]
    };
  }
  if (score >= 80) {
    return {
      signal: "투자 검토",
      className: "watch",
      summary: "강한 관심 구간입니다. 바로 매수보다 뉴스가 실적으로 이어지는지 확인하세요.",
      reasons: [`관심 점수 ${score}점`, "AI 보조 임시 판단"]
    };
  }
  if (score >= 70) {
    return {
      signal: "관심 유지",
      className: "watch",
      summary: "관심 목록에 두고 가격 조정과 실적 변화를 확인할 만합니다.",
      reasons: [`관심 점수 ${score}점`, "AI 보조 임시 판단"]
    };
  }
  if (score >= 60) {
    return {
      signal: "관망",
      className: "hold",
      summary: "신호가 아직 강하지 않습니다. 추가 뉴스와 가격 흐름을 더 지켜보세요.",
      reasons: [`관심 점수 ${score}점`, "AI 보조 임시 판단"]
    };
  }
  return {
    signal: "판단 보류",
    className: "hold",
    summary: "현재 데이터만으로는 투자 판단을 내리기 어렵습니다.",
    reasons: [`관심 점수 ${score}점`, "AI 보조 임시 판단"]
  };
}

function normalizeStocks(stocks = []) {
  return stocks.map((stock) => ({
    ...stock,
    aiOpinion: fallbackAiOpinion(stock)
  }));
}

function renderAiDecisionBoard(stocks = []) {
  const priority = { buy: 1, warning: 2, sell: 3, watch: 4, hold: 5 };
  const decisions = stocks
    .filter((stock) => stock.aiOpinion?.signal)
    .sort((a, b) => (priority[a.aiOpinion.className] || 9) - (priority[b.aiOpinion.className] || 9))
    .slice(0, 6);

  elements.aiDecisions.innerHTML = decisions.length
    ? decisions.map((stock) => `
      <article class="ai-decision-card ${escapeHtml(stock.aiOpinion.className || "hold")}">
        <div>
          <strong>${escapeHtml(stock.name)}</strong>
          <span>${escapeHtml(stock.ticker)} · ${escapeHtml(stock.sector)}</span>
        </div>
        <b>${escapeHtml(stock.aiOpinion.signal)}</b>
        <p>${escapeHtml(stock.aiOpinion.summary)}</p>
        <small>${(stock.aiOpinion.reasons || []).map(escapeHtml).join(" · ")}</small>
      </article>
    `).join("")
    : '<div class="empty-state">AI 판단 보조 데이터가 아직 없습니다. 지금 분석하기를 눌러 주세요.</div>';
}

function marketClassName(market = "") {
  const normalized = String(market).toLowerCase();
  if (normalized.includes("etf")) return "etf";
  if (normalized.includes("kosdaq")) return "kosdaq";
  if (normalized.includes("kospi")) return "kospi";
  return "other";
}

const portfolioStorageKey = "morningAlphaPortfolioHoldings";
let portfolioEditorReady = false;

function portfolioFromReport(portfolio = []) {
  return portfolio.map((item) => ({
    name: item.name || "",
    ticker: item.ticker || "",
    market: item.market || "KOSPI",
    averagePrice: Number(item.averagePrice || 0),
    shares: Number(item.shares || 0)
  })).filter((item) => item.name && item.averagePrice > 0 && item.shares > 0);
}

function getStoredPortfolio() {
  try {
    const parsed = JSON.parse(localStorage.getItem(portfolioStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredPortfolio(holdings) {
  localStorage.setItem(portfolioStorageKey, JSON.stringify(holdings));
}

function clearPortfolioForm() {
  elements.portfolioEditIndex.value = "";
  elements.portfolioName.value = "";
  elements.portfolioTicker.value = "";
  elements.portfolioMarket.value = "KOSPI";
  elements.portfolioAverage.value = "";
  elements.portfolioShares.value = "";
}

function renderPortfolioEditor(holdings = getStoredPortfolio()) {
  if (!elements.portfolioEditorList) return;
  elements.portfolioEditorStatus.textContent = holdings.length
    ? `${holdings.length}개 종목 저장됨`
    : "아직 입력한 종목이 없습니다.";
  elements.portfolioEditorList.innerHTML = holdings.length
    ? holdings.map((item, index) => `
      <article class="portfolio-editor-item">
        <div>
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.ticker || "코드 없음")} · ${escapeHtml(item.market || "KOSPI")} · 평균 ${formatPrice(item.averagePrice)} · ${escapeHtml(item.shares)}주</span>
        </div>
        <button class="portfolio-edit-btn" type="button" data-edit="${index}">수정</button>
        <button class="portfolio-delete-btn" type="button" data-delete="${index}">삭제</button>
      </article>
    `).join("")
    : `<div class="empty-state">위 입력칸에 보유종목을 추가하면 여기서 관리할 수 있습니다.</div>`;
}

async function analyzeStoredPortfolio() {
  const holdings = getStoredPortfolio();
  renderPortfolioEditor(holdings);
  if (!holdings.length) {
    renderPortfolio([]);
    return;
  }
  elements.portfolioEditorStatus.textContent = "현재가 연결 중...";
  try {
    const response = await fetch("/api/portfolio/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ holdings })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "보유종목 점검에 실패했습니다.");
    renderPortfolio(result.portfolio || []);
    elements.portfolioEditorStatus.textContent = `${holdings.length}개 종목 점검 완료`;
  } catch (error) {
    elements.portfolioEditorStatus.textContent = error.message;
  }
}

function initPortfolioEditor(defaultPortfolio = []) {
  if (!elements.portfolioForm || portfolioEditorReady) return;
  portfolioEditorReady = true;
  if (!getStoredPortfolio().length) {
    saveStoredPortfolio(portfolioFromReport(defaultPortfolio));
  }
  renderPortfolioEditor();
  analyzeStoredPortfolio();
}

function portfolioRuleText(opinion = {}, item = {}) {
  if (opinion.rule) return opinion.rule;
  const signal = opinion.signal || "";
  if (!item.ticker || !opinion.currentPrice) return "종목코드 또는 현재가 연결이 안 되어 손익 계산을 보류합니다.";
  if (signal.includes("익절 검토") && !signal.includes("일부")) return "수익률 40% 이상이고 최근 1개월도 20% 이상 오른 경우입니다.";
  if (signal.includes("일부 익절")) return "수익률 20% 이상이지만 최근 1개월 흐름이 꺾인 경우입니다.";
  if (signal.includes("손절")) return "평균단가 대비 손실이 -20% 이하인 경우입니다.";
  if (signal.includes("재점검")) return "손실이 -10% 이하이고 최근 1개월 흐름도 약한 경우입니다.";
  if (signal.includes("보유")) return "급한 과열이나 손절 신호가 약해 보유 기준을 유지하는 구간입니다.";
  return "평균단가, 현재가, 1개월 흐름, 3개월 흐름을 함께 본 보조 판단입니다.";
}

function renderPortfolio(portfolio = []) {
  elements.portfolio.innerHTML = portfolio.length
    ? portfolio.map((item) => {
      const opinion = item.opinion || {};
      const profit = opinion.profit || 0;
      const profitSign = profit > 0 ? "+" : "";
      const hasTicker = Boolean(item.ticker);
      const hasCurrentPrice = opinion.currentPrice !== undefined && opinion.currentPrice !== null && !Number.isNaN(Number(opinion.currentPrice));
      const tickerLabel = hasTicker ? item.ticker : "코드 확인 필요";
      const marketLabel = item.market ? ` · ${escapeHtml(item.market)}` : "";
      const marketClass = marketClassName(item.market);
      const rule = portfolioRuleText(opinion, item);
      return `
        <article class="portfolio-card ${escapeHtml(opinion.className || "hold")} ${hasTicker ? "" : "no-data"}">
          <div class="portfolio-top">
            <div>
              <div class="portfolio-title-line">
                <strong>${escapeHtml(item.name)}</strong>
                <em class="portfolio-market ${escapeHtml(marketClass)}">${escapeHtml(item.market || "시장 확인")}</em>
              </div>
              <span>${escapeHtml(tickerLabel)}${marketLabel} · ${item.shares}주</span>
            </div>
            <b>${escapeHtml(opinion.signal || "판단 보류")}</b>
          </div>
          <div class="portfolio-numbers">
            <span>평균 ${formatPrice(item.averagePrice)}</span>
            <span>현재 ${hasCurrentPrice ? formatPrice(opinion.currentPrice) : "연결 필요"}</span>
            <span class="${(opinion.profitPercent || 0) >= 0 ? "up" : "down"}">${opinion.profitPercent === undefined ? "계산 대기" : `${opinion.profitPercent > 0 ? "+" : ""}${formatNumber(opinion.profitPercent)}%`}</span>
            <span class="${profit >= 0 ? "up" : "down"}">${opinion.profit === undefined ? "계산 대기" : `${profitSign}${formatPrice(profit)}원`}</span>
          </div>
          <div class="portfolio-rule">
            <strong>판단 기준</strong>
            <span>${escapeHtml(rule)}</span>
          </div>
          <p>${escapeHtml(opinion.summary || "")}</p>
          <div class="ai-reasons">
            ${(opinion.reasons || []).map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}
          </div>
        </article>
      `;
    }).join("")
    : '<div class="empty-state">보유종목 데이터가 없습니다.</div>';
}

function submitPortfolioHolding(event) {
  event.preventDefault();
  const holdings = getStoredPortfolio();
  const item = {
    name: elements.portfolioName.value.trim(),
    ticker: elements.portfolioTicker.value.trim().toUpperCase(),
    market: elements.portfolioMarket.value,
    averagePrice: Number(elements.portfolioAverage.value),
    shares: Number(elements.portfolioShares.value)
  };
  if (!item.name || item.averagePrice <= 0 || item.shares <= 0) return;

  const editIndex = elements.portfolioEditIndex.value === "" ? -1 : Number(elements.portfolioEditIndex.value);
  if (editIndex >= 0) {
    holdings[editIndex] = item;
  } else {
    holdings.push(item);
  }
  saveStoredPortfolio(holdings);
  clearPortfolioForm();
  analyzeStoredPortfolio();
}

function handlePortfolioEditorClick(event) {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  const holdings = getStoredPortfolio();

  if (editButton) {
    const index = Number(editButton.dataset.edit);
    const item = holdings[index];
    if (!item) return;
    elements.portfolioEditIndex.value = String(index);
    elements.portfolioName.value = item.name || "";
    elements.portfolioTicker.value = item.ticker || "";
    elements.portfolioMarket.value = item.market || "KOSPI";
    elements.portfolioAverage.value = item.averagePrice || "";
    elements.portfolioShares.value = item.shares || "";
    elements.portfolioName.focus();
  }

  if (deleteButton) {
    const index = Number(deleteButton.dataset.delete);
    holdings.splice(index, 1);
    saveStoredPortfolio(holdings);
    clearPortfolioForm();
    analyzeStoredPortfolio();
  }
}

function renderMarkets(markets = []) {
  elements.markets.innerHTML = markets.map((market) => {
    const change = Number(market.changePercent || 0);
    const tone = change > 0 ? "up" : change < 0 ? "down" : "flat";
    const sign = change > 0 ? "+" : "";
    const liveLabel = market.isLive ? "실시간" : "연결 실패";
    return `
      <article class="market-card ${tone}">
        <span>${escapeHtml(market.name)}</span>
        <strong>${formatNumber(market.price)}</strong>
        <small>${sign}${formatNumber(change)}%</small>
        <em class="${market.isLive ? "live" : "stale"}">${escapeHtml(liveLabel)}</em>
      </article>
    `;
  }).join("");
}

function renderStocks(stocks = []) {
  const normalizedStocks = normalizeStocks(stocks);
  elements.stocks.innerHTML = stocks.length
    ? normalizedStocks.map((stock, index) => `
      <article class="stock-card ${escapeHtml(stock.className || "")}">
        <span class="rank">${String(index + 1).padStart(2, "0")}</span>
        <div class="stock-name">
          <strong>${escapeHtml(stock.name)}</strong>
          <small>${escapeHtml(stock.ticker)} · ${escapeHtml(stock.market)}</small>
          <span class="tag">${escapeHtml(stock.sector)}</span>
        </div>
        <div class="stock-reason">
          ${renderAiOpinion(stock.aiOpinion)}
          <p>${escapeHtml(stock.reason)}</p>
          <small>${escapeHtml(stock.guidance || "")}</small>
          <div class="reason-chips">
            ${(stock.scoreReasons || []).map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}
          </div>
          <div class="reason-chips recommendation-chips">
            ${(stock.recommendationReasons || []).map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}
          </div>
          ${renderStockHistory(stock.history)}
        </div>
        <div class="score">
          <strong>${stock.score}</strong>
          <span>${escapeHtml(stock.action)} / 100</span>
        </div>
      </article>
    `).join("")
    : '<div class="empty-state">현재 조건에 맞는 관심 후보가 없습니다.</div>';
}

function renderNews(news = []) {
  const groups = [
    { title: "오늘 뉴스", items: news.filter((item) => item.ageLabel === "오늘") },
    { title: "어제·이전 뉴스", items: news.filter((item) => item.ageLabel !== "오늘") }
  ].filter((group) => group.items.length);

  const renderItems = (items) => items.map((item) => `
      <a class="news-item" href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer">
        <div class="news-meta">
          <b>${escapeHtml(item.ageLabel || "날짜 확인")}</b><br>
          ${escapeHtml(item.region)}<br>${escapeHtml(item.source)}
        </div>
        <div>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.impact)}</p>
          <small>${escapeHtml(item.publishedAt ? formatTime(item.publishedAt) : "시간 확인 필요")}</small>
        </div>
      </a>
    `).join("");

  elements.news.innerHTML = groups.length
    ? groups.map((group) => `
      <section class="news-group">
        <div class="news-group-title">
          <strong>${escapeHtml(group.title)}</strong>
          <span>${group.items.length}건</span>
        </div>
        ${renderItems(group.items)}
      </section>
    `).join("")
    : '<div class="empty-state">수집된 뉴스가 없습니다. 잠시 뒤 다시 분석해 주세요.</div>';
}

function renderSectors(sectors = []) {
  elements.sectors.innerHTML = sectors.map((sector) => {
    const tone = sector.className || (sector.score >= 70 ? "watch" : sector.score >= 50 ? "neutral" : "caution");
    return `
      <article class="sector-card">
        <div class="sector-top">
          <strong>${escapeHtml(sector.name)}</strong>
          <span class="sector-score ${tone}">${escapeHtml(sector.tone)} ${sector.score}</span>
        </div>
        <p>${escapeHtml(sector.issue)}</p>
        <small class="score-explain">${escapeHtml(sector.scoreExplanation || "")}</small>
        <div class="reason-chips">
          ${(sector.scoreReasons || []).map((reason) => `<span>${escapeHtml(reason)}</span>`).join("")}
        </div>
        <div class="keyword-row">
          ${(sector.keywords || []).slice(0, 3).map((keyword) => `<span>${escapeHtml(keyword)}</span>`).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderLessons(lessons = []) {
  elements.lessons.innerHTML = lessons.map((lesson) => `
    <article class="lesson-card">
      <strong>${escapeHtml(lesson.title)}</strong>
      <p>${escapeHtml(lesson.body)}</p>
      <div>${lesson.terms.map((term) => `<span>${escapeHtml(term)}</span>`).join("")}</div>
    </article>
  `).join("");
}

function renderBeginnerGuide(guide = {}) {
  if (!guide.intro) return;

  elements.beginnerIntro.textContent = guide.intro;
  elements.learningPath.innerHTML = (guide.path || []).map((item) => `
    <div class="path-item">
      <span>${escapeHtml(item.step)}</span>
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.body)}</p>
      </div>
    </div>
  `).join("");

  elements.beginnerChecklist.innerHTML = (guide.checklist || []).map((item) => `
    <li>${escapeHtml(item)}</li>
  `).join("");

  elements.glossary.innerHTML = (guide.glossary || []).map((item) => `
    <details class="term-card">
      <summary>${escapeHtml(item.term)}</summary>
      <p>${escapeHtml(item.meaning)}</p>
      <small>${escapeHtml(item.example)}</small>
    </details>
  `).join("");

  elements.habits.innerHTML = (guide.habits || []).map((habit) => `
    <span>${escapeHtml(habit)}</span>
  `).join("");
}

function renderCourse(todayCourse = {}, course = []) {
  if (todayCourse.title) {
    elements.todayCourse.innerHTML = `
      <span class="course-day">${todayCourse.day}장</span>
      <h3>${escapeHtml(todayCourse.title)}</h3>
      <small>참고 개념: ${escapeHtml(todayCourse.source)}</small>
      <strong>${escapeHtml(todayCourse.goal)}</strong>
      <p>${escapeHtml(todayCourse.lesson)}</p>
      <div class="course-action">
        <span>오늘 할 일</span>
        <p>${escapeHtml(todayCourse.action)}</p>
      </div>
    `;
  }

  elements.courseList.innerHTML = (course || []).map((item) => `
    <details class="course-card" ${item.day === todayCourse.day ? "open" : ""}>
      <summary>
        <span>${item.day}장</span>
        <strong>${escapeHtml(item.title)}</strong>
      </summary>
      <small>참고 개념: ${escapeHtml(item.source)}</small>
      <p>${escapeHtml(item.lesson)}</p>
      <div class="course-action compact">
        <span>실습</span>
        <p>${escapeHtml(item.action)}</p>
      </div>
    </details>
  `).join("");
}

function renderDataHealth(dataHealth = {}) {
  const status = dataHealth.status || "fallback";
  elements.dataHealth.className = `data-health ${status}`;
  elements.dataHealth.innerHTML = `
    <strong>${escapeHtml(dataHealth.label || "데이터 상태 확인 필요")}</strong>
    <span>${escapeHtml(dataHealth.note || "최신 데이터 연결 상태를 확인하지 못했습니다.")}</span>
    <small>
      지수 ${escapeHtml(dataHealth.liveMarketCount ?? 0)}/${escapeHtml(dataHealth.totalMarketCount ?? 0)}개 실시간 ·
      뉴스 ${escapeHtml(dataHealth.liveNewsCount ?? 0)}건 수집 ·
      생성 ${formatTime(dataHealth.generatedAt || new Date().toISOString())}
    </small>
  `;
}

function renderEmergencyAlerts(alerts = []) {
  const dangerCount = alerts.filter((alert) => alert.level === "danger").length;
  if (elements.alertMemo) {
    elements.alertMemo.classList.toggle("has-alerts", alerts.length > 0);
    elements.alertMemo.classList.toggle("has-danger", dangerCount > 0);
  }
  if (elements.alertMemoCount) {
    elements.alertMemoCount.textContent = alerts.length;
  }
  if (elements.alertMemoSummary) {
    elements.alertMemoSummary.textContent = alerts.length
      ? `총 ${alerts.length}건 · 위험 ${dangerCount}건`
      : "문제 없음";
  }

  elements.emergencyAlerts.innerHTML = alerts.length
    ? alerts.map((alert) => `
      <article class="emergency-alert ${escapeHtml(alert.level || "watch")}">
        <strong>${escapeHtml(alert.title)}</strong>
        <p>${escapeHtml(alert.message)}</p>
        <small>${escapeHtml(alert.source || "시장 경보")} · ${escapeHtml(alert.checkedAt || "")}</small>
      </article>
    `).join("")
    : `<div class="alert-empty">현재 긴급사항은 없습니다.</div>`;
}

function emergencyAlertKey(alert = {}) {
  return [alert.title, alert.message, alert.checkedAt].filter(Boolean).join("|");
}

function notifyEmergencyAlerts(alerts = []) {
  const dangerAlerts = alerts.filter((alert) => alert.level === "danger");
  if (!dangerAlerts.length || !elements.alertMemo) return;
  elements.alertMemo.classList.remove("collapsed");
  elements.alertMemoToggle?.setAttribute("aria-expanded", "true");
}

function renderReport(report) {
  const stocks = normalizeStocks(report.stocks);
  elements.marketMood.textContent = report.summary.mood;
  elements.moodMeter.style.width = `${report.summary.moodScore}%`;
  elements.marketMoodNote.textContent = report.summary.moodNote;
  elements.topTheme.textContent = report.summary.topTheme;
  elements.topThemeNote.textContent = report.summary.topStockNote
    ? `${report.summary.topThemeNote} ${report.summary.topStockNote}`
    : report.summary.topThemeNote;
  elements.newsCount.textContent = report.news.length;
  elements.updatedAt.textContent = `${formatTime(report.generatedAt)} 기준`;
  elements.riskSignal.textContent = report.summary.riskSignal;
  elements.riskNote.textContent = report.summary.riskNote;
  elements.disclaimer.textContent = report.disclaimer;

  renderDataHealth(report.dataHealth);
  renderEmergencyAlerts(report.emergencyAlerts || []);
  notifyEmergencyAlerts(report.emergencyAlerts || []);
  renderPortfolio(report.portfolio);
  initPortfolioEditor(report.portfolio);
  renderAiDecisionBoard(stocks);
  renderMarkets(report.markets);
  renderStocks(stocks);
  renderNews(report.news);
  renderSectors(report.sectors);
  renderLessons(report.lessons);
  renderBeginnerGuide(report.beginnerGuide);
  renderCourse(report.todayCourse, report.dailyCourse);
}

function setActiveTab(tabName) {
  elements.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabName);
  });
  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setAuthenticated(isAuthenticated) {
  document.body.classList.toggle("auth-locked", !isAuthenticated);
  elements.authOverlay.classList.toggle("hidden", isAuthenticated);
  if (!isAuthenticated) {
    setTimeout(() => elements.pinInput.focus(), 50);
  }
}

async function checkSession() {
  try {
    const response = await fetch("/api/session");
    const session = await response.json();
    setAuthenticated(Boolean(session.authenticated));
    if (session.authenticated) {
      await loadReport();
      await loadKakaoStatus();
    }
  } catch {
    setAuthenticated(false);
  }
}

async function submitPin(event) {
  event.preventDefault();
  elements.authError.textContent = "";
  const pin = elements.pinInput.value.trim();
  if (!pin) return;

  const button = elements.authForm.querySelector("button");
  button.disabled = true;
  button.textContent = "확인 중...";
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ pin })
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "PIN이 맞지 않습니다.");
    elements.pinInput.value = "";
    setAuthenticated(true);
    await loadReport();
    await loadKakaoStatus();
  } catch (error) {
    elements.authError.textContent = error.message;
    elements.pinInput.select();
  } finally {
    button.disabled = false;
    button.textContent = "열기";
  }
}

async function loadReport(force = false) {
  elements.refresh.disabled = true;
  elements.refresh.textContent = "분석 중...";
  try {
    const response = await fetch(`/api/report${force ? "?refresh=1" : ""}`);
    if (!response.ok) throw new Error("브리핑을 불러오지 못했습니다.");
    renderReport(await response.json());
  } catch (error) {
    elements.stocks.innerHTML = `<div class="empty-state">${escapeHtml(error.message)} 서버 실행 상태를 확인해 주세요.</div>`;
  } finally {
    elements.refresh.disabled = false;
    elements.refresh.textContent = "지금 분석하기";
  }
}

async function loadKakaoStatus() {
  if (!elements.kakaoStatus) return;
  try {
    const response = await fetch("/api/kakao/status");
    if (!response.ok) return;
    const status = await response.json();
    elements.kakaoStatus.textContent = status.configured
      ? (status.dailySend ? "카카오 매일 발송 켜짐" : "카카오 수동 발송 가능")
      : "카카오 설정 필요";
  } catch {
    elements.kakaoStatus.textContent = "카카오 상태 확인 실패";
  }
}

async function sendKakaoBriefing() {
  if (!elements.kakaoSend) return;
  elements.kakaoSend.disabled = true;
  elements.kakaoSend.textContent = "발송 중...";
  if (elements.kakaoStatus) elements.kakaoStatus.textContent = "카카오톡 발송 중";
  try {
    const response = await fetch("/api/kakao/send-today", { method: "POST" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "카카오톡 발송에 실패했습니다.");
    if (elements.kakaoStatus) elements.kakaoStatus.textContent = "카카오톡 발송 완료";
  } catch (error) {
    if (elements.kakaoStatus) elements.kakaoStatus.textContent = error.message;
  } finally {
    elements.kakaoSend.disabled = false;
    elements.kakaoSend.textContent = "카카오톡으로 보내기";
  }
}

function refreshLiveReport() {
  if (document.body.classList.contains("auth-locked")) return;
  loadReport(true);
}

function updateClock() {
  const now = new Date();
  elements.clock.textContent = `서울 ${new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul"
  }).format(now)}`;

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul"
  }).formatToParts(now).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});

  const currentSeconds = Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second);
  const targetSeconds = 7 * 3600;
  const remaining = (targetSeconds - currentSeconds + 86400) % 86400 || 86400;
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  elements.countdown.textContent = [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function showSiteAlertsOnly() {
  if (elements.alertMemo) {
    elements.alertMemo.classList.remove("collapsed");
    elements.alertMemoToggle?.setAttribute("aria-expanded", "true");
  }
  if (elements.notification) {
    elements.notification.textContent = "사이트 안에서만 표시";
  }
}

async function runSevenAmBriefing() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul"
  }).formatToParts(new Date()).reduce((acc, part) => ({ ...acc, [part.type]: part.value }), {});
  const today = `${parts.year}-${parts.month}-${parts.day}`;
  const lastRun = localStorage.getItem("morningAlphaLastRun");

  if (parts.hour !== "07" || parts.minute !== "00" || lastRun === today) return;
  localStorage.setItem("morningAlphaLastRun", today);
  await loadReport(true);

}

elements.refresh.addEventListener("click", () => loadReport(true));
elements.notification.addEventListener("click", showSiteAlertsOnly);
if (elements.kakaoSend) {
  elements.kakaoSend.addEventListener("click", sendKakaoBriefing);
}
if (elements.portfolioForm) {
  elements.portfolioForm.addEventListener("submit", submitPortfolioHolding);
}
if (elements.portfolioReset) {
  elements.portfolioReset.addEventListener("click", clearPortfolioForm);
}
if (elements.portfolioEditorList) {
  elements.portfolioEditorList.addEventListener("click", handlePortfolioEditorClick);
}
if (elements.alertMemoToggle && elements.alertMemo) {
  elements.alertMemoToggle.addEventListener("click", () => {
    const collapsed = elements.alertMemo.classList.toggle("collapsed");
    elements.alertMemoToggle.setAttribute("aria-expanded", String(!collapsed));
  });
}
elements.authForm.addEventListener("submit", submitPin);
elements.tabButtons.forEach((button) => {
  button.addEventListener("click", () => setActiveTab(button.dataset.tab));
});

elements.notification.textContent = "사이트 알림만";

setInterval(updateClock, 1000);
setInterval(runSevenAmBriefing, 15000);
setInterval(refreshLiveReport, 5 * 60 * 1000);
updateClock();
checkSession();
}
