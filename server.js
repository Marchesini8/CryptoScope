function ensureDependencies() {
  const required = ['dotenv', 'express', 'cookie-parser', 'helmet', 'express-rate-limit'];
  const missing = required.filter((name) => {
    try { require.resolve(name); return false; } catch (_) { return true; }
  });
  if (missing.length) {
    console.error('CryptoScope ainda nao tem as dependencias instaladas.');
    console.error('Rode primeiro: npm install');
    console.error('Depois rode novamente: node server.js');
    console.error('Pacotes faltando: ' + missing.join(', '));
    process.exit(1);
  }
}
ensureDependencies();

require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { attachUser } = require('./middlewares/authMiddleware');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');
const initPostgres = require('./database/initPostgres');
const app = express();
const PORT = process.env.PORT || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(helmet({ contentSecurityPolicy: false }));
app.use(rateLimit({ windowMs: 60 * 1000, max: 180 }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(attachUser);
app.use((req, res, next) => {
  res.locals.googleClientId = process.env.GOOGLE_CLIENT_ID || '1017587020137-jh25acjsgc7cffgf4c34uod6gl91gnf4.apps.googleusercontent.com';
  next();
});
app.get('/health', (req, res) => res.status(200).json({ ok: true, service: 'cryptoscope' }));
app.use('/', require('./routes/indexRoutes'));
app.use('/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/apiRoutes'));
app.use('/carteira', require('./routes/portfolioRoutes'));
app.use('/watchlist', require('./routes/watchlistRoutes'));
app.use('/alertas', require('./routes/alertRoutes'));
app.use('/chat', require('./routes/chatRoutes'));
app.use('/noticias', require('./routes/newsRoutes'));
app.use(notFound);
app.use(errorHandler);
const server = app.listen(PORT, async () => {
  try {
    await initPostgres();
    console.log('Postgres pronto para login Google.');
  } catch (error) {
    console.error('Nao foi possivel preparar o Postgres:', error.message);
  }
  console.log('CryptoScope rodando em http://localhost:' + PORT);
});
server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error('A porta ' + PORT + ' ja esta em uso. Feche o outro servidor ou abra em outra porta com PORT=3001 node server.js.');
    process.exit(1);
  }
  throw error;
});
