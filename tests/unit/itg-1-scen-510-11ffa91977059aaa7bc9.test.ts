import { validateAndVisualizeSystemDataSyncDifferences, InvalidSyncValidationCriteria } from '../../src/logic/system-data-sync-validation';

describe('SCEN-510: validateAndVisualizeSystemDataSyncDifferences - invalid sync criteria', () => {
  it('should throw InvalidSyncValidationCriteria when amountTolerancePercent is negative', async () => {
    const legacySystemData = [
      {
        dealId: 'DEAL001',
        dealAmount: 100000,
        dealStatus: 'closed_won',
        invoiceAmount: 100000,
        invoiceStatus: 'invoiced',
        invoiceCount: 1,
      },
    ];

    const newSystemData = [
      {
        dealId: 'DEAL001',
        dealAmount: 100000,
        dealStatus: 'closed_won',
        invoiceAmount: 100000,
        invoiceStatus: 'invoiced',
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
    ).rejects.toMatchObject({
      message: '差異検出ルールの許容範囲が不正です。',
    });
  });
});
