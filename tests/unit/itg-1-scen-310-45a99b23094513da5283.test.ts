import { validateDealInvoiceLinkAndTransition } from '../../src/logic/deal-invoice-link-validation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchInvoicesForPeriod: jest.fn(),
  fetchInvoiceLineItemsByInvoice: jest.fn(),
  fetchAllDealStages: jest.fn(),
}));

describe('SCEN-310: 複数の請求書が商談に紐付く場合、すべての請求書の合計金額が商談金額と一致する場合に合計金額が正しく集計される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談金額と請求書合計金額が一致する場合、isValidがtrueで合計金額が正しく集計される', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetStage = '成約';
    const userId = 'user-001';
    const operationTimestamp = new Date('2026-10-15T10:30:00Z');

    // Mock fetchDealById
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId,
      customerId: 'cust-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'ABC株式会社システム導入案件',
      dealAmount: 3000000,
      stageId: 'stage-002',
      expectedContractDate: '2026-10-31',
      contractedDate: null,
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2026-09-01T00:00:00Z',
      updatedAt: '2026-10-15T10:30:00Z',
      createdBy: 'user-001',
    });

    // Mock fetchInvoicesForPeriod
    (dataPersistence.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue({
      invoices: [
        {
          invoiceId: 'inv-001',
          dealId,
          customerId: 'cust-001',
          salesRepresentativeId: 'rep-001',
          invoiceNumber: 'INV-001',
          invoiceDate: '2026-09-01',
          dueDate: '2026-09-30',
          invoiceAmount: 1500000,
          taxAmount: 150000,
          untaxedAmount: 1350000,
          invoiceStatus: '確定',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: '成功',
          referenceIntegrityVerificationStatus: '成功',
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
          createdBy: 'user-001',
        },
        {
          invoiceId: 'inv-002',
          dealId,
          customerId: 'cust-001',
          salesRepresentativeId: 'rep-001',
          invoiceNumber: 'INV-002',
          invoiceDate: '2026-10-01',
          dueDate: '2026-10-31',
          invoiceAmount: 1500000,
          taxAmount: 150000,
          untaxedAmount: 1350000,
          invoiceStatus: '確定',
          paidDate: null,
          paidAmount: null,
          remarks: null,
          modificationReason: null,
          reissueCount: 0,
          lastReissuedAt: null,
          amountCalculationVerificationStatus: '成功',
          referenceIntegrityVerificationStatus: '成功',
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
          createdBy: 'user-001',
        },
      ],
      totalCount: 2,
      fetchedAt: '2026-10-15T10:30:00Z',
    });

    // Mock fetchInvoiceLineItemsByInvoice
    (dataPersistence.fetchInvoiceLineItemsByInvoice as jest.Mock)
      .mockResolvedValueOnce({
        lineItems: [
          {
            lineItemId: 'line-001',
            invoiceId: 'inv-001',
            dealId,
            activityId: null,
            lineNumber: 1,
            productName: 'システム導入サービス（前半）',
            productDescription: null,
            quantity: 1,
            unitPrice: 1500000,
            amount: 1500000,
            taxRate: 0.1,
            taxAmount: 150000,
            taxIncludedAmount: 1650000,
            remarks: null,
            modificationPreviousQuantity: null,
            modificationPreviousUnitPrice: null,
            modificationPreviousAmount: null,
            createdAt: '2026-09-01T00:00:00Z',
            updatedAt: '2026-09-01T00:00:00Z',
            createdBy: 'user-001',
          },
        ],
        totalCount: 1,
        fetchedAt: '2026-10-15T10:30:00Z',
      })
      .mockResolvedValueOnce({
        lineItems: [
          {
            lineItemId: 'line-002',
            invoiceId: 'inv-002',
            dealId,
            activityId: null,
            lineNumber: 1,
            productName: 'システム導入サービス（後半）',
            productDescription: null,
            quantity: 1,
            unitPrice: 1500000,
            amount: 1500000,
            taxRate: 0.1,
            taxAmount: 150000,
            taxIncludedAmount: 1650000,
            remarks: null,
            modificationPreviousQuantity: null,
            modificationPreviousUnitPrice: null,
            modificationPreviousAmount: null,
            createdAt: '2026-10-01T00:00:00Z',
            updatedAt: '2026-10-01T00:00:00Z',
            createdBy: 'user-001',
          },
        ],
        totalCount: 1,
        fetchedAt: '2026-10-15T10:30:00Z',
      });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        {
          stageId: 'stage-001',
          stageName: 'リード',
          stageOrder: 1,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          stageId: 'stage-002',
          stageName: '交渉中',
          stageOrder: 2,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
        {
          stageId: 'stage-003',
          stageName: '成約',
          stageOrder: 3,
          description: null,
          contractedStageFlag: true,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          createdBy: 'system',
          updatedBy: 'system',
        },
      ],
      totalCount: 3,
      fetchedAt: '2026-10-15T10:30:00Z',
    });

    const result = await validateDealInvoiceLinkAndTransition({
      dealId,
      targetStage,
      userId,
      operationTimestamp,
    });

    expect(result.isValid).toBe(true);
    expect(result.dealId).toBe(dealId);
    expect(result.targetStage).toBe(targetStage);
    expect(result.relatedInvoiceCount).toBe(2);
    expect(result.totalInvoiceAmount).toBe(3000000);
    // 仕様の期待結果：validationDetails 内のすべての検証項目が成功状態
    // 仕様のステップから期待される検証項目：
    // - 商談の存在確認
    // - 紐付く請求書の存在確認
    // - 請求書金額合計の確認
    // - 請求書ステータス確認
    // - 請求明細の存在確認
    // - 参照関係の検証
    // - ステージ遷移ルールの検証

    expect(result.validationDetails).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          itemName: '請求書金額合計チェック',
          isValid: true,
          message: '商談金額3000000円と請求書合計金額3000000円が一致しています',
        }),
      ])
    );
    // すべての検証項目が成功していることを確認
    expect(result.validationDetails.every(detail => detail.isValid)).toBe(true);
  });
});
