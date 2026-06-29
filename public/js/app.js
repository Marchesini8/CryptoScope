const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 8 });
const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 8 });
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 });
function compactMoney(v){ return '$' + compact.format(Number(v || 0)); }
function money(v, cur = 'USD') { return (cur === 'BRL' ? brl : usd).format(Number(v || 0)); }
function axisPrice(v){ const n = Number(v || 0); if (n >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 }); if (n >= 10) return n.toFixed(3); if (n >= 1) return n.toFixed(4); return n.toFixed(6); }
function pct(v) { const n = Number(v || 0); return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'; }
function signedPct(v) { const n = Number(v || 0); return (n >= 0 ? '▲ ' : '▼ ') + Math.abs(n).toFixed(2) + '%'; }
function setSignedClass(el, value){ if(!el) return; el.classList.toggle('pos', Number(value) >= 0); el.classList.toggle('neg', Number(value) < 0); }
function coinImageUrl(c){ return c && c.id === 'bitcoin' ? '/assets/btc.gif' : (c && c.image ? c.image : ''); }
function setMove(el, value) { el.classList.toggle('pos', Number(value) >= 0); el.classList.toggle('neg', Number(value) < 0); el.textContent = pct(value); }
function drawSpark(canvas, points) {
  if (!canvas || !points || points.length < 2) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0,0,rect.width,rect.height);
  const min = Math.min(...points), max = Math.max(...points), range = max - min || 1;
  ctx.lineWidth = 1.6; ctx.strokeStyle = canvas.classList.contains('up') ? '#00c896' : '#ff4d64'; ctx.beginPath();
  points.forEach((p,i)=>{ const x = (i/(points.length-1))*rect.width; const y = rect.height - ((p-min)/range)*rect.height; i ? ctx.lineTo(x,y) : ctx.moveTo(x,y); });
  ctx.stroke();
}
function initSparklines(){ $$('.sparkline,.mini-wave').forEach(c=>{ try { drawSpark(c, JSON.parse(c.dataset.points || '[]')); } catch(_){} }); }


function initSearch(){
  const input = $('#coinSearch'), table = $('#marketTable'); if(!input || !table) return;
  const rows = $$('tbody tr[data-id]', table);
  const ids = rows.map(tr => tr.dataset.id).filter(Boolean);
  const lastPrices = new Map();
  rows.forEach(tr => {
    const parsed = Number(tr.querySelector('[data-key="price"]')?.dataset.price || '');
    if(Number.isFinite(parsed)) lastPrices.set(tr.dataset.id, parsed);
  });
  input.addEventListener('input',()=>{$$('tbody tr',table).forEach(tr=>tr.style.display=tr.dataset.search.includes(input.value.toLowerCase())?'':'none')});
  function flashPrice(el, tr, direction){
    if(!el || !direction) return;
    el.classList.remove('tick-up','tick-down'); tr.classList.remove('row-up','row-down');
    void el.offsetWidth;
    el.classList.add(direction === 'up' ? 'tick-up' : 'tick-down');
    tr.classList.add(direction === 'up' ? 'row-up' : 'row-down');
    setTimeout(()=>{ el.classList.remove('tick-up','tick-down'); tr.classList.remove('row-up','row-down'); }, 1200);
  }
  async function updateHomeMetrics(){
    try {
      const r = await fetch('/api/market-metrics?t=' + Date.now());
      if(!r.ok) throw new Error('metrics update failed');
      const data = await r.json();
      const marketCap = $('[data-metric="market-cap"]');
      const volume = $('[data-metric="volume-24h"]');
      const fear = $('[data-metric="fear-greed"]');
      const season = $('[data-metric="alt-season"]');
      if(marketCap){ marketCap.innerHTML = compactMoney(data.marketCap) + ' <em>' + signedPct(data.marketCapChange24h) + '</em>'; setSignedClass($('em', marketCap), data.marketCapChange24h); }
      if(volume){ volume.innerHTML = compactMoney(data.volume24h) + ' <em>' + signedPct(data.volumeChange24h) + '</em>'; setSignedClass($('em', volume), data.volumeChange24h); }
      if(fear && data.fearGreed){
        const value = Math.round(Number(data.fearGreed.value || 0));
        fear.style.setProperty('--value', value);
        const score = $('span', fear), label = $('small', fear);
        if(score) score.textContent = value;
        if(label) label.textContent = data.fearGreed.label || '';
      }
      if(season){
        const value = Math.round(Number(data.altSeason || 0));
        const score = $('b', season), knob = $('.season-bar i', season);
        if(score) score.innerHTML = value + '<small>/100</small>';
        if(knob) knob.style.left = value + '%';
      }
    } catch(_) {}
  }
  async function updateHomePrices(){
    try{
      $('#refreshState').textContent = 'atualizando...';
      const r = await fetch('/api/ranking?t=' + Date.now());
      if(!r.ok) throw new Error('ranking update failed');
      const ranking = await r.json();
      const prices = {};
      (ranking.usd || []).forEach(item => { prices[item.id] = item; });
      rows.forEach(tr => {
        const item = prices[tr.dataset.id]; if(!item || item.current_price == null) return;
        const priceCell = tr.querySelector('[data-key="price"]');
        const pct1h = tr.querySelector('[data-key="1h"]');
        const pct24h = tr.querySelector('[data-key="24h"]');
        const pct7d = tr.querySelector('[data-key="7d"]');
        const cap = tr.querySelector('[data-key="cap"]');
        const volume = tr.querySelector('[data-key="volume"]');
        const supply = tr.querySelector('[data-key="supply"]');
        const mobileCap = tr.querySelector('.coin-cell small');
        const previous = lastPrices.get(tr.dataset.id);
        const current = Number(item.current_price || 0);
        const direction = previous == null || current === previous ? '' : (current > previous ? 'up' : 'down');
        priceCell.dataset.price = String(current);
        priceCell.innerHTML = '<span class="usd-price">' + money(current,'USD') + '</span>'; 
        priceCell.classList.toggle('pos', direction === 'up');
        priceCell.classList.toggle('neg', direction === 'down');
        if(pct1h){ pct1h.textContent = pct(item.price_change_percentage_1h_in_currency || 0); setSignedClass(pct1h, item.price_change_percentage_1h_in_currency); }
        if(pct24h){ pct24h.textContent = pct(item.price_change_percentage_24h_in_currency || 0); setSignedClass(pct24h, item.price_change_percentage_24h_in_currency); }
        if(pct7d){ pct7d.textContent = pct(item.price_change_percentage_7d_in_currency || 0); setSignedClass(pct7d, item.price_change_percentage_7d_in_currency); }
        if(cap) cap.textContent = compactMoney(item.market_cap);
        if(volume) volume.textContent = compactMoney(item.total_volume);
        if(supply) supply.textContent = compact.format(Number(item.circulating_supply || 0)) + ' ' + String(item.symbol || '').toUpperCase();
        if(mobileCap) mobileCap.dataset.mobileCap = compactMoney(item.market_cap);
        flashPrice(priceCell, tr, direction);
        lastPrices.set(tr.dataset.id, current);
      });
      $('#refreshState').textContent = 'ao vivo ' + new Date().toLocaleTimeString();
      updateHomeMetrics();
    } catch(e) { $('#refreshState').textContent = 'falha ao atualizar'; }
  }
  updateHomePrices();
  updateHomeMetrics();
  setInterval(updateHomePrices, 10000);
  setInterval(updateHomeMetrics, 60000);
}

