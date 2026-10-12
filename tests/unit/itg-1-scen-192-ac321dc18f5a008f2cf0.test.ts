import { monitorInvoiceSLAAndAlert } from '../../src/logic/invoice-sla-monitoring';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesWithoutDeal: jest.fn(),
}));

describe('SCEN-192: invoiceSentDate before invoiceGeneratedDate error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when invoiceSentDate is before invoiceGeneratedDate', async () => {
    const dealClosedDate = new Date('2025-01-07T10:00:00Z');
    const currentDateTime = new Date('2025-01-15T10:00:00Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-20250107-001',
      dealStage: '成約',
      dealClosedDate,
      invoiceGeneratedDate: new Date('2025-01-10T09:00:00Z'),
      invoiceSentDate: new Date('2025-01-09T14:00:00Z'),
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([
      {
        invoiceId: 'INV-20250110-001',
        dealId: 'DEAL-20250107-001',
        invoiceGeneratedDate: new Date('2025-01-10T09:00:00Z'),
        invoiceSentDate: new Date('2025-01-09T14:00:00Z'),
      },
    ]);

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-20250107-001',
        dealStage: '成約',
        dealClosedDate,
        slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
        currentDateTime,
      })
    ).rejects.toThrow('顧客送付日は請求書生成日以降である必要があります');
  });
});
