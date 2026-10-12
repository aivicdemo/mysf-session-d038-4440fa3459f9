import { validateDealInvoiceLinkAndTransition, ReferenceIntegrityViolation } from '../../src/logic/deal-invoice-link-validation';
import { fetchDealById, fetchInvoicesForPeriod, fetchInvoiceLineItemsByInvoice, fetchAllDealStages } from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-308: 請求書または請求明細が商談を正しく参照していない場合、ReferenceIntegrityViolationエラーが返される', () => {
  it('参照整合性違反でエラーが返される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-001';
    const operationTimestamp = new Date('2026-10-07T10:00:00Z');

    const dealRecord = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'ABC社 システム導入プロジェクト',
      status: '交渉中',
      amount: 1000000,
      closedDate: '2026-10-31',
      ownerId: 'user-001',
    };

    const relatedInvoices = [
      {
        invoiceId: 'inv-001',
        dealId: '550e8400-e29b-41d4-a716-446655440099',
        invoiceAmount: 500000,
        invoiceStatus: '確定',
        invoiceDate: '2026-10-01',
      },
      {
        invoiceId: 'inv-002',
        dealId: '550e8400-e29b-41d4-a716-446655440099',
        invoiceAmount: 500000,
        invoiceStatus: '確定',
        invoiceDate: '2026-10-15',
      },
    ];

    const invoiceLineItems = [
      {
        lineItemId: 'line-001',
        invoiceId: 'inv-001',
        description: 'システム導入費用',
        quantity: 1,
        unitPrice: 500000,
        lineAmount: 500000,
      },
      {
        lineItemId: 'line-002',
        invoiceId: 'inv-002',
        description: '保守サポート費用',
        quantity: 1,
        unitPrice: 500000,
        lineAmount: 500000,
      },
    ];

    const dealStageDefinition = [
      { stageName: '見込み', stageOrder: 1, isClosedWon: false, isClosedLost: false },
      { stageName: '交渉中', stageOrder: 2, isClosedWon: false, isClosedLost: false },
      { stageName: '成約', stageOrder: 3, isClosedWon: true, isClosedLost: false },
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
      new ReferenceIntegrityViolation('請求書と商談の参照関係が破損しています。システム管理者に連絡してください。')
    );
  });
});
