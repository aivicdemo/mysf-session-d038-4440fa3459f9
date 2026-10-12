import { validateDealInvoiceLinkAndTransition, InvoiceAmountMismatch } from '../../src/logic/deal-invoice-link-validation';
import { fetchDealById, fetchInvoicesForPeriod, fetchInvoiceLineItemsByInvoice, fetchAllDealStages } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-304: 商談金額と請求書の合計金額が一致しない場合、InvoiceAmountMismatchエラーが返される', () => {
  it('金額不一致でエラーが返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-001';
    const operationTimestamp = new Date('2025-01-15T10:30:00Z');

    const dealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'ABC株式会社 システム導入案件',
      amount: 1500000,
      status: '交渉中',
      closedDate: '2025-01-31',
      dealStageId: 'stage-003',
    };

    const relatedInvoices = [
      {
        invoiceId: 'inv-2025-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        invoiceAmount: 900000,
        invoiceStatus: '確定',
        invoiceDate: '2025-01-10',
      },
      {
        invoiceId: 'inv-2025-002',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        invoiceAmount: 500000,
        invoiceStatus: '確定',
        invoiceDate: '2025-01-12',
      },
    ];

    const invoiceLineItems = [
      {
        lineItemId: 'item-001',
        invoiceId: 'inv-2025-001',
        description: 'システム導入サービス',
        amount: 900000,
        quantity: 1,
        unitPrice: 900000,
      },
      {
        lineItemId: 'item-002',
        invoiceId: 'inv-2025-002',
        description: '保守サービス（年間）',
        amount: 500000,
        quantity: 1,
        unitPrice: 500000,
      },
    ];

    const dealStageDefinition = [
      { stageId: 'stage-001', stageName: 'リード', stageOrder: 1, isContracted: false, isLost: false },
      { stageId: 'stage-002', stageName: '提案', stageOrder: 2, isContracted: false, isLost: false },
      { stageId: 'stage-003', stageName: '交渉中', stageOrder: 3, isContracted: false, isLost: false },
      { stageId: 'stage-004', stageName: '成約', stageOrder: 4, isContracted: true, isLost: false },
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
      new InvoiceAmountMismatch('商談金額と請求書の合計金額が一致しません。金額ズレを修正してから遷移してください。')
    );
  });
});
