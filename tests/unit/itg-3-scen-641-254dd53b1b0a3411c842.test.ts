import { retrieveDiscrepancyDetailsForConfirmation, DiscrepancyNotFoundError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-641: 差異が1件もない場合、検証結果を「完全一致」と判定できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DiscrepancyNotFoundError when discrepancy record is not found', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await expect(
      retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })
    ).rejects.toThrow(DiscrepancyNotFoundError);
  });
});
