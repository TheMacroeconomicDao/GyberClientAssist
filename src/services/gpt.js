import { OpenAI } from 'openai';

export class GPTService {
  constructor(apiKey) {
    this.openai = new OpenAI({ apiKey });
  }

  async getResponse(message) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
          role: "user",
          content: message
        }],
        temperature: 0.7,
        max_tokens: 2000
      });
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Ошибка при получении ответа от GPT:', error);
      return null;
    }
  }
}