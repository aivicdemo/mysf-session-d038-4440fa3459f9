import { saveCorrectionTrackingRecord, DataStoreError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';
import type { SaveCorrectionTrackingRecordInput } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store');

describe('SCEN-199: saveCorrectionTrackingRecord - DataStoreError on save failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when data store fails', async () => {
    (dataStore.createRecord as jest.Mock).mockRejectedValue(
      new DataStoreError('是正追跡管理レコードの保存に失敗しました。')
    );

    const input: SaveCorrectionTrackingRecordInput = {
      differenceId: '550e8400-e29b-41d4-a716-446655440000',
      correctionMethod: '手動修正',
      correctionExecutorUserId: '660e8400-e29b-41d4-a716-446655440001',
      correctionExecutionDateTime: '2026-10-07T10:30:00Z',
      dataBeforeCorrection: '{"accountId":"ACC001","amount":100000,"status":"active"}',
      dataAfterCorrection: null,
      verificationResult: null,
    };

    await expect(saveCorrectionTrackingRecord(input)).rejects.toThrow(DataStoreError);
  });
});
