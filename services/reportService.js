const core = require("./morningAlphaCore.cjs");

async function getMorningReport({ refresh = false } = {}) {
  return core.getReport(refresh);
}

async function generateMorningReport() {
  return core.generateReport();
}

async function analyzePortfolio(holdings = []) {
  return core.buildPortfolioReport(holdings);
}

module.exports = {
  analyzePortfolio,
  generateMorningReport,
  getMorningReport
};