function resizeCanvas(canvas){ const box = canvas.parentElement.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; canvas.width = box.width * dpr; canvas.height = box.height * dpr; const ctx = canvas.getContext('2d'); ctx.setTransform(dpr,0,0,dpr,0,0); return { ctx, w: box.width, h: box.height }; }
const tfToApi = { '1t':'24h','10t':'24h','100t':'24h','1000t':'24h','1s':'24h','5s':'24h','10s':'24h','15s':'24h','30s':'24h','45s':'24h','1m':'24h','2m':'24h','3m':'24h','5m':'24h','10m':'24h','15m':'24h','30m':'7d','45m':'7d','1h':'7d','2h':'30d','3h':'30d','4h':'30d','6h':'30d','8h':'30d','12h':'90d','1d':'1y','3d':'1y','7d':'180d','30d':'1y','1y':'1y','all':'all' };
const tfMs = { '1t':60000,'10t':60000,'100t':60000,'1000t':60000,'1s':1000,'5s':5000,'10s':10000,'15s':15000,'30s':30000,'45s':45000,'1m':60000,'2m':120000,'3m':180000,'5m':300000,'10m':600000,'15m':900000,'30m':1800000,'45m':2700000,'1h':3600000,'2h':7200000,'3h':10800000,'4h':14400000,'6h':21600000,'8h':28800000,'12h':43200000,'1d':86400000,'3d':259200000,'7d':604800000,'30d':2592000000,'1y':31536000000,'all':2592000000 };
const tfSeconds = { '1t':60,'10t':60,'100t':60,'1000t':60,'1s':1,'5s':5,'10s':10,'15s':15,'30s':30,'45s':45,'1m':60,'2m':120,'3m':180,'5m':300,'10m':600,'15m':900,'30m':1800,'45m':2700,'1h':3600,'2h':7200,'3h':10800,'4h':14400,'6h':21600,'8h':28800,'12h':43200,'1d':86400,'3d':259200,'7d':604800,'30d':2592000,'1y':31536000,'all':2592000 };
const tfVisible = { '1t':110,'10t':110,'100t':110,'1000t':110,'1s':110,'5s':110,'10s':110,'15s':110,'30s':110,'45s':110,'1m':110,'2m':110,'3m':110,'5m':120,'10m':110,'15m':110,'30m':110,'45m':110,'1h':120,'2h':120,'3h':120,'4h':120,'6h':110,'8h':110,'12h':100,'1d':90,'3d':90,'7d':90,'30d':110,'1y':70,'all':140 };
const CHART_UP = '#089981';
const CHART_DOWN = '#f23645';
const chartState = { rows: [], volumes: [], drawings: [], currentTool: 'cursor', draft: null, freehand: null, indicator: false, tf: '5m', pad: { l: 48, r: 74, t: 24, b: 78 }, scale: null, zoom: 2.35, offset: 0, dragging: false, dragStartX: 0, dragStartOffset: 0, crosshair: null, candleStartedAt: Date.now(), raf: 0 };


