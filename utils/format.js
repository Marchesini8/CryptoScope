function money(value, currency = 'USD') { return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', { style: 'currency', currency, maximumFractionDigits: Number(value) >= 1 ? 2 : 8 }).format(Number(value || 0)); }
function compact(value) { return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(Number(value || 0)); }
function percent(value) { const n = Number(value || 0); return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'; }
module.exports = { money, compact, percent };