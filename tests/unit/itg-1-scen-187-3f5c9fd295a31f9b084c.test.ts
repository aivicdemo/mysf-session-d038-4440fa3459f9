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

describe('monitorInvoiceSLAAndAlert - SCEN-187', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return approaching status and alert when SLA deadline is near (within remaining 1 day)', async () => {
    const dealClosedDate = new Date('2026-01-10T00:00:00Z');
    const currentDateTime = new Date('2026-01-14T00:00:00Z');
    const slaDeadlineDateTime = new Date('2026-01-15T00:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-001',
      dealStage: '成約',
      dealClosedDate,
      invoiceGenerationSLADeadline: slaDeadlineDateTime,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([]);

    (notificationService.notifyInvoiceSLAExceeded as jest.Mock).mockResolvedValue({
      notificationSent: true,
      recipients: ['sales-team@example.com', 'accounting@example.com'],
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
    expect(result.slaStatus).toBe('approaching');
    expect(result.daysRemainingUntilDeadline).toBe(1);
    expect(result.alertIssued).toBe(true);
    expect(result.alertMessage).not.toBeNull();
    expect(result.alertMessage).toMatch(/間近|残り|1/);
    expect(result.notificationSent).toBe(true);
    expect(notificationService.notifyInvoiceSLAExceeded).toHaveBeenCalled();
  });
});
