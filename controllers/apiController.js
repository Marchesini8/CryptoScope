const coin = require('../services/coinGeckoService');
const binance = require('../services/binanceService');

function logFallback(label, error) {
  if (coin.isRateLimitError && coin.isRateLimitError(error)) return;
  console.error(label + ':', error.message);
}

function preferBinance() {
  return String(process.env.MARKET_DATA_PROVIDER || '').toLowerCase() === 'binance';
}

const chartDays = { '1m': 1, '5m': 1, '15m': 1, '1h': 7, '4h': 30, '1d': 365, '24h': 1, '7d': 90, '30d': 365, '90d': 90, '180d': 180, '1y': 365 };
const ohlcDays = { '1m': 1, '5m': 1, '15m': 1, '1h': 7, '4h': 30, '1d': 365, '24h': 1, '7d': 90, '30d': 365, '90d': 90, '180d': 180, '1y': 365 };

const fallbackRows = [
  ['bitcoin', 'Bitcoin', 'btc', 60400, 335000, 1.2, 0.4, -2.1, 1200000000000, 28000000000, 19800000],
  ['ethereum', 'Ethereum', 'eth', 3300, 18300, 0.7, -0.2, 1.8, 390000000000, 13000000000, 120000000],
  ['tether', 'Tether', 'usdt', 1, 5.55, 0.01, 0.01, 0.02, 186000000000, 38000000000, 186000000000],
  ['binancecoin', 'BNB', 'bnb', 590, 3270, 0.2, 0.6, 2.3, 87000000000, 1100000000, 147000000],
  ['solana', 'Solana', 'sol', 145, 805, -0.3, 1.1, 4.2, 67000000000, 3500000000, 460000000],
  ['ripple', 'XRP', 'xrp', 0.52, 2.88, -0.1, -0.7, 0.5, 29000000000, 1200000000, 56000000000],
  ['usd-coin', 'USDC', 'usdc', 1, 5.55, 0.01, 0.0, 0.0, 73700000000, 5400000000, 73700000000],
  ['tron', 'TRON', 'trx', 0.32, 1.78, 0.1, 0.55, -1.14, 30560000000, 388000000, 94850000000],
  ['cardano', 'Cardano', 'ada', 0.44, 2.44, 0.1, 0.3, -1.4, 15800000000, 420000000, 36000000000],
  ['dogecoin', 'Dogecoin', 'doge', 0.12, 0.67, 0.4, 0.8, 3.1, 17500000000, 800000000, 144000000000]
];

function spark(base) {
  return { price: Array.from({ length: 32 }, (_, i) => base * (1 + Math.sin(i / 4) * 0.012 + i * 0.0004)) };
}

function marketRow(row, currency = 'usd') {
  const [id, name, symbol, usd, brl, h1, h24, d7, marketCap, volume, supply] = row;
  const price = currency === 'brl' ? brl : usd;
  return {
    id,
    name,
    symbol,
    image: '/favicon.png',
    current_price: price,
    price_change_percentage_1h_in_currency: h1,
    price_change_percentage_24h_in_currency: h24,
    price_change_percentage_7d_in_currency: d7,
    market_cap: currency === 'brl' ? marketCap * 5.55 : marketCap,
    total_volume: currency === 'brl' ? volume * 5.55 : volume,
    circulating_supply: supply,
    sparkline_in_7d: spark(price)
  };
}

function fallbackRanking() {
  return {
    usd: fallbackRows.map(row => marketRow(row, 'usd')),
    brl: fallbackRows.map(row => marketRow(row, 'brl'))
  };
}

