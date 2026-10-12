import { classifyInvoiceStatus, InvalidAmountError } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllValidationRules: jest.fn(),
}));

describe('SCEN-350: 商談金額がゼロの場合、契約金額は正の数値である必要があります エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw InvalidAmountError when deal amount is zero', async () => {
    const dealId = 'DEAL-001';
    const currentDateTime = new Date('2026-10-07T10:00:00.000Z');

    const mockDeal = {
      dealId: 'DEAL-001',
      dealAmount: 0,
      dealStage: '契約',
      closedDate: '2026-10-01',
      lostReason: null,
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDeal);
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue([]);
    (dataPersistence.fetchAllValidationRules as jest.Mock).mockResolvedValue({ overdueThresholdDays: 30 });

    await expect(
      classifyInvoiceStatus({
        dealId,
        currentDateTime,
      })
    ).rejects.toThrow(InvalidAmountError);

    await expect(
      classifyInvoiceStatus({
        dealId,
        currentDateTime,
      })
    ).rejects.toThrow('契約金額は正の数値である必要があります');
  });
});
