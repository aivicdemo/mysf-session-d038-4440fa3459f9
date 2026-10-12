import { detectDataflowAnomalies } from '../../src/logic/dataflow-anomaly-detection';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-387: 商談IDが空または不正な形式の場合のエラー検証', () => {
  it('商談IDが空の場合、エラーがスローされる', async () => {
    const dataStore = require('../../src/platform/data-store');

    // Mock data-store to return dataflow records with empty dealId
    dataStore.listRecords.mockResolvedValue([{
      dealId: '',
      accountId: 'acc-001',
      dealAmount: 100000,
      dealStage: 'won',
      invoiceRecords: [{
        invoiceId: 'inv-001',
        dealId: '',
        amount: 100000,
        status: 'issued',
      }],
      activityRecords: [{
        activityId: 'act-001',
        dealId: '',
        type: 'call',
        completedAt: new Date('2026-01-15T10:00:00Z'),
      }],
    }]);

    const input = {
      targetPeriodStartDate: new Date('2026-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2026-01-31T23:59:59Z'),
      executedByUserId: 'user-001',
    };

    await expect(detectDataflowAnomalies(input)).rejects.toThrow('商談IDが指定されていません。有効な商談を選択してください');
  });
});
