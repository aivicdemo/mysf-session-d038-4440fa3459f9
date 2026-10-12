import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockDataStore = {
  listRecords: jest.fn<any>(),
};

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  ...mockDataStore,
}));

import * as dataPersistence from '../../src/logic/data-persistence';
import type { FetchAnomalyDetectionLogsByTypeInput } from '../../src/logic/data-persistence';
import { InvalidAnomalyType } from '../../src/logic/data-persistence';

describe('SCEN-917: fetchAnomalyDetectionLogsByType - InvalidAnomalyType error for empty string', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidAnomalyType when anomalyType is empty string', async () => {
    const input: FetchAnomalyDetectionLogsByTypeInput = {
      anomalyType: '',
    };

    await expect(
      dataPersistence.fetchAnomalyDetectionLogsByType(input)
    ).rejects.toThrow(InvalidAnomalyType);
  });

  it('error message should indicate anomalyType is required', async () => {
    const input: FetchAnomalyDetectionLogsByTypeInput = {
      anomalyType: '',
    };

    try {
      await dataPersistence.fetchAnomalyDetectionLogsByType(input);
      fail('should have thrown InvalidAnomalyType');
    } catch (error) {
      if (error instanceof InvalidAnomalyType) {
        const message = error.message;
        expect(message).toContain('異常タイプ');
        expect(message).toContain('必須');
      } else {
        throw error;
      }
    }
  });
});
