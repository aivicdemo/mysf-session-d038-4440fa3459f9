import { retrieveDiscrepancyDetailsForConfirmation, DiscrepancyNotFoundError } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-774: 旧システムのレコード件数が0件の場合、エラーメッセージが返されリスク評価が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異検出結果テーブルが空の場合、DiscrepancyNotFoundErrorを発生させる', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData: any[] = [];

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyDetectionData);
      return Promise.resolve([]);
    });

    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow(
      DiscrepancyNotFoundError,
    );

    await expect(retrieveDiscrepancyDetailsForConfirmation({ discrepancyId })).rejects.toThrow(
      '指定された差異IDのレコードが見つかりません。',
    );
  });
});
