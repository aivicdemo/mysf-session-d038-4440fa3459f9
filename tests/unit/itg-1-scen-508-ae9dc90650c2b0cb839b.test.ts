import {
  validateAndVisualizeSystemDataSyncDifferences,
  InvalidLegacySystemDataFormat,
} from '../../src/logic/system-data-sync-validation';

describe('SCEN-508: 旧システムのデータが空または取得失敗の場合、同期を中止し指定エラーをスロー', () => {
  it('旧システムデータが空の場合、InvalidLegacySystemDataFormat エラーをスロー', async () => {
    const legacySystemData: any[] = [];

    const newSystemData = [
      {
        dealId: 'DEAL001',
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
      countMismatchThreshold: 0,
    };

    const executionTimestamp = new Date('2026-10-07T12:00:00Z');

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
    ).rejects.toThrow('旧システムのデータ取得に失敗しました。同期を中止します');
  });
});
