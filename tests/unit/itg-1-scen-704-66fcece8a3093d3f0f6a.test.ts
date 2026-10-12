import { saveInvoiceLineItem } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-704: 新規作成時に必須項目を満たす入力で請求明細レコードを保存し、採番されたIDと作成日時を含む完全なレコードを返す', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新規作成時に必須項目を満たす入力で請求明細レコードを保存し、採番されたIDと作成日時を含む完全なレコードを返す', async () => {
    const mockLineItemId = '990e8400-e29b-41d4-a716-446655440004';
    const operationTimestamp = '2026-10-07T10:30:00.000Z';

    (mockDataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '請求書') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            invoiceId: '550e8400-e29b-41d4-a716-446655440000',
            dealId: '550e8400-e29b-41d4-a716-446655440001',
            customerId: '550e8400-e29b-41d4-a716-446655440002',
            salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440003',
            invoiceNumber: 'INV-20261007-001',
            invoiceDate: '2026-10-07T00:00:00.000Z',
            dueDate: '2026-11-06T00:00:00.000Z',
            invoiceAmount: 550000,
            taxAmount: 50000,
            untaxedAmount: 500000,
            invoiceStatus: '下書き',
            paidDate: null,
            paidAmount: null,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: '検証済み',
            referenceIntegrityVerificationStatus: '検証済み',
            createdAt: '2026-10-07T09:00:00.000Z',
            updatedAt: '2026-10-07T09:00:00.000Z',
            createdBy: 'user-admin',
          },
        ]);
      }
      if (tableName === '商談') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            dealId: '550e8400-e29b-41d4-a716-446655440001',
            customerId: '550e8400-e29b-41d4-a716-446655440002',
            salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440003',
            dealName: 'ABC株式会社 システム導入案件',
            dealAmount: 5000000,
            stageId: '契約段階',
            expectedContractDate: '2026-10-15T00:00:00.000Z',
            contractedDate: '2026-10-07T00:00:00.000Z',
            description: '大型システム導入プロジェクト',
            lossReason: null,
            invoiceGenerationSLADeadline: '2026-10-14T00:00:00.000Z',
            invoiceSLAExceededFlag: false,
            createdAt: '2026-09-01T08:00:00.000Z',
            updatedAt: '2026-10-07T08:00:00.000Z',
            createdBy: 'user-admin',
          },
        ]);
      }
      if (tableName === '請求明細') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    (mockDataStore.createRecord as jest.Mock).mockResolvedValue({
      lineItemId: mockLineItemId,
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      activityId: null,
      lineNumber: 1,
      productName: 'コンサルティングサービス',
      productDescription: null,
      quantity: 10,
      unitPrice: 50000,
      amount: 500000,
      taxRate: 10,
      taxAmount: 50000,
      taxIncludedAmount: 550000,
      remarks: null,
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      createdAt: operationTimestamp,
      updatedAt: operationTimestamp,
      createdBy: 'user-001',
    });

    const result = await saveInvoiceLineItem({
      lineItemId: null,
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '550e8400-e29b-41d4-a716-446655440001',
      activityId: null,
      lineNumber: 1,
      productName: 'コンサルティングサービス',
      productDescription: null,
      quantity: 10,
      unitPrice: 50000,
      amount: 500000,
      taxRate: 10,
      taxAmount: 50000,
      taxIncludedAmount: 550000,
      remarks: null,
      modificationPreviousQuantity: null,
      modificationPreviousUnitPrice: null,
      modificationPreviousAmount: null,
      currentUserId: 'user-001',
      operationTimestamp,
    });

    expect(result.lineItemId).toBe(mockLineItemId);
    expect(result.lineItemId).not.toBeNull();
    expect(result.invoiceId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.activityId).toBeNull();
    expect(result.lineNumber).toBe(1);
    expect(result.productName).toBe('コンサルティングサービス');
    expect(result.productDescription).toBeNull();
    expect(result.quantity).toBe(10);
    expect(result.unitPrice).toBe(50000);
    expect(result.amount).toBe(500000);
    expect(result.taxRate).toBe(10);
    expect(result.taxAmount).toBe(50000);
    expect(result.taxIncludedAmount).toBe(550000);
    expect(result.remarks).toBeNull();
    expect(result.modificationPreviousQuantity).toBeNull();
    expect(result.modificationPreviousUnitPrice).toBeNull();
    expect(result.modificationPreviousAmount).toBeNull();
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    expect(result.createdBy).toBe('user-001');
  });
});
