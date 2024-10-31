import { jest } from '@jest/globals';

const mockCreate = jest.fn();
const OpenAI = jest.fn(() => ({
  chat: {
    completions: {
      create: mockCreate
    }
  }
}));

jest.unstable_mockModule('openai', () => ({
  OpenAI
}));

describe('GPTService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('получение ответа от GPT', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'Тестовый ответ'
        }
      }]
    };

    mockCreate.mockResolvedValue(mockResponse);

    const { GPTService } = await import('../../src/services/gpt.js');
    const gptService = new GPTService('test-key');
    
    const response = await gptService.getResponse('Тестовое сообщение');
    
    expect(response).toBe('Тестовый ответ');
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'Тестовое сообщение'
          })
        ])
      })
    );
  });
});