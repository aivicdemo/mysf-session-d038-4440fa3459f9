import {
  validateAndVisualizeSystemDataSyncDifferences,
  InvalidNewSystemDataFormat,
} from '../../src/logic/system-data-sync-validation';

describe('SCEN-501: 新システムデータの必須フィールド（dealId、金額、ステータス）が欠落している場合、形式エラーをスロー', () => {
  it('dealAmount が null の場合、InvalidNewSystemDataFormat エラーをスロー', async () => {
    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'closed_won',
        invoiceAmount: 1000000,
        invoiceStatus: 'invoiced',
        invoiceCount: 1,
      },
    ];

    const newSystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: null as any,
        dealStatus: 'closed_won',
        invoiceAmount: 1000000,
        invoiceStatus: 'invoiced',
        invoiceCount: 1,
      },
    ];

    const syncValidationCriteria = {
      amountTolerancePercent: 5,
      statusMismatchThreshold: 0,
      countMismatchThreshold: 0,
    };

    const executionTimestamp = new Date('2026-10-07T10:00:00Z');

    await expect(
      validateAndVisualizeSystemDataSyncDifferences({
        legacySystemData,
        newSystemData,
        syncValidationCriteria,
        executionTimestamp,
      })
    ).rejects.toThrow(InvalidNewSystemDataFormat);

    await expect(
      validateAndVisualizeSystemDataSyncDifferences({
        legacySystemData,
        newSystemData,
        syncValidationCriteria,
        executionTimestamp,
      })
    ).rejects.toThrow('新システムデータの形式が不正です。必須フィールド: dealId, amount, status');
  });
});
