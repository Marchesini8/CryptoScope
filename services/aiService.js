const OpenAI = require('openai');
const educationalFallback = (question) => 'Isto nao e recomendacao financeira. Em cripto, o conceito depende do contexto, mas a ideia central e: pesquise fundamentos, riscos, volatilidade e nunca tome decisoes apenas por uma resposta automatica. Pergunta recebida: ' + question;
async function answerCryptoQuestion(question) {
  if (!process.env.OPENAI_API_KEY) return educationalFallback(question);
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'Voce e um assistente educativo sobre criptomoedas. Explique com clareza, avise riscos, nunca prometa lucro, nunca garanta investimento e inclua: Isto nao e recomendacao financeira.' },
      { role: 'user', content: question }
    ],
    temperature: 0.4
  });
  return completion.choices[0].message.content;
}
module.exports = { answerCryptoQuestion };