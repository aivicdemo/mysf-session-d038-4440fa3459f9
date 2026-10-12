import { validateDealInvoiceLinkAndTransition, InvoiceStatusInvalid } from '../../src/logic/deal-invoice-link-validation';
import { fetchDealById, fetchInvoicesForPeriod, fetchInvoiceLineItemsByInvoice, fetchAllDealStages } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-306: 請求書のステータスが遷移に適さない状態である場合、InvoiceStatusInvalidエラーが返される', () => {
  it('無効な請求書ステータスでエラーが返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '契約締結';
    const userId = 'user-001';
    const operationTimestamp = new Date('2026-10-07T10:30:00.000Z');

    const dealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: '顧客A 新規契約案件',
      dealAmount: 1000000,
      dealStatus: '交渉中',
      contractDate: '2026-10-05',
    };

    const relatedInvoices = [
      {
        invoiceId: 'inv-001',
        invoiceAmount: 500000,
        status: '下書き',
        issueDate: '2026-10-06',
      },
      {
        invoiceId: 'inv-002',
        invoiceAmount: 500000,
        status: '確定',
        issueDate: '2026-10-06',
      },
    ];

    const invoiceLineItems = [
      {
        invoiceId: 'inv-001',
        lineItems: [
          {
            lineItemId: 'line-001',
            description: 'システム開発',
            quantity: 1,
            unitPrice: 500000,
            amount: 500000,
          },
        ],
      },
      {
        invoiceId: 'inv-002',
        lineItems: [
          {
            lineItemId: 'line-002',
            description: '保守サポート',
            quantity: 1,
            unitPrice: 500000,
            amount: 500000,
          },
        ],
      },
    ];

    const dealStageDefinition = [
      { stageName: '初期接触', stageOrder: 1, isContractStage: false, isLostStage: false },
      { stageName: '交渉中', stageOrder: 2, isContractStage: false, isLostStage: false },
      { stageName: '契約締結', stageOrder: 3, isContractStage: true, isLostStage: false },
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
      new InvoiceStatusInvalid('請求書のステータスが不適切です。請求書ステータスを確認してから遷移してください。')
    );
  });
});
