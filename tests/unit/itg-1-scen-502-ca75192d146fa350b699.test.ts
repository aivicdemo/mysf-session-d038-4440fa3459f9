import {
  validateAndVisualizeSystemDataSyncDifferences,
  InvalidSyncValidationCriteria,
} from '../../src/logic/system-data-sync-validation';

describe('SCEN-502: 差異検出ルールの許容範囲が負数または不正な値の場合、検証エラーをスロー', () => {
  it('amountTolerancePercent が負数の場合、InvalidSyncValidationCriteria エラーをスロー', async () => {
    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'Closed Won',
        invoiceAmount: 1000000,
        invoiceStatus: 'Paid',
        invoiceCount: 1,
      },
    ];

    const newSystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 1000000,
        dealStatus: 'Closed Won',
        invoiceAmount: 1000000,
        invoiceStatus: 'Paid',
        invoiceCount: 1,
      },
    ];

    const syncValidationCriteria = {
      amountTolerancePercent: -5,
      statusMismatchThreshold: 1,
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
    ).rejects.toThrow(InvalidSyncValidationCriteria);

    await expect(
      validateAndVisualizeSystemDataSyncDifferences({
        legacySystemData,
        newSystemData,
        syncValidationCriteria,
        executionTimestamp,
      })
    ).rejects.toThrow('差異検出ルールの許容範囲が不正です。');
  });
});
