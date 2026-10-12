import { classifyInvoiceStatus, InvalidDealStatus } from '../../src/logic/invoice-status-classification';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-332: 商談ステージが失注ステージの場合、InvalidDealStatus エラーが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談ステージが失注ステージの場合、InvalidDealStatus エラーが発生する', async () => {
    const dealId = 'DEAL-2024-001';
    const currentDateTime = new Date('2024-12-15T10:00:00Z');

    const mockDeal = {
      dealId: 'DEAL-2024-001',
      customerId: 'CUST-001',
      salesRepresentativeId: 'REP-001',
      dealName: 'Test Deal',
      dealAmount: 1000000,
      stageId: 'stage-lost',
      expectedContractDate: '2024-11-30',
      contractedDate: null,
      description: null,
      lossReason: '顧客都合によるキャンセル',
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-11-30T00:00:00Z',
      updatedAt: '2024-12-15T00:00:00Z',
      createdBy: 'user-001',
    };

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDeal);

    await expect(
      classifyInvoiceStatus({
        dealId,
        currentDateTime,
      })
    ).rejects.toThrow(InvalidDealStatus);

    await expect(
      classifyInvoiceStatus({
        dealId,
        currentDateTime,
      })
    ).rejects.toThrow('失注した商談の請求ステータスは判定できません。商談ID: DEAL-2024-001');
  });
});
