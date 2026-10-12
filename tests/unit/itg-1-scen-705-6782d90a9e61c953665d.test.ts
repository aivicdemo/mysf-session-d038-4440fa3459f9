import { saveInvoiceLineItem } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
}));

describe('SCEN-705: 更新時に既存レコードが存在し修正前値を指定した場合、修正内容を反映して更新日時を更新したレコードを返す', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('更新時に既存レコードが存在し修正前値を指定した場合、修正内容を反映して更新日時を更新したレコードを返す', async () => {
    const lineItemId = '550e8400-e29b-41d4-a716-446655440000';
    const operationTimestamp = '2026-10-08T14:30:00.000Z';
    const originalCreatedAt = '2026-09-01T09:00:00.000Z';

    (mockDataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '請求明細') {
        return Promise.resolve([
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            lineItemId: '550e8400-e29b-41d4-a716-446655440000',
            invoiceId: '660e8400-e29b-41d4-a716-446655440001',
            dealId: '770e8400-e29b-41d4-a716-446655440002',
            activityId: null,
            lineNumber: 1,
            productName: 'クラウドストレージサービス',
            productDescription: '月額制のクラウドストレージ 100GB',
            quantity: 10,
            unitPrice: 5000,
            amount: 50000,
            taxRate: 10,
            taxAmount: 5000,
            taxIncludedAmount: 55000,
            remarks: '年間契約分の月割り',
            modificationPreviousQuantity: null,
            modificationPreviousUnitPrice: null,
            modificationPreviousAmount: null,
            createdAt: originalCreatedAt,
            updatedAt: originalCreatedAt,
            createdBy: 'user-001',
          },
        ]);
      }
      if (tableName === '請求書') {
        return Promise.resolve([
          {
            id: '660e8400-e29b-41d4-a716-446655440001',
            invoiceId: '660e8400-e29b-41d4-a716-446655440001',
            dealId: '770e8400-e29b-41d4-a716-446655440002',
            customerId: '880e8400-e29b-41d4-a716-446655440003',
            salesRepresentativeId: '990e8400-e29b-41d4-a716-446655440004',
            invoiceNumber: 'INV-2026-001',
            invoiceDate: '2026-10-01T00:00:00.000Z',
            dueDate: '2026-11-01T00:00:00.000Z',
            invoiceAmount: 66000,
            taxAmount: 6000,
            untaxedAmount: 60000,
            invoiceStatus: '未送付',
            paidDate: null,
            paidAmount: 0,
            remarks: null,
            modificationReason: null,
            reissueCount: 0,
            lastReissuedAt: null,
            amountCalculationVerificationStatus: '検証済み',
            referenceIntegrityVerificationStatus: '検証済み',
            createdAt: '2026-09-15T10:00:00.000Z',
            updatedAt: '2026-09-15T10:00:00.000Z',
            createdBy: 'user-001',
          },
        ]);
      }
      if (tableName === '商談') {
        return Promise.resolve([
          {
            id: '770e8400-e29b-41d4-a716-446655440002',
            dealId: '770e8400-e29b-41d4-a716-446655440002',
            customerId: '880e8400-e29b-41d4-a716-446655440003',
            salesRepresentativeId: '990e8400-e29b-41d4-a716-446655440004',
            dealName: 'クラウドストレージ導入案件',
            dealAmount: 720000,
            stageId: '成約',
            expectedContractDate: '2026-09-30T00:00:00.000Z',
            contractedDate: '2026-09-28T00:00:00.000Z',
            description: '年間契約のクラウドストレージサービス導入',
            lossReason: null,
            invoiceGenerationSLADeadline: '2026-10-10T00:00:00.000Z',
            invoiceSLAExceededFlag: false,
            createdAt: '2026-08-01T08:00:00.000Z',
            updatedAt: '2026-09-28T15:30:00.000Z',
            createdBy: 'user-001',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    (mockDataStore.updateRecord as jest.Mock).mockResolvedValue({
      lineItemId,
      invoiceId: '660e8400-e29b-41d4-a716-446655440001',
      dealId: '770e8400-e29b-41d4-a716-446655440002',
      activityId: null,
      lineNumber: 1,
      productName: 'クラウドストレージサービス',
      productDescription: '月額制のクラウドストレージ 100GB',
      quantity: 12,
      unitPrice: 5000,
      amount: 60000,
      taxRate: 10,
      taxAmount: 6000,
      taxIncludedAmount: 66000,
      remarks: '年間契約分の月割り',
      modificationPreviousQuantity: 10,
      modificationPreviousUnitPrice: 5000,
      modificationPreviousAmount: 50000,
      createdAt: originalCreatedAt,
      updatedAt: operationTimestamp,
      createdBy: 'user-001',
    });

    const result = await saveInvoiceLineItem({
      lineItemId,
      invoiceId: '660e8400-e29b-41d4-a716-446655440001',
      dealId: '770e8400-e29b-41d4-a716-446655440002',
      activityId: null,
      lineNumber: 1,
      productName: 'クラウドストレージサービス',
      productDescription: '月額制のクラウドストレージ 100GB',
      quantity: 12,
      unitPrice: 5000,
      amount: 60000,
      taxRate: 10,
      taxAmount: 6000,
      taxIncludedAmount: 66000,
      remarks: '年間契約分の月割り',
      modificationPreviousQuantity: 10,
      modificationPreviousUnitPrice: 5000,
      modificationPreviousAmount: 50000,
      currentUserId: 'user-001',
      operationTimestamp,
    });

    expect(result.lineItemId).toBe(lineItemId);
    expect(result.invoiceId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result.dealId).toBe('770e8400-e29b-41d4-a716-446655440002');
    expect(result.activityId).toBeNull();
    expect(result.lineNumber).toBe(1);
    expect(result.productName).toBe('クラウドストレージサービス');
    expect(result.productDescription).toBe('月額制のクラウドストレージ 100GB');
    expect(result.quantity).toBe(12);
    expect(result.unitPrice).toBe(5000);
    expect(result.amount).toBe(60000);
    expect(result.taxRate).toBe(10);
    expect(result.taxAmount).toBe(6000);
    expect(result.taxIncludedAmount).toBe(66000);
    expect(result.remarks).toBe('年間契約分の月割り');
    expect(result.modificationPreviousQuantity).toBe(10);
    expect(result.modificationPreviousUnitPrice).toBe(5000);
    expect(result.modificationPreviousAmount).toBe(50000);
    expect(result.createdAt).toBe(originalCreatedAt);
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.createdBy).toBe('user-001');
  });
});
