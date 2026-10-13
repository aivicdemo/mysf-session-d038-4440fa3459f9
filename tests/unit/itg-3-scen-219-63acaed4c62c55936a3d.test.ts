import { jest } from '@jest/globals';
import {
  retrieveDiscrepancyDetailsForConfirmation,
  RetrieveDiscrepancyDetailsForConfirmationOutput,
} from '../../src/logic/discrepancy-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

import * as dataStore from '../../src/platform/data-store';

describe('SCEN-219: 差異確認履歴が0件の場合、空の配列で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異確認履歴が0件の場合、空の配列で返される', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEGACY-INV-2024-001',
        新システム請求書ID: 'NEW-INV-2024-001',
        差異種類: '金額差異',
        差異内容: '請求金額に不一致が発生',
        金額差異: 5000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2024-10-15T10:30:00Z',
        重大度: '高',
        原因分類: '消費税計算誤差',
        許容範囲判定: '範囲外',
        判定日時: '2024-10-15T11:00:00Z',
        判定者: 'user-001',
        createdAt: '2024-10-15T10:30:00Z',
        updatedAt: '2024-10-15T11:00:00Z',
      },
    ];

    const legacySystemInvoiceData = [
      {
        id: 'legacy-record-001',
        請求書ID: 'LEGACY-INV-2024-001',
        ユーザーID: 'user-customer-001',
        請求書番号: 'L-2024-0001',
        請求日: '2024-10-01T00:00:00Z',
        請求金額: 1000000,
        税金額: 100000,
        ステータス: 'issued',
        支払期限日: '2024-11-01T00:00:00Z',
        摘要: '2024年10月分サービス料金',
        作成日時: '2024-10-01T09:00:00Z',
        更新日時: '2024-10-01T09:00:00Z',
        検証ステータス: '未検証',
        検証日時: null,
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-10-01T09:00:00Z',
      },
    ];

    const newSystemInvoiceData = [
      {
        id: 'new-record-001',
        請求書ID: 'NEW-INV-2024-001',
        請求書番号: 'N-2024-0001',
        請求日: '2024-10-01T00:00:00Z',
        請求金額: 1005000,
        税金額: 100500,
        ステータス: 'issued',
        支払期限日: '2024-11-01T00:00:00Z',
        摘要: '2024年10月分サービス料金',
        createdAt: '2024-10-01T09:00:00Z',
        updatedAt: '2024-10-01T09:00:00Z',
      },
    ];

    const correctionTrackingData = [
      {
        id: 'correction-001',
        是正ID: 'correction-001',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        是正方法: 'manual_adjustment',
        是正ステータス: 'completed',
        是正実行者: 'user-002',
        是正実行日時: '2024-10-16T14:00:00Z',
        是正前データ: '{"請求金額": 1000000}',
        是正後データ: '{"請求金額": 1005000}',
        検証結果: 'success',
        createdAt: '2024-10-16T14:00:00Z',
        updatedAt: '2024-10-16T14:00:00Z',
      },
    ];

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockImplementation(async (tableName) => {
      if (tableName === '差異検出結果') return discrepancyDetectionData;
      if (tableName === '旧システム請求書') return legacySystemInvoiceData;
      if (tableName === '新システム請求書') return newSystemInvoiceData;
      if (tableName === '是正追跡管理') return correctionTrackingData;
      if (tableName === '差異確認履歴') return [];
      return [];
    });

    const result = (await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    })) as RetrieveDiscrepancyDetailsForConfirmationOutput;

    expect(result.confirmationHistory).toEqual([]);
    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.detectionDateTime).toBe('2024-10-15T10:30:00Z');
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('L-2024-0001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.newSystemInvoice?.invoiceNumber).toBe('N-2024-0001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1005000);
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionExecutorUserId).toBe('user-002');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('success');
  });
});
