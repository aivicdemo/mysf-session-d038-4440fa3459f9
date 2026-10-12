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

describe('SCEN-196: Sending SLA warning status', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return alert level "注意" when sending SLA is in warning status', async () => {
    const dealClosedDate = new Date('2025-01-10T00:00:00Z');
    const currentDateTime = new Date('2025-01-20T00:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250101-001',
      dealStage: '成約',
      dealClosedDate,
      invoiceGeneratedDate: new Date('2025-01-15T00:00:00Z'),
      invoiceSentDate: new Date('2025-01-17T10:00:00Z'),
      slaGenerationDays: 5,
      slaSendingDays: 3,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-20250115-001',
        dealId: 'DEAL-20250101-001',
        generatedDate: new Date('2025-01-15T00:00:00Z'),
        sentDate: new Date('2025-01-17T10:00:00Z'),
      },
    ]);

    (notificationService.notifyInvoiceSLAExceeded as jest.Mock).mockResolvedValue({
      success: true,
      notificationId: 'NOTIF-20250120-001',
    });

    const result = await monitorInvoiceSLAAndAlert({
      dealId: 'DEAL-20250101-001',
      dealStage: '成約',
      dealClosedDate,
      slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-20250101-001');
    expect(result.slaStatus).toBe('approaching');
    expect(result.alertIssued).toBe(true);
    expect(result.alertMessage).not.toBeNull();
    expect(result.notificationSent).toBe(true);
    expect((notificationService.notifyInvoiceSLAExceeded as jest.Mock)).toHaveBeenCalled();
  });
});