function buildCandlesFromChart(chart, tf, officialOhlc = []){
  const prices = Array.isArray(chart.prices) ? chart.prices.filter(p => Number.isFinite(Number(p[1]))) : [];
  const volumes = Array.isArray(chart.total_volumes) ? chart.total_volumes : [];
  const bucketMs = tfMs[tf] || 300000;
  const ohlcRows = Array.isArray(chart.ohlc) && chart.ohlc.length ? chart.ohlc : officialOhlc;
  if (prices.length < 2 && !ohlcRows.length) return { rows: [], volumes: [] };
  const volumeByBucket = new Map();
  volumes.forEach(([ts, volume]) => {
    const bucket = Math.floor(ts / bucketMs) * bucketMs;
    volumeByBucket.set(bucket, (volumeByBucket.get(bucket) || 0) + Number(volume || 0));
  });
  const official = Array.isArray(ohlcRows) ? ohlcRows.filter(r => Array.isArray(r) && r.length >= 5) : [];
  if (official.length) {
    const ohlcBuckets = new Map();
    official.forEach(([ts, open, high, low, close]) => {
      const bucket = Math.floor(Number(ts) / bucketMs) * bucketMs;
      const o = Number(open), h = Number(high), l = Number(low), c = Number(close);
      if (![bucket, o, h, l, c].every(Number.isFinite)) return;
      if (!ohlcBuckets.has(bucket)) {
        ohlcBuckets.set(bucket, { t: bucket, o, h: Math.max(o, h, c), l: Math.min(o, l, c), c, volume: 0 });
        return;
      }
      const b = ohlcBuckets.get(bucket);
      b.h = Math.max(b.h, h, o, c);
      b.l = Math.min(b.l, l, o, c);
      b.c = c;
    });
    let candles = [...ohlcBuckets.values()].sort((a,b) => a.t - b.t).map(b => {
      b.volume = volumeByBucket.get(b.t) || Math.abs(b.c - b.o) || 1;
      return [b.t, b.o, b.h, b.l, b.c, b.volume];
    }).filter(c => c.every(v => Number.isFinite(Number(v))));
    const limit = tf === 'all' ? 1400 : Math.max(180, (tfVisible[tf] || 100) * 5);
    candles = candles.slice(-limit);
    return { rows: candles.map(c => c.slice(0,5)), volumes: candles.map(c => c[5] || 1) };
  }
  const buckets = new Map();
  for (let i = 1; i < prices.length; i++) {
    const [ts, closeRaw] = prices[i];
    const [, prevRaw] = prices[i - 1];
    const open = Number(prevRaw), close = Number(closeRaw);
    if (!Number.isFinite(open) || !Number.isFinite(close)) continue;
    const bucket = Math.floor(ts / bucketMs) * bucketMs;
    if (!buckets.has(bucket)) buckets.set(bucket, { t: bucket, o: open, h: Math.max(open, close), l: Math.min(open, close), c: close, volume: 0 });
    const b = buckets.get(bucket);
    b.h = Math.max(b.h, open, close);
    b.l = Math.min(b.l, open, close);
    b.c = close;
  }
  let candles = [...buckets.values()].sort((a,b) => a.t - b.t).map((b, index, arr) => {
    if (index > 0 && Math.abs(b.o - b.c) < Number.EPSILON) b.o = arr[index - 1].c;
    b.h = Math.max(b.h, b.o, b.c);
    b.l = Math.min(b.l, b.o, b.c);
    b.volume = volumeByBucket.get(b.t) || Math.abs(b.c - b.o) || 1;
    return [b.t, b.o, b.h, b.l, b.c, b.volume];
  }).filter(c => c.every(v => Number.isFinite(Number(v))));
  const limit = tf === 'all' ? 1400 : Math.max(180, (tfVisible[tf] || 100) * 5);
  candles = candles.slice(-limit);
  return { rows: candles.map(c => c.slice(0,5)), volumes: candles.map(c => c[5] || 1) };
}
function visibleRows(){ const rows = chartState.rows; const target = tfVisible[chartState.tf] || 100; const wanted = Math.max(24, Math.floor(target / chartState.zoom * 2.15)); const count = rows.length > 80 ? Math.min(rows.length - 12, wanted) : Math.min(rows.length, wanted); const maxOffset = Math.max(0, rows.length - count); chartState.offset = Math.max(0, Math.min(maxOffset, chartState.offset)); const start = Math.max(0, rows.length - count - Math.floor(chartState.offset)); return { rows: rows.slice(start, start + count), start }; }
function requestChartDraw(canvas){ cancelAnimationFrame(chartState.raf); chartState.raf = requestAnimationFrame(() => drawCandles(canvas)); }
function setChartZoom(canvas, nextZoom, centerX){
  const rows = chartState.rows;
  if(!rows.length) return;
  const before = visibleRows();
  const rect = canvas.parentElement.getBoundingClientRect();
  const plotW = Math.max(1, rect.width - chartState.pad.l - chartState.pad.r);
  const x = Number.isFinite(centerX) ? centerX : chartState.pad.l + plotW * .5;
  const ratio = Math.max(0, Math.min(1, (x - chartState.pad.l) / plotW));
  const anchor = before.start + ratio * Math.max(before.rows.length - 1, 1);
  chartState.zoom = Math.max(.75, Math.min(10, nextZoom));
  const afterCount = visibleRows().rows.length;
  const wantedStart = anchor - ratio * Math.max(afterCount - 1, 1);
  chartState.offset = rows.length - afterCount - wantedStart;
  visibleRows();
}
function panChart(canvas, deltaPixels){
  if(!chartState.rows.length) return;
  const view = visibleRows();
  const rect = canvas.parentElement.getBoundingClientRect();
  const perCandle = Math.max(1, (rect.width - chartState.pad.l - chartState.pad.r) / Math.max(view.rows.length, 1));
  chartState.offset += deltaPixels / perCandle;
  visibleRows();
}
function priceToY(value){ const s = chartState.scale; return s.pad.t + (s.max - value) / s.range * s.plotH; }
function yToPrice(y){ const s = chartState.scale; return s.max - ((y - s.pad.t) / s.plotH) * s.range; }
function normPoint(canvas, e){ const r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }; }
function denormPoint(p, w, h){ return { x: p.x * w, y: p.y * h }; }
function formatChartTime(ts, withDate = false){
  const d = new Date(ts);
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if(!withDate) return time;
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '') + ' ' + time;
}
function compactTfLabel(tf){
  const labels = { '1t':'1t','10t':'10t','100t':'100t','1000t':'1000t','1s':'1s','5s':'5s','10s':'10s','15s':'15s','30s':'30s','45s':'45s','1m':'1m','2m':'2m','3m':'3m','5m':'5m','10m':'10m','15m':'15m','30m':'30m','45m':'45m','1h':'1h','2h':'2h','3h':'3h','4h':'4h','6h':'6h','8h':'8h','12h':'12h','1d':'1D','3d':'3D','7d':'1S','30d':'1M','1y':'1A','all':'Todos' };
  return labels[tf] || tf;
}
function drawChartTimeAxis(ctx, rows, pad, w, h, step, start){
  const axisY = h - pad.b + 20;
  const maxLabels = Math.max(3, Math.floor((w - pad.l - pad.r) / 86));
  const stride = Math.max(1, Math.ceil(rows.length / maxLabels));
  ctx.save();
  ctx.font = '12px "Trebuchet MS", Segoe UI, Arial';
  ctx.fillStyle = '#d1d4dc';
  ctx.strokeStyle = '#2a2a2a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  rows.forEach((r, i) => {
    const globalIndex = start + i;
    const previous = chartState.rows[globalIndex - 1];
    const dayChanged = previous && new Date(previous[0]).toDateString() !== new Date(r[0]).toDateString();
    if(i !== 0 && i !== rows.length - 1 && !dayChanged && i % stride !== 0) return;
    const x = pad.l + i * step + step / 2;
    if(x < pad.l + 18 || x > w - pad.r - 18) return;
    ctx.beginPath();
    ctx.moveTo(x, h - pad.b + 4);
    ctx.lineTo(x, h - pad.b + 10);
    ctx.stroke();
    ctx.fillText(formatChartTime(r[0], dayChanged), x, axisY);
  });
  ctx.restore();
}
function drawChartVolumes(ctx, rows, vols, pad, h, step, maxVol){
  const volumeTop = h - pad.b + 42;
  const volumeH = Math.max(26, pad.b - 48);
  rows.forEach((r, i) => {
    const vol = Number(vols[i] || 0);
    const barH = Math.max(1, (vol / maxVol) * volumeH);
    const x = pad.l + i * step + step / 2;
    ctx.fillStyle = (r[4] >= r[1] ? CHART_UP : CHART_DOWN) + '66';
    ctx.fillRect(x - Math.max(1, step * .28), volumeTop + volumeH - barH, Math.max(2, step * .56), barH);
  });
}
function drawCrosshair(ctx,w,h){ if(!chartState.crosshair) return; const x = chartState.crosshair.x*w, y = chartState.crosshair.y*h; ctx.save(); ctx.strokeStyle = '#dfe6f3'; ctx.globalAlpha=.82; ctx.setLineDash([4,5]); ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h-chartState.pad.b+55); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha=1; ctx.strokeStyle='#fff'; ctx.lineWidth=1.8; ctx.beginPath(); ctx.arc(x,y,11,0,Math.PI*2); ctx.moveTo(x-20,y); ctx.lineTo(x-7,y); ctx.moveTo(x+7,y); ctx.lineTo(x+20,y); ctx.moveTo(x,y-20); ctx.lineTo(x,y-7); ctx.moveTo(x,y+7); ctx.lineTo(x,y+20); ctx.stroke(); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,2,0,Math.PI*2); ctx.fill(); ctx.fillStyle='#101318'; ctx.strokeStyle='#6e7788'; ctx.fillRect(w-62,y-11,58,22); ctx.strokeRect(w-62,y-11,58,22); ctx.fillStyle='#f5f7fb'; ctx.font='11px Segoe UI, Arial'; if(chartState.scale) ctx.fillText(axisPrice(yToPrice(y)),w-58,y+4); ctx.restore(); }
function drawStoredDrawings(ctx, w, h){ ctx.save(); ctx.lineWidth=1.4; ctx.strokeStyle='#d7dde8'; ctx.fillStyle='#d7dde8'; ctx.font='12px Segoe UI, Arial'; chartState.drawings.forEach(d=>{ if(d.type==='trend'||d.type==='measure'){const a=denormPoint(d.a,w,h),b=denormPoint(d.b,w,h);ctx.strokeStyle=d.type==='measure'?'#f5b942':'#d7dde8';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();} if(d.type==='horizontal'){const a=denormPoint(d.a,w,h);ctx.strokeStyle='#8fb3ff';ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(chartState.pad.l,a.y);ctx.lineTo(w-chartState.pad.r,a.y);ctx.stroke();ctx.setLineDash([]);if(chartState.scale)ctx.fillText(usd.format(yToPrice(a.y)).replace('$',''),w-chartState.pad.r+7,a.y-5);} if(d.type==='brush'){ctx.strokeStyle='#f5b942';ctx.beginPath();d.points.map(p=>denormPoint(p,w,h)).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();} if(d.type==='text'){const a=denormPoint(d.a,w,h);ctx.fillText(d.text||'Nota',a.x,a.y);} }); if(chartState.draft){const d=chartState.draft,a=denormPoint(d.a,w,h),b=denormPoint(d.b,w,h);ctx.strokeStyle='#8fb3ff';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();} if(chartState.freehand){ctx.strokeStyle='#f5b942';ctx.beginPath();chartState.freehand.map(p=>denormPoint(p,w,h)).forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();} ctx.restore(); }
function drawCandles(canvas){ const all = chartState.rows; if(!all.length) return; const view = visibleRows(); const rows = view.rows; const { ctx, w, h } = resizeCanvas(canvas); const pad = chartState.pad; const plotW = w-pad.l-pad.r; const plotH = h-pad.t-pad.b; ctx.clearRect(0,0,w,h); ctx.fillStyle='#0f0f0f'; ctx.fillRect(0,0,w,h); ctx.strokeStyle='#1f1f1f'; ctx.lineWidth=1; for(let x=pad.l;x<w-pad.r;x+=64){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h-pad.b+34);ctx.stroke();} for(let y=pad.t;y<h-pad.b+34;y+=37){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
  const highs=rows.map(r=>r[2]), lows=rows.map(r=>r[3]); let max=Math.max(...highs), min=Math.min(...lows); const buffer=(max-min||max*.01)*.1; max+=buffer; min-=buffer; const range=max-min||1; chartState.scale={max,min,range,pad,plotW,plotH}; const y=v=>pad.t+(max-v)/range*plotH; const step=plotW/Math.max(rows.length,1); const bodyW=Math.max(2,Math.min(18,step*.52)); const vols=chartState.volumes.slice(view.start, view.start+rows.length); const maxVol=Math.max(...vols,1);
  drawChartVolumes(ctx, rows, vols, pad, h, step, maxVol);
  rows.forEach((r,i)=>{const x=pad.l+i*step+step/2; const [t,open,high,low,close]=r; const up=close>=open; const color=up?CHART_UP:CHART_DOWN; ctx.strokeStyle=color; ctx.fillStyle=color; ctx.lineWidth=1.2; ctx.globalAlpha=1; let top=Math.min(y(open),y(close)); let bh=Math.abs(y(open)-y(close)); if(bh < 3){ top = ((y(open)+y(close))/2)-1.5; bh = 3; } const wickPad=4; const wickTop=Math.min(y(high), top-wickPad); const wickBottom=Math.max(y(low), top+bh+wickPad); ctx.strokeStyle=color; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(x,wickTop); ctx.lineTo(x,wickBottom); ctx.stroke(); ctx.fillRect(x-bodyW/2,top,bodyW,bh);});
  if(chartState.indicator){ctx.strokeStyle='#f5b942';ctx.lineWidth=1.3;ctx.beginPath();rows.forEach((r,i)=>{const slice=rows.slice(Math.max(0,i-8),i+1);const avg=slice.reduce((s,v)=>s+v[4],0)/slice.length;const x=pad.l+i*step+step/2, yy=y(avg);i?ctx.lineTo(x,yy):ctx.moveTo(x,yy);});ctx.stroke();}
  ctx.fillStyle='#9aa4b2';ctx.font='11px Segoe UI, Arial';for(let i=0;i<8;i++){const val=max-i*range/7, yy=y(val);ctx.fillText(axisPrice(val),w-pad.r+10,yy+4);} drawChartTimeAxis(ctx, rows, pad, w, h, step, view.start); const last=all.at(-1); if(last){const yy=y(last[4]); const up=last[4]>=last[1]; ctx.strokeStyle=up?CHART_UP:CHART_DOWN;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(0,yy);ctx.lineTo(w-pad.r,yy);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(w-pad.r+6,yy-18,62,36);ctx.fillStyle='#fff';ctx.font='700 11px Segoe UI, Arial';ctx.fillText(axisPrice(last[4]),w-pad.r+11,yy-4);ctx.font='10px Segoe UI, Arial';ctx.fillText(candleCountdown(),w-pad.r+11,yy+10); }
  drawStoredDrawings(ctx,w,h); drawCrosshair(ctx,w,h); }
