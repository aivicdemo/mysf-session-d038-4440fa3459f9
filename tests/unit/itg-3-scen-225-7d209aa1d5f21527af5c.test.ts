import { retrieveDiscrepanciesForCSVExport, InvalidDiscrepancyIdFormat } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn()
}));

describe('SCEN-225: 指定された差異IDがnullの場合、InvalidDiscrepancyIdFormatエラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);
  });

  it('nullを含む差異ID配列でInvalidDiscrepancyIdFormatエラーが発生する', async () => {
    const input = {
      discrepancyIds: [null] as any
    };

    await expect(retrieveDiscrepanciesForCSVExport(input)).rejects.toThrow(InvalidDiscrepancyIdFormat);
    await expect(retrieveDiscrepanciesForCSVExport(input)).rejects.toThrow(/null の形式が不正です/);
  });
});
