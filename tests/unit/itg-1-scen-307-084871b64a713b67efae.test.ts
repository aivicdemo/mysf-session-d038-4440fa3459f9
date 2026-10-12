import { validateDealInvoiceLinkAndTransition, DealStageTransitionInvalid } from '../../src/logic/deal-invoice-link-validation';
import { fetchDealById, fetchInvoicesForPeriod, fetchInvoiceLineItemsByInvoice, fetchAllDealStages } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-307: 商談ステージの遷移ルールに違反する場合、DealStageTransitionInvalidエラーが返される', () => {
  it('無効なステージ遷移でエラーが返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '契約成立';
    const userId = 'user-001';
    const operationTimestamp = new Date('2026-10-07T10:30:00.000Z');

    const dealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'テスト商談',
      dealAmount: 1000000,
      currentStage: '提案中',
      closedDate: '2026-11-30',
      status: 'active',
    };

    const dealStageDefinition = [
      { stageId: 'stage-001', stageName: '初期接触', stageOrder: 1, isClosedWon: false, isClosedLost: false },
      { stageId: 'stage-002', stageName: '提案中', stageOrder: 2, isClosedWon: false, isClosedLost: false },
      { stageId: 'stage-003', stageName: '契約予定', stageOrder: 3, isClosedWon: false, isClosedLost: false },
    ];

    const relatedInvoices = [
      {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        invoiceAmount: 1000000,
        invoiceStatus: 'issued',
        invoiceDate: '2026-10-01',
      },
    ];

    const invoiceLineItems = [
      {
        lineItemId: 'line-001',
        invoiceId: 'inv-001',
        itemAmount: 1000000,
        quantity: 1,
        unitPrice: 1000000,
      },
    ];

    (fetchDealById as jest.Mock).mockResolvedValue(dealRecord);
    (fetchAllDealStages as jest.Mock).mockResolvedValue(dealStageDefinition);
    (fetchInvoicesForPeriod as jest.Mock).mockResolvedValue(relatedInvoices);
    (fetchInvoiceLineItemsByInvoice as jest.Mock).mockResolvedValue(invoiceLineItems);

    await expect(
      validateDealInvoiceLinkAndTransition({
        dealId,
        targetStage,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(
      new DealStageTransitionInvalid('商談ステージの遷移が無効です。ステージ遷移ルールを確認してください。')
    );
  });
});
