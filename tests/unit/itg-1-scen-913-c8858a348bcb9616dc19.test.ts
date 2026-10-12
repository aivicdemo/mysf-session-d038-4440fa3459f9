import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockDataStore = {
  listRecords: jest.fn<any>(),
};

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  ...mockDataStore,
}));

import * as dataPersistence from '../../src/logic/data-persistence';
import type { FetchAnomalyDetectionLogsByRecordInput } from '../../src/logic/data-persistence';
import { TargetRecordNotFound } from '../../src/logic/data-persistence';

describe('SCEN-913: fetchAnomalyDetectionLogsByRecord - TargetRecordNotFound error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDataStore.listRecords.mockResolvedValue([]);
  });

  it('should throw TargetRecordNotFound when record does not exist in target table', async () => {
    const input: FetchAnomalyDetectionLogsByRecordInput = {
      targetTable: '取引先',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    };

    await expect(
      dataPersistence.fetchAnomalyDetectionLogsByRecord(input)
    ).rejects.toThrow(TargetRecordNotFound);
  });

  it('error message should contain table name and record ID', async () => {
    const input: FetchAnomalyDetectionLogsByRecordInput = {
      targetTable: '取引先',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    };

    try {
      await dataPersistence.fetchAnomalyDetectionLogsByRecord(input);
      fail('should have thrown TargetRecordNotFound');
    } catch (error) {
      if (error instanceof TargetRecordNotFound) {
        const message = error.message;
        expect(message).toContain('指定されたレコード');
        expect(message).toContain('取引先');
        expect(message).toContain('550e8400-e29b-41d4-a716-446655440000');
        expect(message).toContain('存在しません');
      } else {
        throw error;
      }
    }
  });
});
