# CryptoRadar

CryptoRadar e uma plataforma web em Node.js, JavaScript puro, Express, EJS e MySQL para acompanhar criptomoedas, graficos, carteira, favoritos, alertas, calculadoras, conversor, noticias e chatbot educativo.

## Recursos

- Ranking das 100 maiores criptomoedas pela CoinGecko.
- Precos em USD e BRL, variacoes 1h, 24h e 7d, market cap, volume, supply e logo.
- Pagina individual em /moeda/:id com grafico Chart.js por periodo.
- Calculadora de preco medio e calculadora de lucro.
- Cadastro/login com bcrypt e JWT em cookie HTTP-only.
- Carteira com historico de compras, preco medio e resultado estimado.
- Watchlist, favoritos e alertas de preco preparados para notificacoes futuras.
- Chat IA educativo com aviso: Isto nao e recomendacao financeira.
- Noticias mockadas prontas para API externa.
- Conversor BTC/ETH/BRL/USD com preco atual.
- Sitemap, robots.txt e URLs SEO para Bitcoin, Ethereum, Solana e calculadoras.

## Instalar

1. Instale dependencias:

```bash
npm install
```

2. Crie o banco MySQL usando:

```bash
mysql -u root -p < database/schema.sql
```

3. Copie `.env.example` para `.env` e ajuste credenciais.

4. Rode em desenvolvimento:

```bash
npm run dev
```

5. Producao/local simples:

```bash
npm start
```

## Estrutura

- `controllers`: regras de pagina e formulario.
- `models`: acesso ao MySQL com consultas parametrizadas.
- `services`: CoinGecko, cache, IA e noticias.
- `routes`: rotas Express.
- `views`: templates EJS.
- `public`: CSS e JavaScript do navegador.
- `database/schema.sql`: criacao do banco.

## Escalabilidade

A arquitetura MVC separa rotas, controladores, modelos e servicos. Para evoluir, adicione jobs de alerta, planos premium, notificacao por e-mail, app mobile e integracao com corretoras sem reescrever a interface principal.

## Aviso

O CryptoRadar e educativo. Isto nao e recomendacao financeira.

## Deploy no Railway

Este projeto esta preparado para Railway usando Nixpacks.

### Variaveis recomendadas

Configure no painel do Railway:

- `PORT` e definido automaticamente pelo Railway.
- `JWT_SECRET`: um segredo longo para login.
- `COINGECKO_BASE_URL`: `https://api.coingecko.com/api/v3`
- `COINGECKO_API_KEY`: opcional.
- `BINANCE_BASE_URL`: `https://api.binance.com/api/v3`
- `MARKET_DATA_PROVIDER`: `binance` para manter candles e precos na mesma fonte no Railway
- `USD_BRL_FALLBACK`: `5.55`
- `OPENAI_API_KEY`: opcional, apenas para chat/IA.
- `DATABASE_URL` ou variaveis `PG*`: usar quando ativar PostgreSQL.

### Comando de start

Railway usa:

```bash
npm start
```

A rota de healthcheck e:

```text
/health
```
