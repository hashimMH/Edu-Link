const ApiError = require('../utils/ApiError');

/**
 * AI Chatbot controller — proxies messages to an AI provider.
 * Configured via env: CHATBOT_API_KEY, CHATBOT_MODEL, CHATBOT_BASE_URL
 * Defaults to OpenRouter with a free model.
 */
const chatbotController = {
  async chat(req, res, next) {
    try {
      const { message, history = [] } = req.body;
      if (!message) throw ApiError.badRequest('message is required');

      const apiKey = process.env.CHATBOT_API_KEY || process.env.OPENROUTER_API_KEY || '';
      const model = process.env.CHATBOT_MODEL || 'google/gemini-2.0-flash-001';
      const baseUrl = process.env.CHATBOT_BASE_URL || 'https://openrouter.ai/api/v1';

      if (!apiKey) {
        // No API key configured — return a helpful fallback
        return res.json({
          success: true,
          data: {
            reply: "I'm your AI study assistant! Ask me anything about your courses, homework, or study tips.)",
          },
        });
      }

      // Build conversation context
      const messages = [
        {
          role: 'system',
          content: 'You are EduBot, a helpful AI study assistant for the EduLink learning platform. You help students with their studies, answer questions about their courses, provide explanations, and offer study tips. Keep responses friendly, concise, and educational. Use markdown formatting when helpful.',
        },
        ...history.map((h) => ({
          role: h.role,
          content: h.content,
        })),
        { role: 'user', content: message },
      ];

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://edulink.app',
          'X-Title': 'EduLink AI Chatbot',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw ApiError.internal(`AI service error: ${response.status}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

      res.json({ success: true, data: { reply } });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = chatbotController;
