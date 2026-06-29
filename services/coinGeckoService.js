const axios = require('axios');
const cache = require('../utils/cache');

const baseURL = process.env.COINGECKO_BASE_URL || 'https://api.coingecko.com/api/v3';
const api = axios.create({
  baseURL,
  timeout: 12000,
  headers: process.env.COINGECKO_API_KEY ? { 'x-cg-demo-api-key': process.env.COINGECKO_API_KEY } : {}
});

let apiCooldownUntil = 0;

function isRateLimitError(error) {
  return error && (error.status === 429 || error.response?.status === 429 || error.code === 'COINGECKO_COOLDOWN');
}

async function get(path, config) {
  if (Date.now() < apiCooldownUntil) {
    const error = new Error('CoinGecko em cooldown temporario apos limite 429');
    error.code = 'COINGECKO_COOLDOWN';
    error.status = 429;
    throw error;
  }
  try {
    return await api.get(path, config);
  } catch (error) {
    if (isRateLimitError(error)) {
      apiCooldownUntil = Date.now() + Number(process.env.COINGECKO_COOLDOWN_MS || 180000);
    }
    throw error;
  }
}

async function markets(vs = 'usd') {
  const { data } = await get('/coins/markets', {
    params: {
      vs_currency: vs,
      order: 'market_cap_desc',
      per_page: 250,
      page: 1,
      sparkline: true,
      price_change_percentage: '1h,24h,7d'
    }
  });
  return data;
}

async function getRanking() {
  return cache.remember('ranking', 30000, async () => ({ usd: await markets('usd'), brl: await markets('brl') }));
}

async function getCoin(id) {
  return cache.remember('coin:' + id, 60000, async () => {
    const { data } = await get('/coins/' + encodeURIComponent(id), {
      params: { localization: false, tickers: false, market_data: true, community_data: false, developer_data: false, sparkline: false }
    });
    return data;
  });
}

async function getChart(id, days = 1, currency = 'usd') {
  return cache.remember('chart:' + id + ':' + days + ':' + currency, 300000, async () => {
    const { data } = await get('/coins/' + encodeURIComponent(id) + '/market_chart', { params: { vs_currency: currency, days } });
    return data;
  });
}

async function getOhlc(id, days = 1, currency = 'usd') {
  const allowedDays = [1, 7, 14, 30, 90, 180, 365];
  const safeDays = allowedDays.includes(Number(days)) ? Number(days) : 1;
  return cache.remember('ohlc:' + id + ':' + safeDays + ':' + currency, 300000, async () => {
    const { data } = await get('/coins/' + encodeURIComponent(id) + '/ohlc', { params: { vs_currency: currency, days: safeDays } });
    return data;
  });
}

async function getGlobal() {
  return cache.remember('global-market', 60000, async () => {
    const { data } = await get('/global');
    return data && data.data ? data.data : null;
  });
}

async function simplePrice(ids, currencies = 'usd,brl', options = {}) {
  const key = 'simple:' + ids + ':' + currencies;
  const ttl = options.live ? 5000 : 45000;
  return cache.remember(key, ttl, async () => {
    const { data } = await get('/simple/price', { params: { ids, vs_currencies: currencies, include_24hr_change: true } });
    return data;
  });
}

function getCachedRanking() {
  return cache.get('ranking', { allowExpired: true });
}

module.exports = { getRanking, getCoin, getChart, getOhlc, getGlobal, simplePrice, getCachedRanking, isRateLimitError };
