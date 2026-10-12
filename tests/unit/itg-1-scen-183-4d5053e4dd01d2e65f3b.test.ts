import { monitorInvoiceSLAAndAlert, SLAConfigurationMissing } from '../../src/logic/invoice-sla-monitoring';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesWithoutDeal: jest.fn(),
}));

describe('monitorInvoiceSLAAndAlert - SCEN-183', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw SLAConfigurationMissing error when SLA configuration is missing for deal stage', async () => {
    const dealClosedDate = new Date('2025-01-15T10:00:00Z');
    const currentDateTime = new Date('2025-01-20T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250115-001',
      dealStage: 'Closed Won',
      dealClosedDate,
      isBillableStage: true,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([]);

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-20250115-001',
        dealStage: 'Closed Won',
        dealClosedDate,
        slaConfigurationByDealStage: {},
        currentDateTime,
      })
    ).rejects.toThrow(SLAConfigurationMissing);

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-20250115-001',
        dealStage: 'Closed Won',
        dealClosedDate,
        slaConfigurationByDealStage: {},
        currentDateTime,
      })
    ).rejects.toThrow('ステージ Closed Won のSLA期限設定が見つかりません。');
  });
});
