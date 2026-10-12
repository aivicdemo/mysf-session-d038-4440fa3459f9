import { monitorInvoiceSLAAndAlert, InvalidSLAConfiguration } from '../../src/logic/invoice-sla-monitoring';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesWithoutDeal: jest.fn(),
}));

describe('monitorInvoiceSLAAndAlert - SCEN-184', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidSLAConfiguration error when SLA days until deadline is negative', async () => {
    const dealClosedDate = new Date('2026-10-07T10:00:00Z');
    const currentDateTime = new Date('2026-10-10T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-001',
      dealStage: '成約',
      dealClosedDate,
      isBillable: true,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([]);

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-001',
        dealStage: '成約',
        dealClosedDate,
        slaConfigurationByDealStage: { '成約': { daysUntilDeadline: -5 } },
        currentDateTime,
      })
    ).rejects.toThrow(InvalidSLAConfiguration);

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-001',
        dealStage: '成約',
        dealClosedDate,
        slaConfigurationByDealStage: { '成約': { daysUntilDeadline: -5 } },
        currentDateTime,
      })
    ).rejects.toThrow('SLA期限設定が不正です。期限日数: -5');
  });
});
