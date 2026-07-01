require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
const { SYSTEM_PROMPT } = require('./systemPrompt');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0 }));

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages é obrigatório e não pode ser vazio.' });
  }

  // Converte o formato interno do app para o formato do Gemini
  // (role 'assistant' → 'model') e descarta mensagens 'model' no início
  // pois a API do Gemini exige que o histórico comece com 'user'.
  const contents = messages
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
    .filter((_, i, arr) => {
      // Remove mensagens 'model' do início até encontrar a primeira 'user'
      const firstUserIdx = arr.findIndex((m) => m.role === 'user');
      return i >= firstUserIdx;
    });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: 1024,
        temperature: 0.8,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = response.text ?? '';
    const isCrisis = text.startsWith('[CRISE]');
    const cleanText = isCrisis ? text.replace('[CRISE]', '').trim() : text;

    res.json({ text: cleanText, isCrisis });
  } catch (err) {
    console.error('Erro ao chamar a API do Gemini:', err);
    res.status(500).json({ error: 'Não foi possível obter uma resposta agora. Tente novamente.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor do Acolhe rodando em http://localhost:${PORT}`);
});
