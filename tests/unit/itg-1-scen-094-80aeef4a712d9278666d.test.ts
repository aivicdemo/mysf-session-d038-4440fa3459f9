import { reconcileDealAndInvoice } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';
import type {
  ReconcileDealAndInvoiceInput,
  ReconcileDealAndInvoiceOutput,
} from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchDealsWithInvoices: jest.fn(),
  fetchInvoiceWithLineItems: jest.fn(),
  fetchAllDealStages: jest.fn(),
}));

describe('SCEN-094: 複数の不整合が同時に存在する場合、すべての検出された異常を結果に含める', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = '2024-01-01T00:00:00Z';
  const targetPeriodEnd = '2024-01-31T23:59:59Z';

  beforeEach(() => {
    jest.clearAllMocks();

    // 対象商談の詳細情報
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'テスト商談A',
      dealAmount: 1000000,
      stageId: 'stage-001',
      stageName: '成約済み',
      contractedDate: '2024-01-15T00:00:00Z',
      customerId: 'cust-001',
      salesRepresentativeId: 'sales-001',
      expectedContractDate: '2024-01-15',
      description: null,
      lossReason: null,
      invoiceGenerationSLADeadline: null,
      invoiceSLAExceededFlag: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-001',
    });

    // 商談に紐付く請求書一覧
    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue({
      dealsWithInvoices: [
        {
          deal: {
            dealId: '550e8400-e29b-41d4-a716-446655440000',
            dealName: 'テスト商談A',
            dealAmount: 1000000,
            stageId: 'stage-001',
            stageName: '成約済み',
            contractedDate: '2024-01-15T00:00:00Z',
            customerId: 'cust-001',
            salesRepresentativeId: 'sales-001',
            expectedContractDate: '2024-01-15',
            description: null,
            lossReason: null,
            invoiceGenerationSLADeadline: null,
            invoiceSLAExceededFlag: false,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z',
            createdBy: 'user-001',
          },
          invoices: [
            {
              invoice: {
                invoiceId: 'INV-2024-001',
                dealId: '550e8400-e29b-41d4-a716-446655440000',
                invoiceAmount: 900000,
                taxAmount: 90000,
                invoiceStatus: '一部入金',
                paidDate: '2024-01-20T00:00:00Z',
                paidAmount: 450000,
                customerId: 'cust-001',
                salesRepresentativeId: 'sales-001',
                invoiceNumber: 'INV-2024-001',
                invoiceDate: '2024-01-15',
                dueDate: '2024-02-15',
                untaxedAmount: 810000,
                remarks: null,
                modificationReason: null,
                reissueCount: 0,
                lastReissuedAt: null,
                amountCalculationVerificationStatus: 'verified',
                referenceIntegrityVerificationStatus: 'verified',
                createdAt: '2024-01-15T00:00:00Z',
                updatedAt: '2024-01-15T00:00:00Z',
                createdBy: 'user-001',
              },
              lineItems: [
                {
                  lineItemId: 'item-001',
                  invoiceId: 'INV-2024-001',
                  dealId: '550e8400-e29b-41d4-a716-446655440000',
                  activityId: null,
                  lineNumber: 1,
                  productName: '商品A',
                  productDescription: null,
                  quantity: 100,
                  unitPrice: 8000,
                  amount: 800000,
                  taxRate: 0.1,
                  taxAmount: 80000,
                  taxIncludedAmount: 880000,
                  remarks: null,
                  modificationPreviousQuantity: null,
                  modificationPreviousUnitPrice: null,
                  modificationPreviousAmount: null,
                  createdAt: '2024-01-15T00:00:00Z',
                  updatedAt: '2024-01-15T00:00:00Z',
                  createdBy: 'user-001',
                },
                {
                  lineItemId: 'item-002',
                  invoiceId: 'INV-2024-001',
                  dealId: '550e8400-e29b-41d4-a716-446655440000',
                  activityId: null,
                  lineNumber: 2,
                  productName: '商品B',
                  productDescription: null,
                  quantity: 50,
                  unitPrice: 2000,
                  amount: 100000,
                  taxRate: 0.1,
                  taxAmount: 10000,
                  taxIncludedAmount: 110000,
                  remarks: null,
                  modificationPreviousQuantity: null,
                  modificationPreviousUnitPrice: null,
                  modificationPreviousAmount: null,
                  createdAt: '2024-01-15T00:00:00Z',
                  updatedAt: '2024-01-15T00:00:00Z',
                  createdBy: 'user-001',
                },
              ],
            },
            {
              invoice: {
                invoiceId: 'INV-2024-002',
                dealId: '550e8400-e29b-41d4-a716-446655440000',
                invoiceAmount: 150000,
                taxAmount: 15000,
                invoiceStatus: '未請求',
                paidDate: null,
                paidAmount: 0,
                customerId: 'cust-001',
                salesRepresentativeId: 'sales-001',
                invoiceNumber: 'INV-2024-002',
                invoiceDate: '2024-01-15',
                dueDate: '2024-02-15',
                untaxedAmount: 135000,
                remarks: null,
                modificationReason: null,
                reissueCount: 0,
                lastReissuedAt: null,
                amountCalculationVerificationStatus: 'verified',
                referenceIntegrityVerificationStatus: 'verified',
                createdAt: '2024-01-15T00:00:00Z',
                updatedAt: '2024-01-15T00:00:00Z',
                createdBy: 'user-001',
              },
              lineItems: [
                {
                  lineItemId: 'item-003',
                  invoiceId: 'INV-2024-002',
                  dealId: '550e8400-e29b-41d4-a716-446655440000',
                  activityId: null,
                  lineNumber: 1,
                  productName: '商品C',
                  productDescription: null,
                  quantity: 50,
                  unitPrice: 3000,
                  amount: 150000,
                  taxRate: 0.1,
                  taxAmount: 15000,
                  taxIncludedAmount: 165000,
                  remarks: null,
                  modificationPreviousQuantity: null,
                  modificationPreviousUnitPrice: null,
                  modificationPreviousAmount: null,
                  createdAt: '2024-01-15T00:00:00Z',
                  updatedAt: '2024-01-15T00:00:00Z',
                  createdBy: 'user-001',
                },
              ],
            },
          ],
        },
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });

    // 商談ステージマスタ
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue({
      stages: [
        {
          stageId: 'stage-001',
          stageName: '成約済み',
          stageOrder: 3,
          description: null,
          contractedStageFlag: true,
          lossStageFlag: false,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'user-001',
          updatedBy: 'user-001',
        },
        {
          stageId: 'stage-002',
          stageName: '失注',
          stageOrder: 4,
          description: null,
          contractedStageFlag: false,
          lossStageFlag: true,
          validFlag: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdBy: 'user-001',
          updatedBy: 'user-001',
        },
      ],
      totalCount: 2,
      fetchedAt: new Date().toISOString(),
    });
  });

  it('複数の不整合が同時に存在する場合、すべての検出された異常を結果に含める', async () => {
    const input: ReconcileDealAndInvoiceInput = {
      dealId,
      targetPeriodStart: new Date(targetPeriodStart),
      targetPeriodEnd: new Date(targetPeriodEnd),
    };

    const result: ReconcileDealAndInvoiceOutput = await reconcileDealAndInvoice(input);

    expect(result.reconciliationStatus).toBe('line_item_mismatch');
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.dealAmount).toBe(1000000);
    expect(result.totalInvoiceAmount).toBe(1050000);
    expect(result.amountDiscrepancy).toBe(-50000);
    expect(result.invoiceCount).toBe(2);

    expect(result.invoices).toHaveLength(2);
    expect(result.invoices[0]).toMatchObject({
      invoiceId: 'INV-2024-001',
      invoiceAmount: 900000,
      invoiceStatus: '一部入金',
      lineItemCount: 2,
    });
    expect(result.invoices[1]).toMatchObject({
      invoiceId: 'INV-2024-002',
      invoiceAmount: 150000,
      invoiceStatus: '未請求',
      lineItemCount: 1,
    });

    expect(result.detectedIssues).toContainEqual({
      issueType: 'amount_discrepancy',
      description: '金額ズレを検出しました。商談金額と請求金額の差異額と差異理由を確認してください。',
      severity: 'error',
    });

    expect(result.detectedIssues).toContainEqual({
      issueType: 'unbilled',
      description: '未請求案件を検出しました。成約済み商談に対して請求書が生成されていません。',
      severity: 'error',
    });

    expect(result.detectedIssues).toContainEqual({
      issueType: 'line_item_mismatch',
      description: '請求明細の合計金額が請求書の請求金額と一致しません。請求明細を確認してください。',
      severity: 'error',
    });

    expect(result.validationTimestamp).toBeInstanceOf(Date);
  });
});
