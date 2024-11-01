import fs from 'fs/promises';
import path from 'path';
import { StringSession } from 'telegram/sessions/index.js';

export async function initSession() {
  const sessionDir = path.dirname(process.env.SESSION_FILE);
  await fs.mkdir(sessionDir, { recursive: true });
  
  try {
    const sessionData = await fs.readFile(process.env.SESSION_FILE, 'utf8');
    console.log('Сессия успешно загружена');
    return new StringSession(sessionData);
  } catch (err) {
    console.log('Создаём новую сессию...');
    return new StringSession('');
  }
}

export async function saveSession(session) {
  try {
    await fs.writeFile(process.env.SESSION_FILE, session.save());
    console.log('Сессия сохранена');
  } catch (error) {
    console.error('Ошибка при сохранении сессии:', error);
  }
}