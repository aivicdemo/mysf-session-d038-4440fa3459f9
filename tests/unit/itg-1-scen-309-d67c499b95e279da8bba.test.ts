import { validateDealInvoiceLinkAndTransition } from '../../src/logic/deal-invoice-link-validation';
import { fetchDealById, fetchInvoicesForPeriod, fetchInvoiceLineItemsByInvoice, fetchAllDealStages } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-309: 検証に成功した場合、出力に商談ID、遷移先ステージ、紐付く請求書の件数と合計金額が含まれる', () => {
  it('検証成功時に正しい出力が返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-001';
    const operationTimestamp = new Date('2026-10-07T10:00:00.000Z');

    const dealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'ABC社向け契約',
      status: '交渉中',
      amount: 1000000,
      closedDate: '2026-10-31',
      createdAt: '2026-09-01T09:00:00.000Z',
    };

    const relatedInvoices = [
      {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        invoiceAmount: 600000,
        invoiceStatus: '確定',
        issuedDate: '2026-10-01T00:00:00.000Z',
      },
      {
        invoiceId: 'inv-002',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        invoiceAmount: 400000,
        invoiceStatus: '確定',
        issuedDate: '2026-10-05T00:00:00.000Z',
      },
    ];

    const invoiceLineItems = [
      {
        lineItemId: 'line-001',
        invoiceId: 'inv-001',
        itemName: 'サービスA',
        quantity: 2,
        unitPrice: 300000,
        amount: 600000,
      },
      {
        lineItemId: 'line-002',
        invoiceId: 'inv-002',
        itemName: 'サービスB',
        quantity: 1,
        unitPrice: 400000,
        amount: 400000,
      },
    ];

    const dealStageDefinition = [
      { stageId: 'stage-001', stageName: '初期接触', order: 1, isClosedWon: false, isClosedLost: false },
      { stageId: 'stage-002', stageName: '交渉中', order: 2, isClosedWon: false, isClosedLost: false },
      { stageId: 'stage-003', stageName: '成約', order: 3, isClosedWon: true, isClosedLost: false },
    ];

    (fetchDealById as jest.Mock).mockResolvedValue(dealRecord);
    (fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(relatedInvoices);
    (fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue(invoiceLineItems);
    (fetchAllDealStages as jest.Mock).mockResolvedValue(dealStageDefinition);

    const result = await validateDealInvoiceLinkAndTransition({
      dealId,
      targetStage,
      userId,
      operationTimestamp,
    });

    expect(result.isValid).toBe(true);
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.targetStage).toBe('成約');
    expect(result.relatedInvoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(Array.isArray(result.validationDetails)).toBe(true);
    expect(result.validationDetails.length).toBeGreaterThan(0);
  });
});
