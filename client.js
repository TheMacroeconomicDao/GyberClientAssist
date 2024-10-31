import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { NewMessage } from 'telegram/events/index.js';
import input from 'input';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function initSession() {
  const sessionDir = path.dirname(process.env.SESSION_FILE);
  await fs.mkdir(sessionDir, { recursive: true });
  
  let sessionData = '';
  try {
    sessionData = await fs.readFile(process.env.SESSION_FILE, 'utf8');
  } catch (err) {
    console.log('No existing session found, creating new one...');
  }
  
  return new StringSession(sessionData);
}

async function saveSession(session) {
  await fs.writeFile(process.env.SESSION_FILE, session.save());
}

async function getGPTResponse(message) {
  try {
    const completion = await openai.chat.completions.create({
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
    console.error('Error getting GPT response:', error);
    return null;
  }
}

async function main() {
  const session = await initSession();
  
  const client = new TelegramClient(session, 
    parseInt(process.env.TELEGRAM_API_ID), 
    process.env.TELEGRAM_API_HASH, 
    {
      connectionRetries: 5,
      useWSS: true,
      systemLanguage: 'en',
      systemVersion: 'Windows 10',
      appVersion: '1.0.0',
      deviceModel: 'Desktop'
    }
  );

  console.log('Connecting to Telegram...');
  
  await client.start({
    phoneNumber: async () => await input.text('Please enter your phone number: '),
    password: async () => await input.text('Please enter your 2FA password (if enabled): '),
    phoneCode: async () => await input.text('Please enter the code you received: '),
    onError: (err) => console.log(err),
  });

  await saveSession(session);
  console.log('Client successfully connected!');

  const me = await client.getMe();
  console.log(`Logged in as: ${me.username || me.firstName}`);

  // Handle incoming messages
  client.addEventHandler(async (event) => {
    const message = event.message;
    
    // Skip messages sent by ourselves
    if (message.fromId?.userId === me.id) return;
    
    // Skip messages older than 30 seconds
    if (Date.now() / 1000 - message.date > 30) return;

    if (message.message) {
      console.log(`Received message: ${message.message}`);
      
      const response = await getGPTResponse(message.message);
      if (response) {
        await message.reply({
          message: response,
          replyToMsgId: message.id
        });
        console.log('Sent response:', response);
      }
    }
  }, new NewMessage({}));

  // Keep the client running
  await new Promise(() => {});
}

main().catch(console.error);