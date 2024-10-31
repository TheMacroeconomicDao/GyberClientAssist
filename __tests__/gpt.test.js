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

describe('GPT Response Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GPT response generation', async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: 'Test response'
        }
      }]
    };

    mockCreate.mockResolvedValue(mockResponse);

    const openai = new OpenAI({ apiKey: 'test-key' });
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: 'Test message'
      }]
    });

    expect(response).toEqual(mockResponse);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4',
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'Test message'
          })
        ])
      })
    );
  });
});