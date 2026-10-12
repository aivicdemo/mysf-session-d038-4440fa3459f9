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

describe('monitorInvoiceSLAAndAlert - SCEN-186', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return exceeded status and alert when invoice generation SLA deadline is exceeded', async () => {
    const dealClosedDate = new Date('2025-01-07T10:00:00Z');
    const currentDateTime = new Date('2025-01-12T10:00:00Z');
    const slaDeadlineDateTime = new Date('2025-01-10T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250107-001',
      dealStage: '成約',
      dealClosedDate,
      invoiceGenerationSLADeadline: slaDeadlineDateTime,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([]);

    (notificationService.notifyInvoiceSLAExceeded as jest.Mock).mockResolvedValue(true);

    const result = await monitorInvoiceSLAAndAlert({
      dealId: 'DEAL-20250107-001',
      dealStage: '成約',
      dealClosedDate,
      slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 3 } },
      currentDateTime,
    });

    expect(result.dealId).toBe('DEAL-20250107-001');
    expect(result.slaDeadlineDateTime).toEqual(slaDeadlineDateTime);
    expect(result.slaStatus).toBe('exceeded');
    expect(result.daysRemainingUntilDeadline).toBe(-2);
    expect(result.alertIssued).toBe(true);
    expect(result.alertMessage).not.toBeNull();
    expect(result.alertMessage).toMatch(/DEAL-20250107-001|超過|2/);
    expect(result.notificationSent).toBe(true);
    expect(notificationService.notifyInvoiceSLAExceeded).toHaveBeenCalled();
  });
});
