import { retrieveDiscrepanciesForCSVExport, InvalidDiscrepancyIdFormat } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn()
}));

describe('SCEN-226: 指定された差異IDがUUID形式に準拠していない場合、InvalidDiscrepancyIdFormatエラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);
  });

  it('UUID形式でない差異IDでInvalidDiscrepancyIdFormatエラーが発生する', async () => {
    const input = {
      discrepancyIds: ['invalid-uuid-format', '550e8400-e29b-41d4-a716-446655440000']
    };

    await expect(retrieveDiscrepanciesForCSVExport(input)).rejects.toThrow(InvalidDiscrepancyIdFormat);
    await expect(retrieveDiscrepanciesForCSVExport(input)).rejects.toThrow(/invalid-uuid-format の形式が不正です/);
  });
});
