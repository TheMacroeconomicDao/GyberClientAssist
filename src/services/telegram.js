import { TelegramClient } from 'telegram';
import { NewMessage } from 'telegram/events/index.js';
import { Api } from 'telegram/tl/api.js';
import input from 'input';
import { ModelPersonality } from '../config/personality.js';

export class TelegramService {
	constructor(session, apiId, apiHash) {
		this.client = new TelegramClient(session, 
			parseInt(apiId), 
			apiHash, 
			{
				connectionRetries: 5,
				useWSS: true
			}
		);
		
		this.personality = ModelPersonality;
	}

	async handleMessages(messageHandler) {
		try {
			const me = await this.client.getMe();
			
			this.client.addEventHandler(async (event) => {
				try {
					const message = event.message;
					if (!message || message.fromId?.userId === me.id) return;
					
					await this.addDefaultReaction(message);
					
					if (message.message) {
						console.log(`Получено сообщение: ${message.message}`);
						
						const result = await messageHandler(message);
						
						if (result?.response) {
							await this.sendMessage(message.chat.id, result.response, message.id);
							console.log('Отправлен ответ:', result.response);
							
							if (result.sentiment) {
								await this.updateReaction(message, result.sentiment);
							}
						}
					}
				} catch (error) {
					console.error('Ошибка обработки сообщения:', error);
				}
			}, new NewMessage({}));
		} catch (error) {
			console.error('Ошибка инициализации обработчика сообщений:', error);
		}
	}

	async addDefaultReaction(message) {
		try {
			const reaction = this.personality.getReaction(0);
			
			await this.client.invoke(new Api.messages.SendReaction({
				peer: message.peerId,
				msgId: message.id,
				reaction: [{
					emoticon: reaction
				}]
			}));
			
			console.log(`Добавлена начальная реакция: ${reaction}`);
		} catch (error) {
			console.error('Ошибка при добавлении реакции:', error);
		}
	}

	async updateReaction(message, sentiment) {
		try {
			let reaction;
			if (sentiment > 0.5) {
				reaction = '❤️';
			} else if (sentiment > 0) {
				reaction = '👍';
			} else if (sentiment < -0.5) {
				reaction = '😢';
			} else if (sentiment < 0) {
				reaction = '👎';
			} else {
				reaction = '🤔';
			}

			await this.client.invoke(new Api.messages.SendReaction({
				peer: message.peerId,
				msgId: message.id,
				reaction: [{
					emoticon: reaction
				}]
			}));
			
			console.log(`Обновлена реакция на: ${reaction}`);
		} catch (error) {
			console.error('Ошибка при обновлении реакции:', error);
		}
	}

	async sendMessage(chatId, text, replyTo = null) {
		try {
			await this.client.sendMessage(chatId, {
				message: text,
				replyTo: replyTo
			});
		} catch (error) {
			console.error('Ошибка при отправке сообщения:', error);
		}
	}

	async start() {
		try {
			await this.client.connect();
			
			if (!await this.client.isUserAuthorized()) {
				console.log('Требуется авторизация...');
				await this.client.start({
					phoneNumber: async () => await input.text('Введите ваш номер телефона: '),
					password: async () => await input.text('Введите ваш пароль 2FA (если включен): '),
					phoneCode: async () => await input.text('Введите полученный код: '),
					onError: (err) => console.log(err),
				});
			} else {
				console.log('Подключено с существующей сессией');
			}

			const me = await this.client.getMe();
			console.log(`Вход выполнен как: ${me.username || me.firstName}`);
			return me;
		} catch (error) {
			console.error('Ошибка при подключении:', error);
			throw error;
		}
	}

	async handleCommand(message) {
		const command = message.message.toLowerCase();
		
		switch (command) {
			case '/start':
				await this.sendReply(message, 
					'Привет! Я GyberAssist - ваш персональный помощ��ик. Вот что я умею:\n' +
					'/help - показать список команд\n' +
					'/clear - очистить историю разговора\n' +
					'/status - показать статус бота'
				);
				break;
			
			case '/help':
				await this.sendReply(message,
					'Доступные команды:\n' +
					'/start - начать разговор\n' +
					'/help - показать это сообщение\n' +
					'/clear - очистить историю разговора\n' +
					'/status - показать статус бота\n\n' +
					'Вы также можете просто писать мне сообщения, и я постараюсь помочь!'
				);
				break;

			case '/clear':
				const response = this.gptService.clearContext();
				await this.sendReply(message, response);
				break;

			case '/status':
				await this.sendReply(message,
					'Статус бота:\n' +
					`- Активен: да\n` +
					`- Текущее время: ${new Date().toLocaleString()}\n` +
					`- Версия: 1.0.0`
				);
				break;

			default:
				await this.sendReply(message, 'Неизвестная команда. ��спользуйте /help для списка команд.');
		}
	}

	async sendError(message) {
		await this.sendReply(message, 
			'Извините, произошла ошибка при обработке вашего запроса. Попробуйте позже или используйте /help для справки.'
		);
	}

	async sendReply(message, response) {
		try {
			const replyText = typeof response === 'object' ? response.response : response;
			
			await message.reply({
				message: replyText,
				replyToMsgId: message.id
			});
			console.log('Отправлен ответ:', replyText);
		} catch (error) {
			console.error('Ошибка при отправке ответа:', error);
		}
	}

	async addReaction(message, sentiment) {
		try {
			const reaction = this.personality.getReaction(sentiment);
			
			await this.client.invoke(new Api.messages.SendReaction({
				peer: message.peerId,
				msgId: message.id,
				reaction: [{
					emoticon: reaction
				}]
			}));

			console.log(`Добавлена реакция ${reaction}`);
		} catch (error) {
			console.error('Ошибка при добавлении реакции:', error);
		}
	}
}