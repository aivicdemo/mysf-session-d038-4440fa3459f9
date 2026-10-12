import { detectDataflowAnomalies } from '../../src/logic/dataflow-anomaly-detection';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-390: 商談金額が0以下の場合のエラー検証', () => {
  it('商談金額が0以下の場合、エラーがスローされる', async () => {
    const dataStore = require('../../src/platform/data-store');

    dataStore.listRecords.mockResolvedValue([{
      dealId: 'deal-001',
      dealAmount: -5000,
      dealStage: '提案中',
      accountId: 'account-001',
      invoiceRecords: [],
      activityRecords: [],
    }]);

    const input = {
      targetPeriodStartDate: new Date('2026-01-01T00:00:00Z'),
      targetPeriodEndDate: new Date('2026-01-31T23:59:59Z'),
      executedByUserId: 'user-12345',
    };

    await expect(detectDataflowAnomalies(input)).rejects.toThrow('商談金額は0より大きい値を入力してください');
  });
});