async function rankingWithBinance() {
  const base = fallbackRanking();
  const direct = await binance.marketRanking(100).catch(() => null);
  if (direct && Array.isArray(direct.usd) && direct.usd.length) return direct;
  const live = await binance.rankingFromRows(fallbackRows).catch(() => []);
  if (!live.length) return base;
  const byId = new Map(live.map(item => [item.id, item]));
  const usd = base.usd.map(row => {
    const item = byId.get(row.id);
    if (!item) return row;
    const price = item.current_price || row.current_price;
    const oldPrice = row.current_price || price;
    return {
      ...row,
      current_price: price,
      price_change_percentage_24h_in_currency: item.price_change_percentage_24h_in_currency ?? row.price_change_percentage_24h_in_currency,
      total_volume: item.total_volume || row.total_volume,
      market_cap: row.market_cap && oldPrice ? row.market_cap * (price / oldPrice) : row.market_cap,
      sparkline_in_7d: spark(price)
    };
  });
  return { usd, brl: usd.map(row => ({ ...row, current_price: row.current_price * 5.55, market_cap: row.market_cap * 5.55, total_volume: row.total_volume * 5.55 })) };
}

async function pricesWithBinance(ids, currencies) {
  const fallback = fallbackPrices(ids, currencies);
  const live = await binance.simplePrices(ids, currencies).catch(() => ({}));
  return { ...fallback, ...live };
}

function hashText(text) {
  return String(text || 'coin').split('').reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 7);
}

function fallbackMarket(id, currency = 'usd') {
  const cached = coin.getCachedRanking && coin.getCachedRanking();
  const cachedRows = cached && Array.isArray(cached[currency]) ? cached[currency] : [];
  const cachedCoin = cachedRows.find(item => item.id === id);
  if (cachedCoin && Number(cachedCoin.current_price) > 0) return cachedCoin;
  const fallback = fallbackRanking()[currency].find(item => item.id === id);
  if (fallback) return fallback;
  const seed = hashText(id);
  const price = Math.max(0.000001, ((seed % 500000) + 100) / 100);
  return {
    id,
    name: String(id || 'coin').replace(/-/g, ' '),
    symbol: String(id || 'coin').slice(0, 5),
    image: '/favicon.png',
    current_price: currency === 'brl' ? price * 5.55 : price,
    price_change_percentage_24h_in_currency: ((seed % 1400) - 700) / 100,
    total_volume: price * ((seed % 900000) + 100000)
  };
}

function fallbackChart(id, days = 1, currency = 'usd') {
  const safeDays = Math.max(1, Number(days) || 1);
  const now = Date.now();
  const points = safeDays <= 1 ? 288 : Math.min(720, Math.max(180, safeDays * 24));
  const step = Math.max(60000, Math.floor((safeDays * 86400000) / points));
  const market = fallbackMarket(id, currency);
  const base = Math.max(0.000001, Number(market.current_price) || 1);
  const seed = hashText(id + ':' + currency);
  const prices = [];
  const market_caps = [];
  const total_volumes = [];
  let price = base * (1 + (((seed % 120) - 60) / 10000));
  for (let i = 0; i < points; i++) {
    const ts = now - ((points - 1 - i) * step);
    const cycleA = Math.sin((i + (seed % 41)) / 8) * 0.0018;
    const cycleB = Math.cos((i + (seed % 29)) / 19) * 0.0011;
    const pseudo = Math.sin((i * 12.9898 + seed) * 0.37) * 0.0014;
    const pullToBase = ((base - price) / base) * 0.045;
    price = Math.max(0.000001, price * (1 + cycleA + cycleB + pseudo + pullToBase));
    const volumeWave = 0.75 + Math.abs(Math.sin((i + seed % 17) / 14)) * 0.7;
    const volume = Math.max(1, Number(market.total_volume || base * 1000000) * volumeWave / points);
    prices.push([ts, price]);
    market_caps.push([ts, price * 1000000]);
    total_volumes.push([ts, volume]);
  }
  const last = prices[prices.length - 1];
  if (last) last[1] = base;
  return { prices, market_caps, total_volumes, fallback: true };
}

function fallbackPrices(ids, currencies) {
  const list = String(ids || 'bitcoin').split(',').map(id => id.trim()).filter(Boolean);
  const currs = String(currencies || 'usd,brl').split(',').map(item => item.trim()).filter(Boolean);
  return list.reduce((acc, id) => {
    acc[id] = currs.reduce((row, currency) => {
      row[currency] = fallbackMarket(id, currency).current_price;
      return row;
    }, { usd_24h_change: fallbackMarket(id, 'usd').price_change_percentage_24h_in_currency || 0 });
    return acc;
  }, {});
}

