import { TelegramClient } from 'telegram';
import { NewMessage } from 'telegram/events/index.js';
import input from 'input';

export class TelegramService {
  constructor(session, apiId, apiHash) {
    this.client = new TelegramClient(session, 
      parseInt(apiId), 
      apiHash, 
      {
        connectionRetries: 5,
        useWSS: true,
        systemLanguage: 'en',
        systemVersion: 'Windows 10',
        appVersion: '1.0.0',
        deviceModel: 'Desktop'
      }
    );
  }

  async start() {
    await this.client.start({
      phoneNumber: async () => await input.text('Введите ваш номер телефона: '),
      password: async () => await input.text('Введите ваш пароль 2FA (если включен): '),
      phoneCode: async () => await input.text('Введите полученный код: '),
      onError: (err) => console.log(err),
    });

    const me = await this.client.getMe();
    console.log(`Вход выполнен как: ${me.username || me.firstName}`);
    return me;
  }

  async handleMessages(messageHandler) {
    const me = await this.client.getMe();
    
    this.client.addEventHandler(async (event) => {
      const message = event.message;
      
      if (message.fromId?.userId === me.id) return;
      if (Date.now() / 1000 - message.date > 30) return;

      if (message.message) {
        console.log(`Получено сообщение: ${message.message}`);
        await messageHandler(message);
      }
    }, new NewMessage({}));
  }

  async sendReply(message, response) {
    await message.reply({
      message: response,
      replyToMsgId: message.id
    });
    console.log('Отправлен ответ:', response);
  }
}