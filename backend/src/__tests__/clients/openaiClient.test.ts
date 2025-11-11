import { config } from 'dotenv';
import * as openaiClient from '../../clients/openaiClient.js';

config(); // loads OPENAI_API_KEY, OPENAI_MODEL, etc.

describe('openaiClient (live integration)', () => {
  const recipes = [
    {
      recipeId: '1',
      recipeName: 'Pasta',
      rawSteps: [
        'Boil water',
        'Cook pasta for 10 minutes',
        'Drain pasta',
      ],
    },
    {
      recipeId: '2',
      recipeName: 'Sauce',
      rawSteps: [
        'Chop onions and garlic',
        'Saute for 5 minutes',
        'Add tomatoes and simmer for 20 minutes',
      ],
    },
  ];

  beforeAll(() => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('❌ Missing OPENAI_API_KEY in .env');
    }
  });

  it('generateSchedule should return a valid schedule object', async () => {
    const result = await openaiClient.generateSchedule(recipes);

    expect(result).toHaveProperty('items');
    expect(result).toHaveProperty('totalDurationSec');
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.totalDurationSec).toBe('number');

    const first = result.items[0];
    if (first) {
      expect(first).toHaveProperty('recipeId');
      expect(first).toHaveProperty('recipeName');
      expect(first).toHaveProperty('text');
      expect(first).toHaveProperty('attention');
      expect(first).toHaveProperty('startSec');
      expect(first).toHaveProperty('endSec');
    }
  }, 60000); // give GPT time to respond (up to 60s)

  it('should throw if OPENAI_API_KEY is missing', async () => {
    const originalKey = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;

    await expect(openaiClient.generateSchedule(recipes)).rejects.toThrow(
      'OPENAI_API_KEY missing'
    );

    process.env.OPENAI_API_KEY = originalKey;
  });
});
