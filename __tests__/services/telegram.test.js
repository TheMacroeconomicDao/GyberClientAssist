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

describe('TelegramService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('инициализация клиента', async () => {
    const { TelegramService } = await import('../../src/services/telegram.js');
    
    const service = new TelegramService('test-session', 123, 'hash');
    
    expect(TelegramClient).toHaveBeenCalledWith(
      'test-session',
      123,
      'hash',
      expect.objectContaining({
        connectionRetries: 5,
        useWSS: true,
        systemLanguage: 'en',
        systemVersion: 'Windows 10'
      })
    );
  });

  test('запуск клиента', async () => {
    const { TelegramService } = await import('../../src/services/telegram.js');
    
    mockStart.mockResolvedValue(undefined);
    mockGetMe.mockResolvedValue({ username: 'testuser' });
    
    const service = new TelegramService('test-session', 123, 'hash');
    const me = await service.start();
    
    expect(mockStart).toHaveBeenCalled();
    expect(mockGetMe).toHaveBeenCalled();
    expect(me).toEqual({ username: 'testuser' });
  });
});