import { recordDiscrepancyConfirmationOperation, DataStoreError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  createRecord: jest.fn(),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
  deleteRecord: jest.fn(),
}));

describe('SCEN-192: recordDiscrepancyConfirmationOperation - DataStoreError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when saving to discrepancy confirmation history table fails', async () => {
    const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;
    const errorMessage = '差異確認履歴の保存に失敗しました。システム管理者に連絡してください。';

    // Mock data-store to throw DataStoreError
    const storeError = new dataStore.DataStoreError(errorMessage);
    mockDataStore.createRecord.mockRejectedValueOnce(storeError);

    const input = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      confirmationUserId: '660e8400-e29b-41d4-a716-446655440001',
      confirmationDateTime: '2026-01-15T14:30:00Z',
      confirmationContent: '営業データの売上計上タイミングに差異あり。在庫システムとの同期遅延が原因と判断',
      judgmentResult: '許容範囲超過',
    };

    await expect(recordDiscrepancyConfirmationOperation(input)).rejects.toThrow(DataStoreError);
    await expect(recordDiscrepancyConfirmationOperation(input)).rejects.toThrow(
      '差異確認履歴の保存に失敗しました。システム管理者に連絡してください。'
    );
  });
});
