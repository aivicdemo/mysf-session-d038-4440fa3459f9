import { monitorInvoiceSLAAndAlert, DealNotInBillableStage } from '../../src/logic/invoice-sla-monitoring';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
}));

describe('monitorInvoiceSLAAndAlert - SCEN-182', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DealNotInBillableStage error when deal stage is not billable', async () => {
    const dealClosedDate = new Date('2024-01-15T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-001',
      dealStage: 'Lost',
      dealClosedDate,
      slaDeadlineDateTime: null,
    });

    const currentDateTime = new Date('2024-01-16T10:00:00Z');

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-001',
        dealStage: 'Lost',
        dealClosedDate,
        slaConfigurationByDealStage: { Won: { daysUntilDeadline: 5 }, Lost: { daysUntilDeadline: 0 } },
        currentDateTime,
      })
    ).rejects.toThrow(DealNotInBillableStage);

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-001',
        dealStage: 'Lost',
        dealClosedDate,
        slaConfigurationByDealStage: { Won: { daysUntilDeadline: 5 }, Lost: { daysUntilDeadline: 0 } },
        currentDateTime,
      })
    ).rejects.toThrow('この商談は請求書生成対象ではありません。ステージ: Lost');
  });
});
