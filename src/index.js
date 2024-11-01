import dotenv from 'dotenv';
import { initSession, saveSession } from './config/session.js';
import { GPTService } from './services/gpt.js';
import { TelegramService } from './services/telegram.js';

dotenv.config();

async function main() {
  // Проверка наличия необходимых переменных окружения
  if (!process.env.TELEGRAM_API_ID || !process.env.TELEGRAM_API_HASH) {
    throw new Error('Необходимо указать TELEGRAM_API_ID и TELEGRAM_API_HASH в файле .env');
  }
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Необходимо указать OPENAI_API_KEY в файле .env');
  }

  const session = await initSession();
  const gptService = new GPTService(process.env.OPENAI_API_KEY);
  const telegramService = new TelegramService(
    session,
    process.env.TELEGRAM_API_ID,
    process.env.TELEGRAM_API_HASH,
    gptService
  );

  console.log('Подключение к Telegram...');
  await telegramService.start();
  await saveSession(session);
  console.log('Клиент успешно подключен!');

  await telegramService.handleMessages(async (message) => {
    const result = await gptService.getResponse(
      message.message,
      message.chat?.id || message.peerId,
      message.sender?.username || message.sender?.firstName
    );
    return result;
  });

  // Держим клиент активным
  await new Promise(() => {});
}

main().catch(console.error);

process.on('SIGINT', async () => {
  console.log('\nСохранение сессии...');
  await saveSession(session);
  console.log('Завершение работы...');
  process.exit(0);
});