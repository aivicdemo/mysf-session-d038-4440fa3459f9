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

describe('SCEN-097: 商談に商品明細がない場合、警告を含めて検証結果を返す', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = '2024-01-01T00:00:00Z';
  const targetPeriodEnd = '2024-01-31T23:59:59Z';

  beforeEach(() => {
    jest.clearAllMocks();

    // 対象商談の詳細情報
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: '顧客A 新規案件',
      dealAmount: 1000000,
      stageId: 'stage-001',
      stageName: '成約',
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

    // 商談に紐付く請求書一覧（明細なし）
    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue({
      dealsWithInvoices: [
        {
          deal: {
            dealId: '550e8400-e29b-41d4-a716-446655440000',
            dealName: '顧客A 新規案件',
            dealAmount: 1000000,
            stageId: 'stage-001',
            stageName: '成約',
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
                invoiceAmount: 1000000,
                taxAmount: 100000,
                invoiceStatus: '請求済み',
                paidDate: '2024-01-20T00:00:00Z',
                paidAmount: 1000000,
                customerId: 'cust-001',
                salesRepresentativeId: 'sales-001',
                invoiceNumber: 'INV-2024-001',
                invoiceDate: '2024-01-15',
                dueDate: '2024-02-15',
                untaxedAmount: 900000,
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
              lineItems: [],
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
          stageName: '成約',
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
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });
  });

  it('商談に商品明細がない場合、警告を含めて検証結果を返す', async () => {
    const input: ReconcileDealAndInvoiceInput = {
      dealId,
      targetPeriodStart: new Date(targetPeriodStart),
      targetPeriodEnd: new Date(targetPeriodEnd),
    };

    const result: ReconcileDealAndInvoiceOutput = await reconcileDealAndInvoice(input);

    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.reconciliationStatus).toBe('line_item_mismatch');
    expect(result.dealAmount).toBe(1000000);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.amountDiscrepancy).toBeNull();
    expect(result.invoiceCount).toBe(1);

    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0]).toMatchObject({
      invoiceId: 'INV-2024-001',
      invoiceAmount: 1000000,
      invoiceStatus: '請求済み',
      lineItemCount: 0,
    });

    expect(result.detectedIssues).toContainEqual({
      issueType: 'line_item_missing',
      description: '商談に商品明細がありません。商談データを確認してください。',
      severity: 'warning',
    });

    expect(result.validationTimestamp).toBeInstanceOf(Date);
  });
});
