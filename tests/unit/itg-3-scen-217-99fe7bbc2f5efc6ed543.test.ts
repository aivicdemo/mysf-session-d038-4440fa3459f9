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

describe('SCEN-217: 新システム請求書データが存在しない場合、出力のnewSystemInvoiceフィールドがnullで返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('新システム請求書データが存在しない場合、newSystemInvoiceがnullで返される', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEGACY-INV-2024-001',
        新システム請求書ID: null,
        差異種類: '金額差異',
        差異内容: '請求金額が一致しない',
        金額差異: 5000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2024-01-15T10:30:00Z',
        重大度: '高',
        原因分類: '計算誤り',
        許容範囲判定: '外',
        判定日時: '2024-01-15T11:00:00Z',
        判定者: '660e8400-e29b-41d4-a716-446655440000',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
      },
    ];

    const legacySystemInvoiceData = [
      {
        id: 'legacy-inv-record-001',
        請求書ID: 'LEGACY-INV-2024-001',
        ユーザーID: 'USER-001',
        請求書番号: 'INV-2024-001',
        請求日: '2024-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '確定',
        支払期限日: '2024-02-10T00:00:00Z',
        摘要: 'システムA請求',
        作成日時: '2024-01-10T09:00:00Z',
        更新日時: '2024-01-10T09:00:00Z',
        検証ステータス: '未検証',
        検証日時: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-10T09:00:00Z',
      },
    ];

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockImplementation(async (tableName) => {
      if (tableName === '差異検出結果') return discrepancyDetectionData;
      if (tableName === '旧システム請求書') return legacySystemInvoiceData;
      if (tableName === '新システム請求書') return [];
      if (tableName === '是正追跡管理') return [];
      if (tableName === '差異確認履歴') return [];
      return [];
    });

    const result = (await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    })) as RetrieveDiscrepancyDetailsForConfirmationOutput;

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.newSystemInvoice).toBeNull();
    expect(result.legacySystemInvoice).toBeDefined();
    expect(result.legacySystemInvoice?.invoiceId).toBe('LEGACY-INV-2024-001');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('INV-2024-001');
    expect(result.legacySystemInvoice?.invoiceDate).toBe('2024-01-10T00:00:00Z');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(100000);
    expect(result.legacySystemInvoice?.taxAmount).toBe(10000);
    expect(result.legacySystemInvoice?.status).toBe('確定');
    expect(result.legacySystemInvoice?.paymentDueDate).toBe('2024-02-10T00:00:00Z');
    expect(result.legacySystemInvoice?.remarks).toBe('システムA請求');
    expect(result.discrepancyDetection.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.legacySystemInvoiceId).toBe('LEGACY-INV-2024-001');
    expect(result.discrepancyDetection.newSystemInvoiceId).toBeNull();
    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.discrepancyContent).toBe('請求金額が一致しない');
    expect(result.discrepancyDetection.amountDifference).toBe(5000);
    expect(result.discrepancyDetection.countDifference).toBe(0);
    expect(result.discrepancyDetection.statusDifference).toBeNull();
    expect(result.discrepancyDetection.detectionDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.causeClassification).toBe('計算誤り');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('外');
    expect(result.discrepancyDetection.toleranceJudgmentDateTime).toBe('2024-01-15T11:00:00Z');
    expect(result.discrepancyDetection.judgedByUserId).toBe('660e8400-e29b-41d4-a716-446655440000');
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
