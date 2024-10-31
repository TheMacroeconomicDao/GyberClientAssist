import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
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

async function handleMessage(message) {
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{
        role: "user",
        content: message.text
      }]
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error getting GPT response:', error);
    return "Sorry, I couldn't process that request.";
  }
}

async function main() {
  const session = await initSession();
  
  const client = new TelegramClient(session, 
    parseInt(process.env.TELEGRAM_API_ID), 
    process.env.TELEGRAM_API_HASH, 
    { connectionRetries: 5 }
  );

  await client.start({
    phoneNumber: async () => await question('Please enter your phone number: '),
    password: async () => await question('Please enter your password: '),
    phoneCode: async () => await question('Please enter the code you received: '),
    onError: (err) => console.log(err),
  });

  await saveSession(session);

  console.log('Bot started successfully!');

  client.addEventHandler(async (event) => {
    if (event.message && event.message.text) {
      const response = await handleMessage(event.message);
      await client.sendMessage(event.message.chat, { message: response });
    }
  });
}

main().catch(console.error);