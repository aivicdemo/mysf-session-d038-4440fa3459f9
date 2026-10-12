import { monitorInvoiceSLAAndAlert } from '../../src/logic/invoice-sla-monitoring';
import * as dataPersistence from '../../src/logic/data-persistence';
import * as notificationService from '../../src/logic/notification-service';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesWithoutDeal: jest.fn(),
}));

jest.mock('../../src/logic/notification-service', () => ({
  ...jest.requireActual<typeof import('../../src/logic/notification-service')>('../../src/logic/notification-service'),
  notifyInvoiceSLAExceeded: jest.fn(),
}));

describe('SCEN-200: daysRemainingUntilDeadline is negative (exceeded)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return negative daysRemainingUntilDeadline when deadline exceeded', async () => {
    const dealClosedDate = new Date('2026-01-01T00:00:00Z');
    const currentDateTime = new Date('2026-01-08T00:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-001',
      dealStage: 'closed_won',
      dealClosedDate,
      isBillableStage: true,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([]);

    (notificationService.notifyInvoiceSLAExceeded as jest.Mock).mockResolvedValue({
      notificationId: 'NOTIF-20260108-001',
      status: 'sent',
    });

    const result = await monitorInvoiceSLAAndAlert({
      dealId: 'DEAL-001',
      dealStage: 'closed_won',
      dealClosedDate,
      slaConfigurationByDealStage: { 'closed_won': { daysUntilDeadline: 5 } },
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-001');
    expect(result.slaStatus).toBe('exceeded');
    expect(result.daysRemainingUntilDeadline).toBeLessThan(0);
    expect(result.alertIssued).toBe(true);
    expect(result.alertMessage).not.toBeNull();
    expect(result.notificationSent).toBe(true);
  });
});
