import { monitorInvoiceSLAAndAlert } from '../../src/logic/invoice-sla-monitoring';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesWithoutDeal: jest.fn(),
}));

describe('SCEN-199: daysRemainingUntilDeadline is positive (within deadline)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return positive daysRemainingUntilDeadline when within deadline', async () => {
    const dealClosedDate = new Date('2024-01-15T10:00:00Z');
    const currentDateTime = new Date('2024-01-18T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20240115-001',
      dealStage: 'Closed Won',
      dealClosedDate,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([]);

    const result = await monitorInvoiceSLAAndAlert({
      dealId: 'DEAL-20240115-001',
      dealStage: 'Closed Won',
      dealClosedDate,
      slaConfigurationByDealStage: { 'Closed Won': { daysUntilDeadline: 5 } },
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-20240115-001');
    expect(result.slaStatus).toBe('within_deadline');
    expect(result.daysRemainingUntilDeadline).toBeGreaterThan(0);
    expect(result.alertIssued).toBe(false);
    expect(result.alertMessage).toBeNull();
    expect(result.notificationSent).toBe(false);
  });
});
