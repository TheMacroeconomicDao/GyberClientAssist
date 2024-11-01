import { OpenAI } from 'openai';
import { ModelPersonality } from '../config/personality.js';

export class GPTService {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
    this.personality = ModelPersonality;
  }

  async getResponse(message, chatId, username = '') {
    try {
      // Проверка на нецензурную лексику
      const moderationResponse = await this.openai.moderations.create({
        input: message
      });

      if (moderationResponse.results[0].flagged) {
        return {
          response: "Извините, но я не могу отвечать на сообщения с оскорблениями. Давайте общаться уважительно!",
          sentiment: -0.8
        };
      }

      // Определяем контекст разговора (можно добавить логику определения)
      const context = 'casual';
      const settings = this.personality.getSettings(context);

      // Получаем ответ
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: this.personality.getSystemPrompt(context)
          },
          {
            role: "user",
            content: message
          }
        ],
        ...settings
      });

      const response = completion.choices[0].message.content;

      // Анализируем сентимент
      const sentimentCompletion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Проанализируй эмоциональный тон сообщения и верни число от -1 до 1"
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      });

      const sentiment = parseFloat(sentimentCompletion.choices[0].message.content);

      return { response, sentiment };
    } catch (error) {
      console.error('Ошибка GPT:', error);
      return {
        response: "Извините, произошла ошибка. Попробуйте еще раз.",
        sentiment: 0
      };
    }
  }
}