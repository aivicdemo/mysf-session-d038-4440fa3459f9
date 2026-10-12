import { validateAndVisualizeSystemDataSyncDifferences, InvalidNewSystemDataFormat } from '../../src/logic/system-data-sync-validation';

describe('SCEN-509: validateAndVisualizeSystemDataSyncDifferences - new system data empty', () => {
  it('should throw InvalidNewSystemDataFormat when newSystemData is empty array', async () => {
    const legacySystemData = [
      {
        dealId: 'DEAL-001',
        dealAmount: 100000,
        dealStatus: 'Closed Won',
        invoiceAmount: 100000,
        invoiceStatus: 'Invoiced',
        invoiceCount: 1,
      },
      {
        dealId: 'DEAL-002',
        dealAmount: 250000,
        dealStatus: 'In Progress',
        invoiceAmount: 0,
        invoiceStatus: 'Pending',
        invoiceCount: 0,
      },
    ];

    const newSystemData: Array<{
      dealId: string;
      dealAmount: number;
      dealStatus: string;
      invoiceAmount: number;
      invoiceStatus: string;
      invoiceCount: number;
    }> = [];

    const syncValidationCriteria = {
      amountTolerancePercent: 5,
      statusMismatchThreshold: 1,
      countMismatchThreshold: 1,
    };

    const executionTimestamp = new Date('2026-10-15T09:00:00Z');

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
    ).rejects.toMatchObject({
      message: '新システムのデータの形式が不正です。必須フィールド: dealId, amount, status',
    });
  });
});
