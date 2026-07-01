const { cleanText } = require('../utils/security');
const ai = require('../services/aiService');
const Chat = require('../models/ChatHistory');
exports.index = async (req, res) => res.render('pages/chat', { title: 'Chat IA cripto - CryptoScope', description: 'Tire duvidas educativas sobre criptomoedas.', history: await Chat.list(req.user?.id) });
exports.ask = async (req, res) => { const question = cleanText(req.body.question, 500); const answer = await ai.answerCryptoQuestion(question); await Chat.add(req.user?.id, question, answer); res.json({ answer }); };
