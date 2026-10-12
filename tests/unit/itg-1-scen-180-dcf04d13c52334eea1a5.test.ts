import { monitorInvoiceSLAAndAlert, DealNotFound, DealNotInBillableStage, SLAConfigurationMissing, InvalidSLAConfiguration } from '../../src/logic/invoice-sla-monitoring';
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

describe('monitorInvoiceSLAAndAlert - SCEN-180', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully monitor SLA when deal is closed, billable stage, and within deadline', async () => {
    const dealClosedDate = new Date('2025-01-07T10:00:00Z');
    const currentDateTime = new Date('2025-01-10T10:00:00Z');
    const slaDeadlineDateTime = new Date('2025-01-12T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250107-001',
      dealStage: '成約',
      dealClosedDate,
      invoiceGenerationSLADeadline: slaDeadlineDateTime,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-20250110-001',
        dealId: 'DEAL-20250107-001',
        status: 'generated',
        generatedDate: new Date('2025-01-09T09:30:00Z'),
        sentDate: null,
      },
    ]);

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
    expect(result.daysRemainingUntilDeadline).toBeGreaterThan(0);
    expect(result.daysRemainingUntilDeadline).toBeLessThan(3);
    expect(result.alertIssued).toBe(false);
    expect(result.alertMessage).toBeNull();
    expect(result.notificationSent).toBe(false);
  });
});
