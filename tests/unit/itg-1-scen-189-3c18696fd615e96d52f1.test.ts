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

describe('monitorInvoiceSLAAndAlert - SCEN-189', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not call notifyInvoiceSLAExceeded and set notificationSent to false when no alert is issued', async () => {
    const dealClosedDate = new Date('2024-01-10T00:00:00Z');
    const currentDateTime = new Date('2024-01-12T00:00:00Z');
    const slaDeadlineDateTime = new Date('2024-01-15T00:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-001',
      dealStage: '成約',
      dealClosedDate,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue({
      invoices: [],
    });

    (notificationService.notifyInvoiceSLAExceeded as jest.Mock).mockResolvedValue({
      success: false,
      notificationId: null,
      failureReason: '条件不一致により呼び出されない',
    });

    const result = await monitorInvoiceSLAAndAlert({
      dealId: 'DEAL-001',
      dealStage: '成約',
      dealClosedDate,
      slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-001');
    expect(result.slaDeadlineDateTime).toEqual(slaDeadlineDateTime);
    expect(result.slaStatus).toBe('within_deadline');
    expect(result.daysRemainingUntilDeadline).toBe(3);
    expect(result.alertIssued).toBe(false);
    expect(result.alertMessage).toBeNull();
    expect(result.notificationSent).toBe(false);
    expect(notificationService.notifyInvoiceSLAExceeded).not.toHaveBeenCalled();
  });
});