function candleCountdown(){ const seconds=tfSeconds[chartState.tf]||300; const elapsed=Math.floor((Date.now()-chartState.candleStartedAt)/1000)%seconds; const remain=Math.max(0,seconds-elapsed); const hh=Math.floor(remain/3600), mm=Math.floor((remain%3600)/60), ss=remain%60; return hh>0 ? String(hh).padStart(2,'0')+':'+String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0') : String(mm).padStart(2,'0')+':'+String(ss).padStart(2,'0'); }
function updateTabTitle(price, change24h){ const symbol = ($('#coinSwitcherSearch')?.value || 'CRYPTO').trim(); const change = Number(change24h || 0); const arrow = change >= 0 ? '▲' : '▼'; const signed = (change >= 0 ? '+' : '-') + Math.abs(change).toFixed(2) + '%'; const display = Number(price || 0).toLocaleString('pt-BR', { maximumFractionDigits: Number(price) >= 1000 ? 0 : 4 }); document.title = symbol + ' ' + display + ' ' + arrow + ' ' + signed; }
function updateOhlcLabel(){const last=chartState.rows.at(-1); if(!last||!$('#ohlcText'))return; const diff=last[4]-last[1]; $('#ohlcText').textContent='Abr '+last[1].toFixed(3)+' Max '+last[2].toFixed(3)+' Min '+last[3].toFixed(3)+' Fch '+last[4].toFixed(3)+' '+(diff>=0?'+':'')+diff.toFixed(3); $('#ohlcText').className=diff>=0?'pos':'neg'; }
function updateLiveChange(change24h, price){
  const change = Number(change24h);
  if(!Number.isFinite(change)) return;
  const positive = change >= 0;
  const text = pct(change);
  const live = $('#liveChange');
  if(live){ live.textContent = text; live.classList.toggle('pos', positive); live.classList.toggle('neg', !positive); }
  const pctNode = $('#assetChange24h');
  if(pctNode){ pctNode.textContent = text; pctNode.classList.toggle('pos', positive); pctNode.classList.toggle('neg', !positive); }
  const card = $('#selectedAssetCard');
  if(card){ card.classList.toggle('pos', positive); card.classList.toggle('neg', !positive); }
  const abs = $('#assetAbsChange');
  const current = Number(price || 0);
  if(abs && Number.isFinite(current)){
    const raw = change ? current * change / (100 + change) : 0;
    abs.textContent = (raw >= 0 ? '+' : '-') + Math.round(Math.abs(raw)).toLocaleString('en-US') + '$';
    abs.classList.toggle('pos', positive);
    abs.classList.toggle('neg', !positive);
  }
}
function applyMasterPrice(price, change24h, canvas){
  const p = Number(price);
  if(!Number.isFinite(p) || p <= 0) return;
  const change = Number(change24h);
  chartState.livePrice = p;
  if(Number.isFinite(change)) chartState.liveChange24h = change;
  const last = chartState.rows.at(-1);
  let chartChanged = false;
  if(last){
    const previous = Number(last[4] || 0);
    const drift = previous ? Math.abs(p - previous) / previous : 0;
    if(!previous || drift <= 0.015){
      last[2] = Math.max(Number(last[2] || p), p);
      last[3] = Math.min(Number(last[3] || p), p);
      last[4] = p;
      chartChanged = true;
    }
  }
  const display = axisPrice(p);
  if($('#livePrice')) $('#livePrice').textContent = '$' + display;
  $$('.asset-price').forEach(el => el.textContent = display);
  const cleanChange = Number.isFinite(change) ? change : activeChartChange();
  updateLiveChange(cleanChange, p);
  updateTabTitle(p, cleanChange);
  if(chartChanged) updateOhlcLabel();
  syncCurrentWatchlistPrice(p, cleanChange);
  if(canvas && chartState.rows.length && chartChanged) drawCandles(canvas);
}
function attachDrawing(canvas){
  const activePointers = new Map();
  let pinch = null;
  const releasePointer = id => {
    try {
      if(canvas.hasPointerCapture && canvas.hasPointerCapture(id)) canvas.releasePointerCapture(id);
    } catch(_) {}
  };
  const resetInteraction = () => {
    activePointers.forEach((_, id) => releasePointer(id));
    activePointers.clear();
    pinch = null;
    chartState.dragging = false;
    chartState.draft = null;
    chartState.freehand = null;
    chartState.crosshair = null;
    if(chartState.rows.length) requestChartDraw(canvas);
  };
  const pointerDistance = () => {
    const points = [...activePointers.values()];
    if(points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  };
  const pointerCenterX = () => {
    const points = [...activePointers.values()];
    if(points.length < 2) return 0;
    const rect = canvas.getBoundingClientRect();
    return ((points[0].x + points[1].x) / 2) - rect.left;
  };
  $('#drawingToolbar')?.addEventListener('click',e=>{const btn=e.target.closest('button'); if(!btn)return; $$('#drawingToolbar button').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); chartState.currentTool=btn.dataset.tool; if(['levels','emoji','magnet','lock-draw','lock','eye'].includes(chartState.currentTool)) chartState.currentTool='cursor'; if(chartState.currentTool==='ruler') chartState.currentTool='measure'; if(chartState.currentTool==='zoomTool') chartState.currentTool='cursor'; if(chartState.currentTool==='erase'){chartState.drawings=[];chartState.currentTool='cursor';$$('#drawingToolbar button').forEach(b=>b.classList.remove('active'));$('#drawingToolbar [data-tool="cursor"]').classList.add('active');drawCandles(canvas);}});
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const centerX = e.clientX - rect.left;
    if(e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)){
      panChart(canvas, e.deltaX || e.deltaY);
    } else {
      const zoomFactor = Math.exp(-e.deltaY * 0.0018);
      setChartZoom(canvas, chartState.zoom * zoomFactor, centerX);
    }
    requestChartDraw(canvas);
  },{passive:false});
  canvas.addEventListener('pointerdown',e=>{
    if(e.pointerType === 'touch') return;
    try { canvas.setPointerCapture(e.pointerId); } catch(_) {}
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if(activePointers.size === 2){
      pinch = { distance: pointerDistance(), zoom: chartState.zoom, centerX: pointerCenterX() };
      chartState.dragging = false;
      chartState.draft = null;
      chartState.freehand = null;
      return;
    }
    const p=normPoint(canvas,e);
    if(chartState.currentTool==='cursor'){chartState.dragging=true;chartState.dragStartX=e.clientX;chartState.dragStartOffset=chartState.offset;return;}
    if(chartState.currentTool==='brush')chartState.freehand=[p];
    else if(chartState.currentTool==='text'){const text=prompt('Texto no grafico:','Nota'); if(text)chartState.drawings.push({type:'text',a:p,text});drawCandles(canvas);}
    else chartState.draft={type:chartState.currentTool,a:p,b:p};
  });
  canvas.addEventListener('pointermove',e=>{
    if(e.pointerType === 'touch') return;
    if(activePointers.has(e.pointerId)) activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if(activePointers.size >= 2 && pinch){
      const distance = pointerDistance();
      if(distance > 8) setChartZoom(canvas, pinch.zoom * (distance / Math.max(1, pinch.distance)), pointerCenterX() || pinch.centerX);
      requestChartDraw(canvas);
      return;
    }
    chartState.crosshair=normPoint(canvas,e);
    if(chartState.dragging){const dx=e.clientX-chartState.dragStartX; const view=visibleRows(); const perCandle=(canvas.parentElement.getBoundingClientRect().width-chartState.pad.l-chartState.pad.r)/Math.max(view.rows.length,1); chartState.offset=chartState.dragStartOffset+dx/perCandle; visibleRows(); requestChartDraw(canvas); return;}
    if(chartState.freehand){chartState.freehand.push(normPoint(canvas,e));requestChartDraw(canvas);}
    else if(chartState.draft){chartState.draft.b=normPoint(canvas,e);requestChartDraw(canvas);}
    else requestChartDraw(canvas);
  });
  canvas.addEventListener('pointerleave',()=>{ if(activePointers.size) return; chartState.crosshair=null;drawCandles(canvas);});
  const finishPointer = e => {
    releasePointer(e.pointerId);
    activePointers.delete(e.pointerId);
    if(activePointers.size < 2){
      pinch = null;
      if(activePointers.size === 1 && chartState.currentTool === 'cursor'){
        const remaining = [...activePointers.values()][0];
        chartState.dragging = true;
        chartState.dragStartX = remaining.x;
        chartState.dragStartOffset = chartState.offset;
        return;
      }
    }
    if(activePointers.size) return;
    chartState.dragging=false;
    if(chartState.freehand){chartState.drawings.push({type:'brush',points:chartState.freehand});chartState.freehand=null;}
    if(chartState.draft){if(chartState.draft.type==='horizontal')chartState.draft.b={x:1,y:chartState.draft.a.y};chartState.drawings.push(chartState.draft);chartState.draft=null;}
    drawCandles(canvas);
  };
  canvas.addEventListener('pointerup',finishPointer);
  canvas.addEventListener('pointercancel',finishPointer);
  canvas.addEventListener('lostpointercapture',finishPointer);
  window.addEventListener('blur',resetInteraction);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) resetInteraction(); });
  let touchGesture = null;
  const touchPoint = t => ({ x: t.clientX, y: t.clientY });
  const touchDistance = touches => {
    if(touches.length < 2) return 0;
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  };
  const touchCenterX = touches => {
    const rect = canvas.getBoundingClientRect();
    if(touches.length < 2) return touches[0] ? touches[0].clientX - rect.left : rect.width / 2;
    return ((touches[0].clientX + touches[1].clientX) / 2) - rect.left;
  };
  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    chartState.draft = null;
    chartState.freehand = null;
    if(e.touches.length >= 2){
      touchGesture = { mode: 'pinch', distance: touchDistance(e.touches), zoom: chartState.zoom, centerX: touchCenterX(e.touches) };
      chartState.dragging = false;
      return;
    }
    const p = touchPoint(e.touches[0]);
    touchGesture = { mode: 'pan', startX: p.x, startY: p.y, offset: chartState.offset };
    chartState.dragging = true;
  }, { passive: false });
  canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    if(!touchGesture) return;
    if(e.touches.length >= 2 && touchGesture.mode === 'pinch'){
      const distance = touchDistance(e.touches);
      if(distance > 8) setChartZoom(canvas, touchGesture.zoom * (distance / Math.max(1, touchGesture.distance)), touchCenterX(e.touches) || touchGesture.centerX);
      requestChartDraw(canvas);
      return;
    }
    if(e.touches.length === 1){
      if(touchGesture.mode !== 'pan'){
        const p = touchPoint(e.touches[0]);
        touchGesture = { mode: 'pan', startX: p.x, startY: p.y, offset: chartState.offset };
      }
      const p = touchPoint(e.touches[0]);
      const view = visibleRows();
      const rect = canvas.parentElement.getBoundingClientRect();
      const perCandle = Math.max(1, (rect.width - chartState.pad.l - chartState.pad.r) / Math.max(view.rows.length, 1));
      chartState.offset = touchGesture.offset + (p.x - touchGesture.startX) / perCandle;
      visibleRows();
      chartState.crosshair = normPoint(canvas, { clientX: p.x, clientY: p.y });
      requestChartDraw(canvas);
    }
  }, { passive: false });
  const finishTouch = e => {
    if(e.touches && e.touches.length === 1){
      const p = touchPoint(e.touches[0]);
      touchGesture = { mode: 'pan', startX: p.x, startY: p.y, offset: chartState.offset };
      return;
    }
    touchGesture = null;
    chartState.dragging = false;
    chartState.crosshair = null;
    if(chartState.rows.length) requestChartDraw(canvas);
  };
  canvas.addEventListener('touchend', finishTouch, { passive: false });
  canvas.addEventListener('touchcancel', finishTouch, { passive: false });
}
async function initCandles(){ const canvas=$('#candleChart'); if(!canvas)return; attachDrawing(canvas);  $('#indicatorToggle')?.addEventListener('click',()=>{chartState.indicator=!chartState.indicator;$('#indicatorToggle').classList.toggle('active',chartState.indicator);drawCandles(canvas);}); setInterval(()=>{if($('#clockNow'))$('#clockNow').textContent=new Date().toLocaleTimeString()+' UTC-3'; if(chartState.rows.length) drawCandles(canvas);},1000);
  function watchIconHtml(c){const image=coinImageUrl(c);const src=image?'<img src="'+image+'" alt="">':'';const fallback=(c.symbol||'?').slice(0,1).toUpperCase();return '<span class="watch-icon">'+(src||fallback)+'</span>'; }
function absMove(price, pctValue){const priceNum=Number(price||0), pctNum=Number(pctValue||0); return pctNum ? priceNum*pctNum/(100+pctNum) : 0;}
function signedNumber(value, digits=2){const n=Number(value||0); return (n>=0?'+':'−')+Math.abs(n).toLocaleString('en-US',{maximumFractionDigits:digits});}
function activeChartPrice(){const last=chartState.rows.at(-1); const live=Number(chartState.livePrice); if(Number.isFinite(live)&&live>0)return live; return last&&Number.isFinite(Number(last[4]))?Number(last[4]):NaN;}
function activeChartChange(){const live=Number(chartState.liveChange24h); if(Number.isFinite(live))return live; const text=$('#liveChange')?.textContent||''; const parsed=Number(text.replace('%','').replace('+','').trim()); return Number.isFinite(parsed)?parsed:NaN;}
function syncCurrentWatchlistPrice(price, change24h){const currentId=$('#candleChart')?.dataset.coin; if(!currentId)return; const tr=$('#watchlistRows tr[data-watch="'+currentId+'"]'); if(!tr)return; const p=Number(price), ch=Number(change24h); if(!Number.isFinite(p)||p<=0)return; const change=Number.isFinite(ch)?ch:activeChartChange(); const cls=change>=0?'pos':'neg'; const move=Number.isFinite(change)?absMove(p,change):0; const priceCell=tr.querySelector('[data-watch-price]'); const varCell=tr.querySelector('[data-watch-var]'); const changeCell=tr.querySelector('[data-watch-change]'); if(priceCell)priceCell.textContent=axisPrice(p); if(varCell){varCell.textContent=signedNumber(move,2); varCell.className=cls;} if(changeCell&&Number.isFinite(change)){changeCell.textContent=pct(change); changeCell.className=cls;} tr.classList.toggle('pos',cls==='pos'); tr.classList.toggle('neg',cls==='neg');}
async function updateWatchlist(){try{const body=$('#watchlistRows'); if(!body)return; const currentId=$('#candleChart')?.dataset.coin || 'bitcoin'; const featuredIds=[currentId,'ethereum','binancecoin','tether'].filter((id,i,arr)=>id&&arr.indexOf(id)===i); const r=await fetch('/api/ranking'); if(!r.ok)throw new Error('watchlist ranking failed'); const ranking=await r.json(); const allRows=Array.isArray(ranking.usd)?ranking.usd:[]; const rows=featuredIds.map(id=>allRows.find(c=>c.id===id)).filter(Boolean); if(!rows.length)return; const html=rows.map((c,index)=>{const isCurrent=c.id===currentId; const livePrice=isCurrent?activeChartPrice():NaN; const liveChange=isCurrent?activeChartChange():NaN; const rowPrice=Number.isFinite(livePrice)?livePrice:Number(c.current_price||0); const change=Number.isFinite(liveChange)?liveChange:Number(c.price_change_percentage_24h_in_currency||0); const move=absMove(rowPrice,change); const cls=change>=0?'pos':'neg'; return '<tr class="'+(index===0?'active-watch ':'')+cls+'" data-watch="'+c.id+'" data-href="/moeda/'+c.id+'"><td><span class="watch-symbol">'+watchIconHtml(c)+'<span>'+(c.symbol||'').toUpperCase()+'USD</span></span></td><td data-watch-price>'+axisPrice(rowPrice)+'</td><td data-watch-var class="'+cls+'">'+signedNumber(move,2)+'</td><td data-watch-change class="'+cls+'">'+pct(change)+'</td></tr>';}).join('')+'<tr class="watch-more-row"><td colspan="4"><a class="watch-more" href="/watchlist">Ver mais</a></td></tr>'; if(!body.dataset.loaded){body.innerHTML=html; body.dataset.loaded='1'; body.addEventListener('click',e=>{const tr=e.target.closest('tr[data-href]'); if(tr) location.href=tr.dataset.href;}); } else {body.innerHTML=html;} syncCurrentWatchlistPrice(activeChartPrice(),activeChartChange()); }catch(_){}}
  async function updateCoinPrice(){try{const r=await fetch('/api/price?ids='+canvas.dataset.coin+'&currencies=usd,brl&live=1&t='+Date.now());const data=await r.json();const item=data[canvas.dataset.coin];if(!item)return;const price=Number(item.usd),change24h=Number(item.usd_24h_change);applyMasterPrice(price,change24h,canvas);}catch(_){}}
  async function load(tf='5m'){chartState.tf=tf;chartState.candleStartedAt=Date.now();const label=compactTfLabel(tf);$('#activeTf')&&($('#activeTf').textContent=label);$('#timeframeCurrent')&&($('#timeframeCurrent').textContent=label);$('#chartLoading').style.display='block';$('#chartLoading').textContent='carregando candles...';try{const period=tfToApi[tf]||'24h';const useOfficial = false;const chartRes=await fetch('/api/chart/'+canvas.dataset.coin+'?period='+period+'&currency=usd');if(!chartRes.ok)throw new Error('chart failed');const chart=await chartRes.json();let officialOhlc=[];if(useOfficial){try{const ohlcRes=await fetch('/api/ohlc/'+canvas.dataset.coin+'?period='+period+'&currency=usd');officialOhlc=ohlcRes.ok?await ohlcRes.json():[];}catch(_){}}const built=buildCandlesFromChart(chart, tf, useOfficial ? officialOhlc : []);if(!built.rows.length)throw new Error('empty candles');chartState.rows=built.rows;chartState.volumes=built.volumes;chartState.zoom=Math.max(.75,Math.min(8,chartState.zoom||2.2));chartState.offset=0;updateOhlcLabel();drawCandles(canvas);updateCoinPrice();updateWatchlist();$('#chartLoading').style.display='none';}catch(e){$('#chartLoading').textContent='Nao foi possivel carregar candles agora. Aguarde alguns segundos.';}}
  $('#timeframeMenuToggle')?.addEventListener('click',e=>{e.stopPropagation();$('#timeframeMenu')?.classList.toggle('open');});
  $$('#timeframeMenu button[data-period]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();$$('#timeframeMenu button[data-period]').forEach(b=>b.classList.remove('active'));btn.classList.add('active');$('#timeframeMenu')?.classList.remove('open');load(btn.dataset.period);}));
  document.addEventListener('click',e=>{if(!e.target.closest('.timeframe-menu-wrap'))$('#timeframeMenu')?.classList.remove('open');});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')$('#timeframeMenu')?.classList.remove('open');});
  window.addEventListener('resize',()=>chartState.rows.length&&drawCandles(canvas)); load('5m'); setInterval(()=>load(chartState.tf),120000); setInterval(updateCoinPrice,5000); setInterval(updateWatchlist,5000); }
function initAverage(){const wrap=$('#avgRows'), add=$('#addAvg'), out=$('#avgResult'); if(!wrap)return; function row(){const d=document.createElement('div');d.className='calc-row';d.innerHTML='<input type="number" step="any" placeholder="Valor investido"><input type="number" step="any" placeholder="Preco da moeda"><input type="number" step="any" placeholder="Quantidade">';wrap.appendChild(d);d.addEventListener('input',calc)} function calc(){let invested=0,qty=0; $$('.calc-row',wrap).forEach(r=>{const v=$$('input',r).map(i=>Number(i.value||0)); invested+=v[0]; qty+=v[2]|| (v[1]?v[0]/v[1]:0)}); const avg=qty?invested/qty:0; out.textContent='Investido: R$ '+invested.toFixed(2)+' | Quantidade: '+qty.toFixed(8)+' | Preco medio: R$ '+avg.toFixed(2);} add?.addEventListener('click',row); row();}
function initProfit(){const ids=['#profitQty','#entryPrice','#targetPrice']; if(!$(ids[0]))return; function calc(){const q=Number($(ids[0]).value||0),e=Number($(ids[1]).value||0),t=Number($(ids[2]).value||0); const final=q*t, profit=q*(t-e), pctv=e?((t-e)/e)*100:0; $('#profitResult').textContent='Resultado: R$ '+profit.toFixed(2)+' ('+pctv.toFixed(2)+'%) | Valor final: R$ '+final.toFixed(2);} ids.forEach(id=>$(id).addEventListener('input',calc)); calc();}
async function initConverter(){if(!$('#convAmount'))return; async function calc(){const pair=$('#convPair').value, amount=Number($('#convAmount').value||0); const r=await fetch('/api/price?ids=bitcoin,ethereum&currencies=usd,brl'); const p=await r.json(); let val=0,label=''; if(pair==='BTC_BRL'){val=amount*p.bitcoin.brl;label='BRL'} if(pair==='BTC_USD'){val=amount*p.bitcoin.usd;label='USD'} if(pair==='ETH_BRL'){val=amount*p.ethereum.brl;label='BRL'} if(pair==='BRL_BTC'){val=amount/p.bitcoin.brl;label='BTC'} if(pair==='USD_BTC'){val=amount/p.bitcoin.usd;label='BTC'} $('#convResult').textContent=val.toLocaleString('pt-BR',{maximumFractionDigits:8})+' '+label;} $('#convAmount').addEventListener('input',calc); $('#convPair').addEventListener('change',calc); calc();}
function initChat(){const form=$('#chatForm'), box=$('#chatBox'); if(!form)return; form.addEventListener('submit',async e=>{e.preventDefault(); const q=form.question.value.trim(); if(!q)return; box.insertAdjacentHTML('beforeend','<div class="msg user"></div>'); box.lastElementChild.textContent=q; form.question.value=''; const r=await fetch('/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:q})}); const data=await r.json(); box.insertAdjacentHTML('beforeend','<div class="msg bot"></div>'); box.lastElementChild.textContent=data.answer;});}

function initResizableWatchlist(){
  const layout = $('.trading-layout');
  const sidebar = $('#tradeSidebar');
  const handle = $('#watchlistResizer');
  const canvas = $('#candleChart');
  if(!layout || !sidebar || !handle) return;
  const minWidth = 240;
  const maxWidth = 620;
  let raf = 0;
  function clamp(width){ return Math.max(minWidth, Math.min(maxWidth, Number(width) || 304)); }
  function redrawChart(){
    if(!canvas || !chartState.rows.length) return;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => drawCandles(canvas));
  }
  function applyWidth(width){
    const safeWidth = clamp(width);
    layout.style.setProperty('--watchlist-width', safeWidth + 'px'); layout.style.gridTemplateColumns = 'minmax(0, 1fr) ' + safeWidth + 'px';
    sidebar.style.width = 'auto';
    sidebar.style.minWidth = '0';
    localStorage.setItem('cryptoradarWatchlistWidth', String(Math.round(safeWidth)));
    redrawChart();
  }
  const saved = Number(localStorage.getItem('cryptoradarWatchlistWidth') || 0);
  if(saved) applyWidth(saved);
  let resizing = false;
  handle.addEventListener('pointerdown', e => {
    resizing = true;
    handle.setPointerCapture(e.pointerId);
    document.body.classList.add('resizing-watchlist');
    redrawChart();
  });
  handle.addEventListener('pointermove', e => {
    if(!resizing) return;
    const rect = layout.getBoundingClientRect();
    applyWidth(rect.right - e.clientX);
  });
  const stop = () => {
    if(!resizing) return;
    resizing = false;
    document.body.classList.remove('resizing-watchlist');
    redrawChart();
  };
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
  if(window.ResizeObserver){
    const observer = new ResizeObserver(redrawChart);
    observer.observe(layout);
    if(canvas) observer.observe(canvas.parentElement);
  }
}


function initCoinSearchSwitcher(){
  const input = $('#coinSwitcherSearch');
  const box = $('#coinSearchResults');
  const open = $('#openCoinSearch');
  if(!input || !box) return;
  let results = [];
  let timer;
  function render(items){
    results = items;
    if(!items.length){ box.innerHTML = '<div class="coin-result empty">Nenhuma moeda encontrada</div>'; box.classList.add('open'); return; }
    box.innerHTML = items.map(c => {
      const symbol = String(c.symbol || '').toUpperCase();
      return '<button class="coin-result" data-id="'+c.id+'"><img src="'+coinImageUrl(c)+'" alt=""><span><b>'+symbol+'USD</b><small>'+c.name+'</small></span><strong>'+symbol+'</strong><em>'+money(c.price,'USD')+'</em></button>';
    }).join('');
    box.classList.add('open');
  }
  async function search(q){
    try { const r = await fetch('/api/coins/search?q=' + encodeURIComponent(q || '')); render(await r.json()); }
    catch(_) { render([]); }
  }
  input.addEventListener('focus',()=>search(input.value.replace(/USD$/i,'')));
  input.addEventListener('input',()=>{ clearTimeout(timer); timer=setTimeout(()=>search(input.value.replace(/USD$/i,'')),180); });
  input.addEventListener('keydown',e=>{ if(e.key==='Enter' && results[0]) location.href='/moeda/'+results[0].id; if(e.key==='Escape') box.classList.remove('open'); });
  box.addEventListener('click',e=>{ const btn=e.target.closest('[data-id]'); if(btn) location.href='/moeda/'+btn.dataset.id; });
  open?.addEventListener('click',()=>{ input.focus(); search(''); });
  document.addEventListener('click',e=>{ if(!e.target.closest('.symbol-switcher')) box.classList.remove('open'); });
}

function initAuthModal(){
  const modal = $('#authModal');
  if(!modal) return;
  const dialog = $('.auth-dialog', modal);
  const tabs = $$('[data-auth-tab]', modal);
  const firstInput = () => $(modal.classList.contains('signup-mode') ? '.auth-signup-form input[type="email"]' : '.auth-login-form input[type="email"]', modal);
  function setMode(mode){
    const signup = mode === 'signup';
    modal.classList.toggle('signup-mode', signup);
    dialog?.classList.toggle('signup-mode', signup);
    tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.authTab === mode));
  }
  function open(mode = 'login'){
    setMode(mode);
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('auth-modal-open');
    setTimeout(() => firstInput()?.focus(), 180);
  }
  function close(){
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('auth-modal-open');
  }
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-auth-open], a[href="/auth/login"], a[href="/auth/cadastro"], .watch-more');
    if(trigger){
      e.preventDefault();
      const mode = trigger.dataset.authOpen || (trigger.getAttribute('href') === '/auth/cadastro' || trigger.classList.contains('watch-more') ? 'signup' : 'login');
      open(mode);
      return;
    }
    if(e.target.closest('[data-auth-close]')) close();
  });
  tabs.forEach(tab => tab.addEventListener('click', () => setMode(tab.dataset.authTab)));
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && modal.classList.contains('open')) close(); });
}

