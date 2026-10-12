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

describe('SCEN-197: Generation SLA exceeded status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return alert level "危険" when generation SLA is exceeded', async () => {
    const dealClosedDate = new Date('2025-01-01T00:00:00Z');
    const currentDateTime = new Date('2025-01-12T00:00:00Z');
    const slaDeadlineDateTime = new Date('2025-01-06T00:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250107-001',
      dealStage: '成約',
      dealClosedDate,
      slaDeadlineDateTime,
      invoiceGeneratedDate: new Date('2025-01-10T00:00:00Z'),
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([
      {
        dealId: 'DEAL-20250107-001',
        invoiceGeneratedDate: new Date('2025-01-10T00:00:00Z'),
        invoiceSentDate: new Date('2025-01-11T00:00:00Z'),
      },
    ]);

    (notificationService.notifyInvoiceSLAExceeded as jest.Mock).mockResolvedValue({
      notificationSent: true,
    });

    const result = await monitorInvoiceSLAAndAlert({
      dealId: 'DEAL-20250107-001',
      dealStage: '成約',
      dealClosedDate,
      slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-20250107-001');
    expect(result.slaStatus).toBe('exceeded');
    expect(result.daysRemainingUntilDeadline).toBe(-6);
    expect(result.alertIssued).toBe(true);
    expect(result.alertMessage).not.toBeNull();
    expect(result.notificationSent).toBe(true);
    expect((notificationService.notifyInvoiceSLAExceeded as jest.Mock)).toHaveBeenCalled();
  });
});
