const axios = require('axios');
const cache = require('../utils/cache');

const baseURL = process.env.BINANCE_BASE_URL || 'https://api.binance.com/api/v3';
const api = axios.create({ baseURL, timeout: 8000 });
const brlRate = Number(process.env.USD_BRL_FALLBACK || 5.55);

const catalog = [
  ['bitcoin','Bitcoin','btc','BTCUSDT',19800000],
  ['ethereum','Ethereum','eth','ETHUSDT',120000000],
  ['tether','Tether','usdt','USDCUSDT',186000000000],
  ['binancecoin','BNB','bnb','BNBUSDT',147000000],
  ['solana','Solana','sol','SOLUSDT',460000000],
  ['ripple','XRP','xrp','XRPUSDT',56000000000],
  ['usd-coin','USDC','usdc','USDCUSDT',73700000000],
  ['dogecoin','Dogecoin','doge','DOGEUSDT',144000000000],
  ['cardano','Cardano','ada','ADAUSDT',36000000000],
  ['tron','TRON','trx','TRXUSDT',94850000000],
  ['chainlink','Chainlink','link','LINKUSDT',608000000],
  ['avalanche-2','Avalanche','avax','AVAXUSDT',410000000],
  ['sui','Sui','sui','SUIUSDT',3200000000],
  ['stellar','Stellar','xlm','XLMUSDT',30000000000],
  ['toncoin','Toncoin','ton','TONUSDT',2500000000],
  ['the-open-network','Toncoin','ton','TONUSDT',2500000000],
  ['shiba-inu','Shiba Inu','shib','SHIBUSDT',589000000000000],
  ['hedera-hashgraph','Hedera','hbar','HBARUSDT',38000000000],
  ['polkadot','Polkadot','dot','DOTUSDT',1500000000],
  ['litecoin','Litecoin','ltc','LTCUSDT',75000000],
  ['bitcoin-cash','Bitcoin Cash','bch','BCHUSDT',19800000],
  ['uniswap','Uniswap','uni','UNIUSDT',600000000],
  ['near','NEAR Protocol','near','NEARUSDT',1200000000],
  ['pepe','Pepe','pepe','PEPEUSDT',420690000000000],
  ['aptos','Aptos','apt','APTUSDT',620000000],
  ['internet-computer','Internet Computer','icp','ICPUSDT',470000000],
  ['ethereum-classic','Ethereum Classic','etc','ETCUSDT',150000000],
  ['render-token','Render','render','RENDERUSDT',520000000],
  ['render','Render','render','RENDERUSDT',520000000],
  ['arbitrum','Arbitrum','arb','ARBUSDT',4400000000],
  ['cosmos','Cosmos','atom','ATOMUSDT',390000000],
  ['vechain','VeChain','vet','VETUSDT',86000000000],
  ['filecoin','Filecoin','fil','FILUSDT',640000000],
  ['maker','Maker','mkr','MKRUSDT',930000],
  ['optimism','Optimism','op','OPUSDT',1700000000],
  ['injective-protocol','Injective','inj','INJUSDT',98000000],
  ['aave','Aave','aave','AAVEUSDT',15000000],
  ['algorand','Algorand','algo','ALGOUSDT',8300000000],
  ['the-graph','The Graph','grt','GRTUSDT',9500000000],
  ['fantom','Fantom','ftm','FTMUSDT',2800000000],
  ['immutable-x','Immutable','imx','IMXUSDT',1800000000],
  ['theta-token','Theta Network','theta','THETAUSDT',1000000000],
  ['lido-dao','Lido DAO','ldo','LDOUSDT',900000000],
  ['flow','Flow','flow','FLOWUSDT',1500000000],
  ['gala','Gala','gala','GALAUSDT',38000000000],
  ['eos','EOS','eos','EOSUSDT',1500000000],
  ['tezos','Tezos','xtz','XTZUSDT',1000000000],
  ['axie-infinity','Axie Infinity','axs','AXSUSDT',160000000],
  ['decentraland','Decentraland','mana','MANAUSDT',1900000000],
  ['the-sandbox','The Sandbox','sand','SANDUSDT',2400000000],
  ['chiliz','Chiliz','chz','CHZUSDT',9000000000],
  ['compound-governance-token','Compound','comp','COMPUSDT',9000000],
  ['pancakeswap-token','PancakeSwap','cake','CAKEUSDT',310000000],
  ['curve-dao-token','Curve DAO','crv','CRVUSDT',1300000000],
  ['dash','Dash','dash','DASHUSDT',12000000],
  ['zcash','Zcash','zec','ZECUSDT',16000000],
  ['iota','IOTA','iota','IOTAUSDT',3500000000],
  ['neo','NEO','neo','NEOUSDT',70500000],
  ['mina-protocol','Mina','mina','MINAUSDT',1200000000],
  ['kava','Kava','kava','KAVAUSDT',1000000000],
  ['blur','Blur','blur','BLURUSDT',2200000000],
  ['jupiter-exchange-solana','Jupiter','jup','JUPUSDT',1700000000],
  ['pyth-network','Pyth Network','pyth','PYTHUSDT',3600000000],
  ['bonk','Bonk','bonk','BONKUSDT',78000000000000],
  ['dogwifcoin','dogwifhat','wif','WIFUSDT',999000000],
  ['worldcoin-wld','Worldcoin','wld','WLDUSDT',1500000000],
  ['sei-network','Sei','sei','SEIUSDT',4000000000],
  ['celestia','Celestia','tia','TIAUSDT',670000000],
  ['ordinals','ORDI','ordi','ORDIUSDT',21000000],
  ['stacks','Stacks','stx','STXUSDT',1500000000],
  ['fetch-ai','Fetch.ai','fet','FETUSDT',2600000000],
  ['singularitynet','SingularityNET','agix','AGIXUSDT',1300000000],
  ['oasis-network','Oasis','rose','ROSEUSDT',7000000000]
];

