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

describe('SCEN-195: Generation SLA warning status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return alert level "注意" when generation SLA is in warning status', async () => {
    const dealClosedDate = new Date('2024-01-10T00:00:00Z');
    const currentDateTime = new Date('2024-01-16T00:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-2024-00195',
      dealStage: '成約',
      dealClosedDate,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([
      {
        dealId: 'DEAL-2024-00195',
        status: 'generated',
        generatedDate: new Date('2024-01-15T00:00:00Z'),
        sentDate: null,
      },
    ]);

    (notificationService.notifyInvoiceSLAExceeded as jest.Mock).mockResolvedValue({
      notificationId: 'NOTIF-20250115-001',
      status: 'sent',
      recipientCount: 1,
    });

    const result = await monitorInvoiceSLAAndAlert({
      dealId: 'DEAL-2024-00195',
      dealStage: '成約',
      dealClosedDate,
      slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-2024-00195');
    expect(result.slaStatus).toBe('approaching');
    expect(result.alertIssued).toBe(true);
    expect(result.alertMessage).not.toBeNull();
    expect(result.notificationSent).toBe(true);
    expect((notificationService.notifyInvoiceSLAExceeded as jest.Mock)).toHaveBeenCalled();
  });
});
