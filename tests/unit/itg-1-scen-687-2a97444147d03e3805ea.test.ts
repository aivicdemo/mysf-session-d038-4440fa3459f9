import { jest } from '@jest/globals';
import { saveInvoice, UnauthorizedModificationError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-687: 現在のユーザーが請求書の修正権限を持たない場合、UnauthorizedModificationErrorが発生する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('既存請求書を別のユーザーが修正しようとする場合、UnauthorizedModificationError が発生する', async () => {
    const mockListRecords = dataStore.listRecords as any;
    mockListRecords.mockImplementation(async (tableName: string) => {
      if (tableName === '請求書') {
        return [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            請求書ID: '550e8400-e29b-41d4-a716-446655440000',
            商談ID: '660e8400-e29b-41d4-a716-446655440001',
            取引先ID: '770e8400-e29b-41d4-a716-446655440002',
            営業担当者ID: '880e8400-e29b-41d4-a716-446655440003',
            請求書番号: 'INV-2024-00001',
            請求日: '2024-12-01T00:00:00Z',
            支払期限日: '2024-12-31T00:00:00Z',
            請求金額: 110000,
            税額: 10000,
            税抜金額: 100000,
            請求ステータス: '請求済',
            入金日: null,
            入金金額: null,
            摘要: null,
            作成日時: '2024-12-01T09:00:00Z',
            更新日時: '2024-12-05T10:00:00Z',
            作成者: '880e8400-e29b-41d4-a716-446655440003',
            修正前請求金額: 120000,
            修正理由: null,
            再発行回数: 0,
            最終再発行日時: null,
            金額計算検証ステータス: '検証済',
            金額計算検証日時: '2024-12-01T10:00:00Z',
            参照関係検証ステータス: '検証済',
            createdAt: '2024-12-01T09:00:00Z',
            updatedAt: '2024-12-05T10:00:00Z',
          },
        ];
      }
      return [];
    });

    const input = {
      invoiceId: '550e8400-e29b-41d4-a716-446655440000',
      dealId: '660e8400-e29b-41d4-a716-446655440001',
      customerId: '770e8400-e29b-41d4-a716-446655440002',
      salesRepresentativeId: '880e8400-e29b-41d4-a716-446655440003',
      invoiceNumber: 'INV-2024-00001',
      invoiceDate: '2024-12-01T00:00:00Z',
      dueDate: '2024-12-31T00:00:00Z',
      invoiceAmount: 110000,
      taxAmount: 10000,
      untaxedAmount: 100000,
      invoiceStatus: '請求済',
      paidDate: undefined,
      paidAmount: undefined,
      remarks: undefined,
      modificationReason: '金額修正',
      reissueCount: 1,
      lastReissuedAt: '2024-12-05T10:00:00Z',
      amountCalculationVerificationStatus: '検証済',
      referenceIntegrityVerificationStatus: '検証済',
      currentUserId: '990e8400-e29b-41d4-a716-446655440004',
      operationTimestamp: '2024-12-10T15:00:00Z',
    };

    await expect(saveInvoice(input)).rejects.toThrow(UnauthorizedModificationError);
    await expect(saveInvoice(input)).rejects.toThrow('この請求書を修正する権限がありません。');
  });
});
