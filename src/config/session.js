import fs from 'fs/promises';
import path from 'path';
import { StringSession } from 'telegram/sessions/index.js';

export async function initSession() {
  const sessionDir = path.dirname(process.env.SESSION_FILE);
  await fs.mkdir(sessionDir, { recursive: true });
  
  let sessionData = '';
  try {
    sessionData = await fs.readFile(process.env.SESSION_FILE, 'utf8');
  } catch (err) {
    console.log('Существующая сессия не найдена, создаём новую...');
  }
  
  return new StringSession(sessionData);
}

export async function saveSession(session) {
  await fs.writeFile(process.env.SESSION_FILE, session.save());
}