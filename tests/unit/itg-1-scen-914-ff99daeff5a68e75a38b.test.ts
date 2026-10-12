import { describe, it, expect, jest } from '@jest/globals';

const mockDataStore = {
  listRecords: jest.fn<any>(),
};

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  ...mockDataStore,
}));

import * as dataPersistence from '../../src/logic/data-persistence';
import type { FetchAnomalyDetectionLogsByRecordInput } from '../../src/logic/data-persistence';
import { DataStoreAccessError, DataStoreError } from '../../src/logic/data-persistence';

describe('SCEN-914: fetchAnomalyDetectionLogsByRecord - DataStoreAccessError', () => {
  it('should throw DataStoreAccessError when data store access fails', async () => {
    mockDataStore.listRecords.mockRejectedValueOnce(new DataStoreError('Database connection failed'));

    const input: FetchAnomalyDetectionLogsByRecordInput = {
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    };

    await expect(
      dataPersistence.fetchAnomalyDetectionLogsByRecord(input)
    ).rejects.toThrow(DataStoreAccessError);
  });

  it('error message should indicate to retry', async () => {
    mockDataStore.listRecords.mockRejectedValueOnce(new DataStoreError('Network error'));

    const input: FetchAnomalyDetectionLogsByRecordInput = {
      targetTable: '請求書',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    };

    try {
      await dataPersistence.fetchAnomalyDetectionLogsByRecord(input);
      fail('should have thrown DataStoreAccessError');
    } catch (error) {
      if (error instanceof DataStoreAccessError) {
        const message = error.message;
        expect(message).toContain('異常検知ログテーブル');
        expect(message).toContain('アクセス');
        expect(message).toContain('失敗');
        expect(message).toContain('再度');
      } else {
        throw error;
      }
    }
  });
});
