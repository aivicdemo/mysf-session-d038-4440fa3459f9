import { jest } from '@jest/globals';
import { saveInvoice, InvoiceDataStoreError, DataStoreError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-688: 請求書テーブルへの保存操作がデータストアレベルで失敗した場合、InvoiceDataStoreErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('データストアの読み書きが失敗する場合、InvoiceDataStoreError が発生する', async () => {
    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockRejectedValue(new DataStoreError('Database connection failed'));

    const input = {
      invoiceId: undefined,
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      customerId: '660e8400-e29b-41d4-a716-446655440001',
      salesRepresentativeId: '770e8400-e29b-41d4-a716-446655440002',
      invoiceNumber: 'INV-2026-001',
      invoiceDate: '2026-10-07T00:00:00Z',
      dueDate: '2026-11-07T00:00:00Z',
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
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId: '880e8400-e29b-41d4-a716-446655440003',
      operationTimestamp: '2026-10-07T10:00:00Z',
    };

    await expect(saveInvoice(input)).rejects.toThrow(InvoiceDataStoreError);
    await expect(saveInvoice(input)).rejects.toThrow('請求書の保存に失敗しました。システム管理者に連絡してください。');
  });
});
