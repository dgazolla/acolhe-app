const { GoogleGenAI } = require('@google/genai');
const { createClient } = require('@supabase/supabase-js');
const { SYSTEM_PROMPT } = require('../systemPrompt');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Token não fornecido' });

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Não autorizado' });

  const { messages, conversationId } = req.body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages é obrigatório' });
  }

  const contents = messages
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
    .filter((_, i, arr) => i >= arr.findIndex(m => m.role === 'user'));

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

    if (conversationId) {
      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMsg) {
        await Promise.all([
          supabase.from('messages').insert([
            { conversation_id: conversationId, role: 'user', content: lastUserMsg.content },
            { conversation_id: conversationId, role: 'assistant', content: cleanText, is_crisis: isCrisis },
          ]),
          supabase.from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId),
        ]);
      }
    }

    res.json({ text: cleanText, isCrisis });
  } catch (err) {
    console.error('Erro Gemini:', err);
    res.status(500).json({ error: 'Não foi possível obter uma resposta agora.' });
  }
};
