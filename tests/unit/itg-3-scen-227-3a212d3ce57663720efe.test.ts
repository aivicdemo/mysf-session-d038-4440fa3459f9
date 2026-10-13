import { retrieveDiscrepanciesForCSVExport, DiscrepancyNotFound } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn()
}));

describe('SCEN-227: 指定された差異IDのいずれかが差異検出結果テーブルに存在しない場合、DiscrepancyNotFoundエラーを発生させる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('存在しない差異IDでDiscrepancyNotFoundエラーが発生する', async () => {
    const mockDiscrepancyRecords = [
      {
        差異ID: '550e8400-e29b-41d4-a716-446655440001',
        旧システム請求書ID: 'OLD-INV-001',
        新システム請求書ID: 'NEW-INV-001',
        差異種類: '金額差異',
        差異内容: '請求金額が異なる',
        金額差異: 10000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2025-01-15T10:30:00Z',
        重大度: 'high',
        原因分類: 'calculation_error',
        許容範囲判定: 'out_of_range',
        判定日時: '2025-01-15T11:00:00Z',
        判定者: '550e8400-e29b-41d4-a716-446655440099'
      }
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockDiscrepancyRecords);

    const input = {
      discrepancyIds: [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002'
      ]
    };

    await expect(retrieveDiscrepanciesForCSVExport(input)).rejects.toThrow(DiscrepancyNotFound);
    await expect(retrieveDiscrepanciesForCSVExport(input)).rejects.toThrow(/550e8400-e29b-41d4-a716-446655440002 は見つかりません/);
  });
});
