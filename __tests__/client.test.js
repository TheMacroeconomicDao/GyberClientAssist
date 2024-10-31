import { jest } from '@jest/globals';

const mockStart = jest.fn();
const mockGetMe = jest.fn();
const mockAddEventHandler = jest.fn();

const TelegramClient = jest.fn(() => ({
  start: mockStart,
  getMe: mockGetMe,
  addEventHandler: mockAddEventHandler
}));

jest.unstable_mockModule('telegram', () => ({
  TelegramClient
}));

const mockConfig = jest.fn();
jest.unstable_mockModule('dotenv', () => ({
  config: mockConfig,
  default: { config: mockConfig }
}));

describe('Telegram Client', () => {
  let mockEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEnv = {
      TELEGRAM_API_ID: '27100304',
      TELEGRAM_API_HASH: '4cdc9b5371f804cfa00957fb001b64ba',
      SESSION_FILE: 'session/telegram_session.txt',
      OPENAI_API_KEY: 'test-key'
    };
    process.env = { ...process.env, ...mockEnv };
  });

  test('TelegramClient initialization', () => {
    const client = new TelegramClient(
      'test-session',
      parseInt(mockEnv.TELEGRAM_API_ID),
      mockEnv.TELEGRAM_API_HASH,
      {
        connectionRetries: 5,
        useWSS: true,
        systemLanguage: 'en',
        systemVersion: 'Windows 10',
        appVersion: '1.0.0',
        deviceModel: 'Desktop'
      }
    );

    expect(TelegramClient).toHaveBeenCalledWith(
      'test-session',
      parseInt(mockEnv.TELEGRAM_API_ID),
      mockEnv.TELEGRAM_API_HASH,
      expect.objectContaining({
        connectionRetries: 5,
        useWSS: true,
        systemLanguage: 'en',
        systemVersion: 'Windows 10',
        appVersion: '1.0.0',
        deviceModel: 'Desktop'
      })
    );
  });

  test('Client methods are called', async () => {
    const client = new TelegramClient('test-session', 123, 'hash');
    
    mockStart.mockResolvedValue(undefined);
    mockGetMe.mockResolvedValue({ username: 'testuser' });
    
    await client.start();
    await client.getMe();
    
    expect(mockStart).toHaveBeenCalled();
    expect(mockGetMe).toHaveBeenCalled();
  });
});