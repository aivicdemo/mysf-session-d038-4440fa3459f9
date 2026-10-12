import { jest } from '@jest/globals';
import { saveInvoice, DealNotFoundError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-683: 指定された商談IDが商談テーブルに存在しない場合、DealNotFoundErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('dealId が商談テーブルに存在しない場合、DealNotFoundError が発生する', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockResolvedValue([]);

    const input = {
      invoiceId: undefined,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '550e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2024-001',
      invoiceDate: '2024-01-15T00:00:00Z',
      dueDate: '2024-02-15T00:00:00Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '未請求',
      paidDate: undefined,
      paidAmount: undefined,
      remarks: undefined,
      modificationReason: undefined,
      reissueCount: 0,
      lastReissuedAt: undefined,
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証待ち',
      currentUserId: '550e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2024-01-15T10:00:00Z',
    };

    await expect(saveInvoice(input)).rejects.toThrow(DealNotFoundError);
    await expect(saveInvoice(input)).rejects.toThrow('指定された商談が見つかりません。商談IDを確認してください。');
  });
});
