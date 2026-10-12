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
import { InvalidTableName } from '../../src/logic/data-persistence';

describe('SCEN-912: fetchAnomalyDetectionLogsByRecord - InvalidTableName error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDataStore.listRecords.mockResolvedValue([]);
  });

  it('should throw InvalidTableName when targetTable is invalid', async () => {
    const input: FetchAnomalyDetectionLogsByRecordInput = {
      targetTable: 'invalid_table_name',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    };

    await expect(
      dataPersistence.fetchAnomalyDetectionLogsByRecord(input)
    ).rejects.toThrow(InvalidTableName);
  });

  it('error message should contain invalid table name and list of valid tables', async () => {
    const input: FetchAnomalyDetectionLogsByRecordInput = {
      targetTable: 'invalid_table_name',
      targetRecordId: '550e8400-e29b-41d4-a716-446655440000',
    };

    try {
      await dataPersistence.fetchAnomalyDetectionLogsByRecord(input);
      fail('should have thrown InvalidTableName');
    } catch (error) {
      if (error instanceof InvalidTableName) {
        const message = error.message;
        expect(message).toContain('テーブル名');
        expect(message).toContain('invalid_table_name');
        expect(message).toContain('無効');
        expect(message).toContain('有効なテーブル');
        expect(message).toContain('取引先');
        expect(message).toContain('営業担当者');
        expect(message).toContain('営業活動');
        expect(message).toContain('商談');
        expect(message).toContain('請求書');
        expect(message).toContain('請求明細');
      } else {
        throw error;
      }
    }
  });
});