exports.ranking = async (req, res) => {
  if (preferBinance()) return res.json(await rankingWithBinance());
  try {
    const ranking = await coin.getRanking();
    if (!ranking || !Array.isArray(ranking.usd) || !ranking.usd.length) return res.json(await rankingWithBinance());
    res.json(ranking);
  } catch (error) {
    logFallback('Ranking API fallback', error);
    res.json(await rankingWithBinance());
  }
};

exports.chart = async (req, res) => {
  const days = chartDays[req.query.period] || 1;
  const currency = req.query.currency || 'usd';
  if (preferBinance() && currency === 'usd') {
    const data = await binance.chart(req.params.id, days).catch(() => null);
    if (data && Array.isArray(data.prices) && data.prices.length > 1) return res.json(data);
  }
  try {
    const data = await coin.getChart(req.params.id, days, currency);
    if (!data || !Array.isArray(data.prices) || data.prices.length < 2) return res.json((currency === 'usd' && await binance.chart(req.params.id, days).catch(() => null)) || fallbackChart(req.params.id, days, currency));
    res.json(data);
  } catch (error) {
    logFallback('Chart API fallback', error);
    res.json((currency === 'usd' && await binance.chart(req.params.id, days).catch(() => null)) || fallbackChart(req.params.id, days, currency));
  }
};

exports.ohlc = async (req, res) => {
  try {
    const data = await coin.getOhlc(req.params.id, ohlcDays[req.query.period] || 1, req.query.currency || 'usd');
    res.json(Array.isArray(data) ? data : []);
  } catch (error) {
    logFallback('OHLC API fallback', error);
    res.json([]);
  }
};

exports.price = async (req, res) => {
  const ids = req.query.ids || 'bitcoin';
  const currencies = req.query.currencies || 'usd,brl';
  if (preferBinance()) return res.json(await pricesWithBinance(ids, currencies));
  try {
    const data = await coin.simplePrice(ids, currencies, { live: req.query.live === '1' });
    const fallback = await pricesWithBinance(ids, currencies);
    res.json(data && typeof data === 'object' && Object.keys(data).length ? { ...fallback, ...data } : fallback);
  } catch (error) {
    logFallback('Price API fallback', error);
    res.json(await pricesWithBinance(ids, currencies));
  }
};

exports.searchCoins = async (req, res) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const ranking = await coin.getRanking();
    const rows = (ranking.usd || [])
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      .slice(0, 20)
      .map(c => ({ id: c.id, name: c.name, symbol: c.symbol, image: c.image, price: c.current_price, change: c.price_change_percentage_24h_in_currency }));
    if (rows.length) return res.json(rows);
    const live = await binance.marketRanking(100).catch(() => null);
    const liveRows = live && Array.isArray(live.usd) ? live.usd : [];
    res.json((liveRows.length ? liveRows : fallbackRanking().usd)
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      .slice(0, 20)
      .map(c => ({ id: c.id, name: c.name, symbol: c.symbol, image: c.image, price: c.current_price, change: c.price_change_percentage_24h_in_currency })));
  } catch (error) {
    logFallback('Search API fallback', error);
    {
    const q = String(req.query.q || '').trim().toLowerCase();
    const live = await binance.marketRanking(100).catch(() => null);
    const liveRows = live && Array.isArray(live.usd) ? live.usd : [];
    res.json((liveRows.length ? liveRows : fallbackRanking().usd)
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
      .slice(0, 20)
      .map(c => ({ id: c.id, name: c.name, symbol: c.symbol, image: c.image, price: c.current_price, change: c.price_change_percentage_24h_in_currency })));
  }
  }
};

function fallbackSearch(q) {
  return fallbackRanking().usd
    .filter(c => !q || c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q) || c.id.toLowerCase().includes(q))
    .slice(0, 20)
    .map(c => ({ id: c.id, name: c.name, symbol: c.symbol, image: c.image, price: c.current_price, change: c.price_change_percentage_24h_in_currency }));
}
