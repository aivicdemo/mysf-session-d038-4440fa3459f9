import { monitorInvoiceSLAAndAlert, InvalidSLAConfiguration } from '../../src/logic/invoice-sla-monitoring';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesWithoutDeal: jest.fn(),
}));

describe('monitorInvoiceSLAAndAlert - SCEN-191', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidSLAConfiguration error when invoice generated date is before deal closed date', async () => {
    const dealClosedDate = new Date('2026-01-15T00:00:00.000Z');
    const invoiceGeneratedDate = new Date('2026-01-14T00:00:00.000Z');
    const currentDateTime = new Date('2026-01-20T00:00:00.000Z');

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: 'DEAL-001',
      dealStage: '成約',
      dealClosedDate,
    });

    (dataPersistence.fetchInvoicesWithoutDeal as jest.Mock).mockResolvedValue([
      {
        dealId: 'DEAL-001',
        invoiceGeneratedDate,
        invoiceSentDate: null,
      },
    ]);

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-001',
        dealStage: '成約',
        dealClosedDate,
        slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
        currentDateTime,
      })
    ).rejects.toThrow(InvalidSLAConfiguration);

    await expect(
      monitorInvoiceSLAAndAlert({
        dealId: 'DEAL-001',
        dealStage: '成約',
        dealClosedDate,
        slaConfigurationByDealStage: { '成約': { daysUntilDeadline: 5 } },
        currentDateTime,
      })
    ).rejects.toThrow('請求書生成日は商談クローズ日以降である必要があります');
  });
});
