
const coin = require('../services/coinGeckoService');
const binance = require('../services/binanceService');

function logFallback(label, error) {
  if (coin.isRateLimitError && coin.isRateLimitError(error)) return;
  console.error(label + ':', error.message);
}
const fmt = require('../utils/format');

const fallbackRows = [
  ['bitcoin', 'Bitcoin', 'btc', 60400, 335000, 1.2, 0.4, -2.1, 1200000000000, 28000000000, 19800000],
  ['ethereum', 'Ethereum', 'eth', 3300, 18300, 0.7, -0.2, 1.8, 390000000000, 13000000000, 120000000],
  ['tether', 'Tether', 'usdt', 1, 5.55, 0.01, 0.01, 0.02, 186000000000, 38000000000, 186000000000],
  ['solana', 'Solana', 'sol', 145, 805, -0.3, 1.1, 4.2, 67000000000, 3500000000, 460000000],
  ['binancecoin', 'BNB', 'bnb', 590, 3270, 0.2, 0.6, 2.3, 87000000000, 1100000000, 147000000],
  ['ripple', 'XRP', 'xrp', 0.52, 2.88, -0.1, -0.7, 0.5, 29000000000, 1200000000, 56000000000],
  ['cardano', 'Cardano', 'ada', 0.44, 2.44, 0.1, 0.3, -1.4, 15800000000, 420000000, 36000000000],
  ['usd-coin', 'USDC', 'usdc', 1, 5.55, 0.01, 0.0, 0.0, 73700000000, 5400000000, 73700000000],
  ['tron', 'TRON', 'trx', 0.32, 1.78, 0.1, 0.55, -1.14, 30560000000, 388000000, 94850000000],
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

async function fallbackRankingLive() {
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

async function enrichCoinWithBinance(data) {
  const tick = await binance.ticker(data.id).catch(() => null);
  if (!tick) return data;
  return {
    ...data,
    market_data: {
      ...data.market_data,
      current_price: { ...data.market_data.current_price, usd: tick.price, brl: tick.price * 5.55 },
      price_change_percentage_24h: tick.change24h,
      high_24h: { ...data.market_data.high_24h, usd: tick.high24h || data.market_data.high_24h.usd },
      low_24h: { ...data.market_data.low_24h, usd: tick.low24h || data.market_data.low_24h.usd },
      total_volume: { ...data.market_data.total_volume, usd: tick.quoteVolume || data.market_data.total_volume.usd }
    }
  };
}

function fallbackCoin(id) {
  const row = fallbackRows.find(item => item[0] === id) || [id, id.replace(/-/g, ' '), id.slice(0, 4), 0, 0, 0, 0, 0, 0, 0, 0];
  const [coinId, name, symbol, usd, brl, , h24, , marketCap, volume, supply] = row;
  return {
    id: coinId,
    name,
    symbol,
    image: { small: '/favicon.png', large: '/favicon.png' },
    description: { en: 'Dados temporariamente indisponiveis. O grafico tentara carregar os precos pela API.' },
    links: { homepage: ['#'], blockchain_site: ['#'] },
    market_data: {
      current_price: { usd, brl },
      price_change_percentage_24h: h24,
      high_24h: { usd: usd ? usd * 1.03 : 0 },
      low_24h: { usd: usd ? usd * 0.97 : 0 },
      market_cap: { usd: marketCap },
      total_volume: { usd: volume },
      circulating_supply: supply
    }
  };
}

function normalizeCoin(data, id) {
  const fallback = fallbackCoin(id);
  return {
    ...fallback,
    ...data,
    image: { ...fallback.image, ...(data.image || {}) },
    description: { ...fallback.description, ...(data.description || {}) },
    links: { ...fallback.links, ...(data.links || {}) },
    market_data: {
      ...fallback.market_data,
      ...(data.market_data || {}),
      current_price: { ...fallback.market_data.current_price, ...((data.market_data || {}).current_price || {}) },
      high_24h: { ...fallback.market_data.high_24h, ...((data.market_data || {}).high_24h || {}) },
      low_24h: { ...fallback.market_data.low_24h, ...((data.market_data || {}).low_24h || {}) },
      market_cap: { ...fallback.market_data.market_cap, ...((data.market_data || {}).market_cap || {}) },
      total_volume: { ...fallback.market_data.total_volume, ...((data.market_data || {}).total_volume || {}) }
    }
  };
}

exports.home = async (req, res) => {
  let ranking;
  try {
    ranking = await coin.getRanking();
    if (!ranking || !Array.isArray(ranking.usd) || !ranking.usd.length) ranking = await fallbackRankingLive();
  } catch (error) {
    logFallback('Home ranking fallback', error);
    ranking = await fallbackRankingLive();
  }
  res.render('pages/home', { title: 'CryptoRadar - Ranking de criptomoedas', description: 'Ranking das 100 maiores criptomoedas com precos em tempo real.', ranking, fmt });
};

exports.coinPage = async (req, res) => {
  const id = req.params.id;
  let data;
  try {
    data = await enrichCoinWithBinance(normalizeCoin(await coin.getCoin(id), id));
  } catch (error) {
    logFallback('Coin page fallback', error);
    data = await enrichCoinWithBinance(fallbackCoin(id));
  }
  res.render('pages/coin', { title: data.name + ' (' + data.symbol.toUpperCase() + ') - CryptoRadar', description: 'Preco, grafico, market cap e dados de ' + data.name + '.', coin: data, fmt });
};

exports.aliasCoin = (id) => async (req, res) => res.redirect('/moeda/' + id);
