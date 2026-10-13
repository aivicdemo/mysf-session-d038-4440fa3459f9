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

describe('SCEN-218: 是正追跡管理履歴が0件の場合、空の配列で返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('是正追跡管理履歴が0件の場合、空の配列で返される', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEGACY-INV-001',
        新システム請求書ID: 'NEW-INV-001',
        差異種類: '金額差異',
        差異内容: '税金額の計算ロジック差異により税額が異なる',
        金額差異: 5000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2025-01-15T10:30:00Z',
        重大度: '高',
        原因分類: 'ロジック差異',
        許容範囲判定: '範囲外',
        判定日時: '2025-01-15T11:00:00Z',
        判定者: 'a0000000-0000-0000-0000-000000000001',
      },
    ];

    const legacySystemInvoiceData = [
      {
        id: 'legacy-inv-id-001',
        請求書ID: 'LEGACY-INV-001',
        ユーザーID: 'USER-001',
        請求書番号: 'LEG-2025-0001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '確定',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: '2025年1月度請求',
        作成日時: '2025-01-10T09:00:00Z',
        更新日時: '2025-01-10T09:00:00Z',
        検証ステータス: '検証済み',
        検証日時: '2025-01-10T14:00:00Z',
      },
    ];

    const newSystemInvoiceData = [
      {
        id: 'new-inv-id-001',
        請求書ID: 'NEW-INV-001',
        請求書番号: 'NEW-2025-0001',
        請求日: '2025-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 15000,
        ステータス: '確定',
        支払期限日: '2025-02-10T00:00:00Z',
        摘要: '2025年1月度請求',
      },
    ];

    const confirmationHistoryData = [
      {
        id: 'confirm-id-001',
        確認ID: 'b0000000-0000-0000-0000-000000000001',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        確認ユーザーID: 'a0000000-0000-0000-0000-000000000001',
        確認日時: '2025-01-15T15:30:00Z',
        確認内容: '税金額計算ロジックの差異を確認。新システム側の計算が正当であることを検証。',
        判定結果: '是正対象',
      },
    ];

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockImplementation(async (tableName) => {
      if (tableName === '差異検出結果') return discrepancyDetectionData;
      if (tableName === '旧システム請求書') return legacySystemInvoiceData;
      if (tableName === '新システム請求書') return newSystemInvoiceData;
      if (tableName === '是正追跡管理') return [];
      if (tableName === '差異確認履歴') return confirmationHistoryData;
      return [];
    });

    const result = (await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    })) as RetrieveDiscrepancyDetailsForConfirmationOutput;

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.discrepancyDetection.detectionDateTime).toBe('2025-01-15T10:30:00Z');
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.causeClassification).toBe('ロジック差異');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LEG-2025-0001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(100000);
    expect(result.legacySystemInvoice?.taxAmount).toBe(10000);
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-2025-0001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(100000);
    expect(result.newSystemInvoice?.taxAmount).toBe(15000);
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].confirmationContent).toBe('税金額計算ロジックの差異を確認。新システム側の計算が正当であることを検証。');
  });
});
