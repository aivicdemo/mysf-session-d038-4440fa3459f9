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

describe('monitorInvoiceSLAAndAlert - SCEN-188', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call notifyInvoiceSLAExceeded and set notificationSent to true when alert is issued', async () => {
    const dealClosedDate = new Date('2026-01-15T10:00:00Z');
    const currentDateTime = new Date('2026-01-22T10:00:00Z');
    const slaDeadlineDateTime = new Date('2026-01-20T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-001',
      dealStage: '成約',
      dealClosedDate,
      invoiceBillableStatusId: 'BILLABLE',
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([]);

    (notificationService.notifyInvoiceSLAExceeded as jest.Mock).mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-12345',
      timestamp: new Date('2026-01-22T10:00:00Z'),
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
    expect(result.slaStatus).toBe('exceeded');
    expect(result.daysRemainingUntilDeadline).toBe(-2);
    expect(result.alertIssued).toBe(true);
    expect(result.alertMessage).not.toBeNull();
    expect(result.notificationSent).toBe(true);
    expect(notificationService.notifyInvoiceSLAExceeded).toHaveBeenCalled();
  });
});