function initGoogleAuth(){
  const buttons = $$('[data-google-login]');
  if(!buttons.length) return;
  const root = $('[data-google-client-id]');
  const clientId = root?.dataset.googleClientId;
  const errorBox = () => $('[data-google-error]');
  let scriptPromise;
  function setError(message){
    const box = errorBox();
    if(box) box.textContent = message || '';
  }
  function loadGoogleScript(){
    if(window.google?.accounts?.id) return Promise.resolve();
    if(scriptPromise) return scriptPromise;
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Nao foi possivel carregar o login do Google.'));
      document.head.appendChild(script);
    });
    return scriptPromise;
  }
  async function sendCredential(credential){
    const response = await fetch('/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, redirect: '/carteira' })
    });
    const data = await response.json().catch(() => ({}));
    if(!response.ok || !data.ok) throw new Error(data.error || 'Nao foi possivel entrar com Google.');
    location.href = data.redirect || '/carteira';
  }
  async function startGoogleLogin(){
    try {
      setError('');
      if(!clientId) throw new Error('Client ID do Google nao configurado.');
      await loadGoogleScript();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async response => {
          try {
            if(!response.credential) throw new Error('Google nao retornou credencial.');
            await sendCredential(response.credential);
          } catch (error) {
            setError(error.message);
          }
        }
      });
      window.google.accounts.id.prompt(notification => {
        if(notification.isNotDisplayed?.() || notification.isSkippedMoment?.()) {
          setError('Confira se o dominio esta autorizado no Google Cloud e tente novamente.');
        }
      });
    } catch (error) {
      setError(error.message);
    }
  }
  buttons.forEach(button => button.addEventListener('click', startGoogleLogin));
  loadGoogleScript().then(() => {
    if(!clientId) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async response => {
        try {
          if(response.credential) await sendCredential(response.credential);
        } catch (error) {
          setError(error.message);
        }
      }
    });
  }).catch(() => {});
}

function initMarketMenus(){
  const buttons = $$('[data-market-menu]');
  if(!buttons.length) return;
  function closeAll(){
    buttons.forEach(btn => btn.classList.remove('active'));
    $$('[data-market-popover]').forEach(pop => pop.classList.remove('open'));
  }
  buttons.forEach(btn => btn.addEventListener('click', e => {
    e.stopPropagation();
    const key = btn.dataset.marketMenu;
    const pop = $('[data-market-popover="'+key+'"]');
    const willOpen = !pop?.classList.contains('open');
    closeAll();
    if(pop && willOpen){ btn.classList.add('active'); pop.classList.add('open'); }
  }));
  $$('[data-market-popover]').forEach(pop => pop.addEventListener('click', e => e.stopPropagation()));
  document.addEventListener('click', closeAll);
  document.addEventListener('keydown', e => { if(e.key === 'Escape') closeAll(); });
}

document.addEventListener('DOMContentLoaded',()=>{initSparklines();initSearch();initCoinSearchSwitcher();initResizableWatchlist();initCandles();initAverage();initProfit();initConverter();initChat();initAuthModal();initGoogleAuth();initMarketMenus();});