const byId = new Map(catalog.map(([id, name, symbol, pair, supply]) => [id, { id, name, symbol, pair, supply }]));
const byPair = new Map(catalog.map(([id, name, symbol, pair, supply]) => [pair, { id, name, symbol, pair, supply }]));
const symbols = Object.fromEntries(catalog.map(([id, , , pair]) => [id, pair]));

function symbolFor(id) {
  return symbols[String(id || '').toLowerCase()];
}

function spark(base, change = 0) {
  const direction = change >= 0 ? 1 : -1;
  return { price: Array.from({ length: 32 }, (_, i) => base * (1 + Math.sin(i / 4) * 0.012 + direction * i * 0.00035)) };
}

function rowFromTicker(meta, tick, currency = 'usd') {
  const rawPrice = Number(tick.lastPrice);
  if (!Number.isFinite(rawPrice) || rawPrice <= 0) return null;
  const price = currency === 'brl' ? rawPrice * brlRate : rawPrice;
  const quoteVolume = Number(tick.quoteVolume || 0);
  const volume = currency === 'brl' ? quoteVolume * brlRate : quoteVolume;
  const marketCap = meta.supply ? price * meta.supply : volume * 25;
  const change24h = Number(tick.priceChangePercent || 0);
  const high = Number(tick.highPrice || rawPrice);
  const low = Number(tick.lowPrice || rawPrice);
  return {
    id: meta.id,
    name: meta.name,
    symbol: meta.symbol,
    image: '/favicon.png',
    current_price: price,
    price_change_percentage_1h_in_currency: change24h / 6,
    price_change_percentage_24h_in_currency: change24h,
    price_change_percentage_7d_in_currency: change24h * 2.4,
    market_cap: marketCap,
    total_volume: volume,
    circulating_supply: meta.supply || 0,
    high_24h: currency === 'brl' ? high * brlRate : high,
    low_24h: currency === 'brl' ? low * brlRate : low,
    sparkline_in_7d: spark(price, change24h)
  };
}

