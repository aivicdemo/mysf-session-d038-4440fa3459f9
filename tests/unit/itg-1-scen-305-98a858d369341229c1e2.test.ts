import { validateDealInvoiceLinkAndTransition, InvoiceLineItemMissing } from '../../src/logic/deal-invoice-link-validation';
import { fetchDealById, fetchInvoicesForPeriod, fetchInvoiceLineItemsByInvoice, fetchAllDealStages } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-305: 請求書に紐付く請求明細が存在しない場合、InvoiceLineItemMissingエラーが返される', () => {
  it('請求明細なしでエラーが返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '契約締結';
    const userId = 'user-001';
    const operationTimestamp = new Date('2025-01-15T10:30:00Z');

    const dealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'A社システム導入案件',
      dealAmount: 1000000,
      dealStatus: '商談進行中',
      closedDate: '2025-01-31',
    };

    const relatedInvoices = [
      {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        invoiceAmount: 1000000,
        invoiceStatus: '確定',
        invoiceDate: '2025-01-10',
      },
    ];

    const invoiceLineItems = [
      {
        invoiceId: 'inv-001',
      },
    ];

    const dealStageDefinition = [
      { stageId: 'stage-001', stageName: '初期接触', stageOrder: 1, isClosedWon: false, isClosedLost: false },
      { stageId: 'stage-002', stageName: '商談進行中', stageOrder: 2, isClosedWon: false, isClosedLost: false },
      { stageId: 'stage-003', stageName: '契約締結', stageOrder: 3, isClosedWon: true, isClosedLost: false },
    ];

    (fetchDealById as jest.Mock).mockResolvedValue(dealRecord);
    (fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(relatedInvoices);
    (fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue(invoiceLineItems);
    (fetchAllDealStages as jest.Mock).mockResolvedValue(dealStageDefinition);

    await expect(
      validateDealInvoiceLinkAndTransition({
        dealId,
        targetStage,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(
      new InvoiceLineItemMissing('請求書に請求明細がありません。請求明細を追加してから遷移してください。')
    );
  });
});
