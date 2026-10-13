import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as dataStore from '../../src/platform/data-store';
import {
  updateDiscrepancyToleranceJudgment,
  type UpdateDiscrepancyToleranceJudgmentOutput,
  type UpdateDiscrepancyToleranceJudgmentInput,
} from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
}));

describe('SCEN-176: updateDiscrepancyToleranceJudgment - 正常系', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された差異IDに対応するレコードが差異検出結果テーブルに存在し、許容範囲判定結果・判定日時・判定者を更新してレコードを返す', async () => {
    // Arrange: 前提条件を設定
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';
    const toleranceJudgment = 'within_tolerance';
    const toleranceJudgmentDateTime = '2026-10-07T10:30:00Z';
    const judgedByUserId = 'user-judge-001';

    const existingRecord = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'LEGACY-INV-2026-001',
      newSystemInvoiceId: 'NEW-INV-2026-001',
      discrepancyType: 'amount_difference',
      discrepancyContent: '請求金額に100円の差異を検出',
      amountDifference: 100,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2026-10-07T08:00:00Z',
      severity: 'low',
      causeClassification: null,
      toleranceJudgment: null,
      toleranceJudgmentDateTime: null,
      judgedByUserId: null,
    };

    const updatedRecord: UpdateDiscrepancyToleranceJudgmentOutput = {
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'LEGACY-INV-2026-001',
      newSystemInvoiceId: 'NEW-INV-2026-001',
      discrepancyType: 'amount_difference',
      discrepancyContent: '請求金額に100円の差異を検出',
      amountDifference: 100,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2026-10-07T08:00:00Z',
      severity: 'low',
      causeClassification: null,
      toleranceJudgment: 'within_tolerance',
      toleranceJudgmentDateTime: '2026-10-07T10:30:00Z',
      judgedByUserId: 'user-judge-001',
    };

    (dataStore.listRecords as any).mockResolvedValue([existingRecord]);
    (dataStore.updateRecord as any).mockResolvedValue(updatedRecord);

    // Act: 対象の処理を呼び出す
    const result = await updateDiscrepancyToleranceJudgment({
      discrepancyId,
      toleranceJudgment,
      toleranceJudgmentDateTime,
      judgedByUserId,
    });

    // Assert: 期待結果を検証
    expect(result).toEqual({
      discrepancyId: '550e8400-e29b-41d4-a716-446655440000',
      legacySystemInvoiceId: 'LEGACY-INV-2026-001',
      newSystemInvoiceId: 'NEW-INV-2026-001',
      discrepancyType: 'amount_difference',
      discrepancyContent: '請求金額に100円の差異を検出',
      amountDifference: 100,
      countDifference: null,
      statusDifference: null,
      detectionDateTime: '2026-10-07T08:00:00Z',
      severity: 'low',
      causeClassification: null,
      toleranceJudgment: 'within_tolerance',
      toleranceJudgmentDateTime: '2026-10-07T10:30:00Z',
      judgedByUserId: 'user-judge-001',
    });

    // データストアが正しく呼ばれたことを確認
    expect(dataStore.listRecords).toHaveBeenCalledWith('差異検出結果');
    expect(dataStore.updateRecord).toHaveBeenCalledWith(
      '差異検出結果',
      discrepancyId,
      {
        toleranceJudgment: 'within_tolerance',
        toleranceJudgmentDateTime: '2026-10-07T10:30:00Z',
        judgedByUserId: 'user-judge-001',
      }
    );
  });
});
