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

describe('monitorInvoiceSLAAndAlert - SCEN-185', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return within_deadline status when invoice generation deadline is not exceeded', async () => {
    const dealClosedDate = new Date('2025-01-07T10:00:00Z');
    const currentDateTime = new Date('2025-01-10T14:30:00Z');
    const slaDeadlineDateTime = new Date('2025-01-12T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250107-001',
      dealStage: '成約',
      dealClosedDate,
      billableSLADeadlineDate: slaDeadlineDateTime,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([]);

    (notificationService.notifyInvoiceSLAExceeded as jest.Mock).mockResolvedValue({
      notificationSent: false,
      notificationId: null,
    });

    const result = await monitorInvoiceSLAAndAlert({
      dealId: 'DEAL-20250107-001',
      dealStage: '成約',
      dealClosedDate,
      slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-20250107-001');
    expect(result.slaDeadlineDateTime).toEqual(slaDeadlineDateTime);
    expect(result.slaStatus).toBe('within_deadline');
    expect(result.daysRemainingUntilDeadline).toBeGreaterThan(1);
    expect(result.daysRemainingUntilDeadline).toBeLessThan(2);
    expect(result.alertIssued).toBe(false);
    expect(result.alertMessage).toBeNull();
    expect(result.notificationSent).toBe(false);
    expect(notificationService.notifyInvoiceSLAExceeded).not.toHaveBeenCalled();
  });
});
