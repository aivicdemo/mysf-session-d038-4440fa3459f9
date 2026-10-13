import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as dataStore from '../../src/platform/data-store';
import { updateDiscrepancyToleranceJudgment, DiscrepancyNotFoundError } from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
}));

describe('SCEN-177: updateDiscrepancyToleranceJudgment - エラーケース', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された差異IDがテーブルに存在しない場合、DiscrepancyNotFoundErrorが発生する', async () => {
    // Arrange: 前提条件を設定
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';
    const toleranceJudgment = 'within_tolerance';
    const toleranceJudgmentDateTime = '2025-01-15T10:30:00Z';
    const judgedByUserId = 'user-12345';

    // 差異検出結果テーブルが空（レコードが存在しない）
    (dataStore.listRecords as any).mockResolvedValue([]);

    // Act & Assert: エラーが発生することを確認
    await expect(
      updateDiscrepancyToleranceJudgment({
        discrepancyId,
        toleranceJudgment,
        toleranceJudgmentDateTime,
        judgedByUserId,
      })
    ).rejects.toThrow(DiscrepancyNotFoundError);

    await expect(
      updateDiscrepancyToleranceJudgment({
        discrepancyId,
        toleranceJudgment,
        toleranceJudgmentDateTime,
        judgedByUserId,
      })
    ).rejects.toThrow('指定された差異ID 550e8400-e29b-41d4-a716-446655440000 は存在しません。');

    // データストアがリスト取得で呼ばれたことを確認
    expect(dataStore.listRecords).toHaveBeenCalledWith('差異検出結果');
  });
});
