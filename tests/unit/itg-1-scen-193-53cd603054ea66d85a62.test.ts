import { monitorInvoiceSLAAndAlert } from '../../src/logic/invoice-sla-monitoring';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesWithoutDeal: jest.fn(),
}));

describe('SCEN-193: SLA configuration with daysUntilDeadline = 0', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should warn about invalid SLA configuration when daysUntilDeadline is 0', async () => {
    const dealClosedDate = new Date('2026-01-15T10:00:00Z');
    const currentDateTime = new Date('2026-01-15T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-001',
      dealStage: '成約',
      dealClosedDate,
      billableStatus: 'confirmed',
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([]);

    const result = await monitorInvoiceSLAAndAlert({
      dealId: 'DEAL-001',
      dealStage: '成約',
      dealClosedDate,
      slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 0 } },
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-001');
    expect(result.slaStatus).toBe('exceeded');
    expect(result.daysRemainingUntilDeadline).toBe(0);
    expect(result.alertIssued).toBe(true);
    expect(result.alertMessage).toBe('SLA目標日数の設定を確認してください');
    expect(result.notificationSent).toBe(true);
  });
});
