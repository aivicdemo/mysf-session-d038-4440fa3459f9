import { retrieveDiscrepancyDetailsForConfirmation, DiscrepancyNotFoundError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-630: 既存システムのデータが空の場合、処理を中止してエラーを出力できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異IDで検出結果が見つからない場合、DiscrepancyNotFoundError を発生させる', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const mockListRecords = jest.fn();
    (dataStore.listRecords as jest.Mock) = mockListRecords;

    mockListRecords.mockResolvedValueOnce([]);

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({
        discrepancyId,
      })
    ).rejects.toThrow(DiscrepancyNotFoundError);
  });
});
