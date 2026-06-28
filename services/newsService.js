async function getNews() { return [
  { title: 'Bitcoin segue como referencia de liquidez do mercado cripto', summary: 'Acompanhe precos, volume e dominancia antes de tomar decisoes.', date: new Date().toISOString().slice(0, 10), link: 'https://www.coindesk.com' },
  { title: 'Ethereum e redes de contratos inteligentes atraem desenvolvedores', summary: 'Ecossistemas com uso real tendem a concentrar inovacao, mas tambem carregam riscos tecnicos.', date: new Date().toISOString().slice(0, 10), link: 'https://cointelegraph.com' },
  { title: 'Educacao financeira continua essencial em ciclos de alta volatilidade', summary: 'Gestao de risco, diversificacao e registro de compras ajudam o investidor a acompanhar resultados.', date: new Date().toISOString().slice(0, 10), link: 'https://www.coingecko.com/learn' }
]; }
module.exports = { getNews };