import { retrieveDiscrepancyDetailsForConfirmation, DiscrepancyNotFoundError } from '../../src/logic/discrepancy-persistence';
import type { RetrieveDiscrepancyDetailsForConfirmationInput } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-208: 指定された差異IDが差異検出結果テーブルに存在しない場合、DiscrepancyNotFoundErrorを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異IDが見つからない場合、DiscrepancyNotFoundErrorを発生させる', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
    };

    await expect(retrieveDiscrepancyDetailsForConfirmation(input)).rejects.toThrow(DiscrepancyNotFoundError);
    await expect(retrieveDiscrepancyDetailsForConfirmation(input)).rejects.toThrow('指定された差異IDのレコードが見つかりません。');
  });
});
