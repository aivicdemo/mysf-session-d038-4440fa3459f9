import { reconcileDealAndInvoice } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';
import type { ReconcileDealAndInvoiceInput } from '../../src/logic/deal-invoice-reconciliation';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchDealsWithInvoices: jest.fn(),
  fetchInvoiceWithLineItems: jest.fn(),
  fetchAllDealStages: jest.fn(),
}));

describe('SCEN-096: 請求書IDが空または不正な形式の場合、エラーを返す', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = '2024-01-01T00:00:00Z';
  const targetPeriodEnd = '2024-01-31T23:59:59Z';

  beforeEach(() => {
    jest.clearAllMocks();

    // fetchDealById の戻り値
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'Test Deal',
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

    // fetchDealsWithInvoices の戻り値 - invoiceId が空文字列
    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue({
      dealsWithInvoices: [
        {
          deal: {
            dealId: '550e8400-e29b-41d4-a716-446655440000',
            dealName: 'Test Deal',
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
                invoiceId: '',
                dealId: '550e8400-e29b-41d4-a716-446655440000',
                invoiceAmount: 1000000,
                taxAmount: 100000,
                invoiceStatus: 'issued',
                paidDate: '2024-01-20T00:00:00Z',
                paidAmount: 1000000,
                customerId: 'cust-001',
                salesRepresentativeId: 'sales-001',
                invoiceNumber: '',
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

    // fetchAllDealStages の戻り値
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
      ],
      totalCount: 1,
      fetchedAt: new Date().toISOString(),
    });
  });

  it('請求書IDが空文字列の場合、エラーをスローする', async () => {
    const input: ReconcileDealAndInvoiceInput = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      targetPeriodStart: new Date(targetPeriodStart),
      targetPeriodEnd: new Date(targetPeriodEnd),
    };

    await expect(reconcileDealAndInvoice(input)).rejects.toThrow(
      '請求書IDが指定されていません。確認してください'
    );
  });
});