async function ticker(id) {
  const pair = symbolFor(id);
  if (!pair) return null;
  return cache.remember('binance:ticker:' + pair, 5000, async () => {
    const { data } = await api.get('/ticker/24hr', { params: { symbol: pair } });
    const meta = byId.get(String(id).toLowerCase()) || { id, symbol: pair.replace('USDT', '').toLowerCase(), pair };
    const row = rowFromTicker(meta, data, 'usd');
    if (!row) return null;
    return {
      id,
      symbol: pair,
      price: row.current_price,
      change24h: row.price_change_percentage_24h_in_currency,
      quoteVolume: row.total_volume,
      high24h: row.high_24h,
      low24h: row.low_24h
    };
  });
}

async function simplePrices(ids, currencies = 'usd,brl') {
  const list = String(ids || '').split(',').map(id => id.trim()).filter(Boolean);
  const currs = String(currencies || 'usd').split(',').map(c => c.trim().toLowerCase());
  const result = {};
  await Promise.all(list.map(async (id) => {
    const data = await ticker(id).catch(() => null);
    if (!data) return;
    result[id] = { usd_24h_change: data.change24h };
    if (currs.includes('usd')) result[id].usd = data.price;
    if (currs.includes('brl')) result[id].brl = data.price * brlRate;
  }));
  return result;
}

async function tickers() {
  return cache.remember('binance:tickers:24hr', 5000, async () => {
    const { data } = await api.get('/ticker/24hr');
    return Array.isArray(data) ? data : [];
  });
}

async function marketRanking(limit = 100) {
  const all = await tickers().catch(() => []);
  const bySymbol = new Map(all.map(item => [item.symbol, item]));
  const usd = catalog
    .map(([, , , pair]) => {
      const meta = byPair.get(pair);
      const tick = bySymbol.get(pair);
      return meta && tick ? rowFromTicker(meta, tick, 'usd') : null;
    })
    .filter(Boolean)
    .sort((a, b) => Number(b.market_cap || 0) - Number(a.market_cap || 0))
    .slice(0, limit);
  return { usd, brl: usd.map(row => ({ ...row, current_price: row.current_price * brlRate, market_cap: row.market_cap * brlRate, total_volume: row.total_volume * brlRate })) };
}

async function rankingFromRows(rows) {
  const all = await tickers().catch(() => []);
  const bySymbol = new Map(all.map(item => [item.symbol, item]));
  return rows.map(row => {
    const [id] = row;
    const pair = symbolFor(id);
    const tick = pair ? bySymbol.get(pair) : null;
    const price = Number(tick && tick.lastPrice);
    const change = Number(tick && tick.priceChangePercent);
    const quoteVolume = Number(tick && tick.quoteVolume);
    return {
      id,
      current_price: Number.isFinite(price) && price > 0 ? price : null,
      price_change_percentage_24h_in_currency: Number.isFinite(change) ? change : null,
      total_volume: Number.isFinite(quoteVolume) && quoteVolume > 0 ? quoteVolume : null,
      high_24h: Number(tick && tick.highPrice) || null,
      low_24h: Number(tick && tick.lowPrice) || null
    };
  }).filter(item => item.current_price != null);
}

function intervalFor(days) {
  const d = Number(days) || 1;
  if (d <= 1) return '1m';
  if (d <= 7) return '15m';
  if (d <= 30) return '1h';
  return '1d';
}

async function chart(id, days = 1) {
  const symbol = symbolFor(id);
  if (!symbol) return null;
  const interval = intervalFor(days);
  const limit = Math.min(1000, Math.max(120, Number(days) <= 1 ? 720 : Number(days) * 24));
  return cache.remember('binance:chart:' + symbol + ':' + interval + ':' + limit, 10000, async () => {
    const { data } = await api.get('/klines', { params: { symbol, interval, limit } });
    if (!Array.isArray(data) || data.length < 2) return null;
    return {
      prices: data.map(k => [Number(k[0]), Number(k[4])]),
      market_caps: data.map(k => [Number(k[0]), 0]),
      total_volumes: data.map(k => [Number(k[0]), Number(k[7] || k[5] || 0)]),
      source: 'binance'
    };
  });
}

module.exports = { symbolFor, ticker, simplePrices, rankingFromRows, marketRanking, chart, catalog };
