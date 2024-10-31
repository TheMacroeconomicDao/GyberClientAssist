import dotenv from 'dotenv';
import { initSession, saveSession } from './config/session.js';
import { GPTService } from './services/gpt.js';
import { TelegramService } from './services/telegram.js';

dotenv.config();

async function main() {
  const session = await initSession();
  const gptService = new GPTService(process.env.OPENAI_API_KEY);
  const telegramService = new TelegramService(
    session,
    process.env.TELEGRAM_API_ID,
    process.env.TELEGRAM_API_HASH
  );

  console.log('Подключение к Telegram...');
  await telegramService.start();
  await saveSession(session);
  console.log('Клиент успешно подключен!');

  await telegramService.handleMessages(async (message) => {
    const response = await gptService.getResponse(message.message);
    if (response) {
      await telegramService.sendReply(message, response);
    }
  });

  // Держим клиент активным
  await new Promise(() => {});
}

main().catch(console.error);