const news = require('../services/newsService');
exports.index = async (req, res) => res.render('pages/news', { title: 'Noticias cripto - CryptoScope', description: 'Noticias e leituras selecionadas sobre criptomoedas.', news: await news.getNews() });
