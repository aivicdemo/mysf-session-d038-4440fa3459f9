import {
  validateAndVisualizeSystemDataSyncDifferences,
  InvalidLegacySystemDataFormat,
} from '../../src/logic/system-data-sync-validation';

describe('SCEN-500: 旧システムデータの必須フィールド（dealId、金額、ステータス）が欠落している場合、形式エラーをスロー', () => {
  it('dealIdが null の場合、InvalidLegacySystemDataFormat エラーをスロー', async () => {
    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'Closed Won',
        invoiceAmount: 1000000,
        invoiceStatus: 'Invoiced',
        invoiceCount: 1,
      },
      {
        dealId: null as any,
        dealAmount: 500000,
        dealStatus: 'In Progress',
        invoiceAmount: 0,
        invoiceStatus: 'Pending',
        invoiceCount: 0,
      },
    ];

    const newSystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'Closed Won',
        invoiceAmount: 1000000,
        invoiceStatus: 'Invoiced',
        invoiceCount: 1,
      },
    ];

    const syncValidationCriteria = {
      amountTolerancePercent: 5,
      statusMismatchThreshold: 0,
      countMismatchThreshold: 1,
    };

    const executionTimestamp = new Date('2026-10-07T10:00:00Z');

    await expect(
      validateAndVisualizeSystemDataSyncDifferences({
        legacySystemData,
        newSystemData,
        syncValidationCriteria,
        executionTimestamp,
      })
    ).rejects.toThrow(InvalidLegacySystemDataFormat);

    await expect(
      validateAndVisualizeSystemDataSyncDifferences({
        legacySystemData,
        newSystemData,
        syncValidationCriteria,
        executionTimestamp,
      })
    ).rejects.toThrow('旧システムデータの形式が不正です。必須フィールド: dealId, amount, status');
  });
});
