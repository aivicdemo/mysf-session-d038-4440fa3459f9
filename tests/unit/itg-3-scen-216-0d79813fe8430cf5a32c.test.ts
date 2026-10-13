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

describe('SCEN-216: 旧システム請求書データが存在しない場合、出力のlegacySystemInvoiceフィールドがnullで返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('旧システム請求書データが存在しない場合、legacySystemInvoiceがnullで返される', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: null,
        新システム請求書ID: 'NEW-INV-2024-001',
        差異種類: 'データ欠落',
        差異内容: '旧システム請求書データが存在しない',
        金額差異: 50000,
        件数差異: 1,
        ステータス差異: '未対応',
        検出日時: '2024-01-15T10:30:00Z',
        重大度: '高',
        原因分類: 'データ移行漏れ',
        許容範囲判定: '範囲外',
        判定日時: '2024-01-15T11:00:00Z',
        判定者: '550e8400-e29b-41d4-a716-446655440001',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
      },
    ];

    const newSystemInvoiceData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        請求書ID: 'NEW-INV-2024-001',
        請求書番号: 'INV-2024-001',
        請求日: '2024-01-10T00:00:00Z',
        請求金額: 150000,
        税金額: 15000,
        ステータス: '未払',
        支払期限日: '2024-02-10T00:00:00Z',
        摘要: 'サービス提供料金',
      },
    ];

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockImplementation(async (tableName) => {
      if (tableName === '差異検出結果') return discrepancyDetectionData;
      if (tableName === '旧システム請求書') return [];
      if (tableName === '新システム請求書') return newSystemInvoiceData;
      if (tableName === '是正追跡管理') return [];
      if (tableName === '差異確認履歴') return [];
      return [];
    });

    const result = (await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    })) as RetrieveDiscrepancyDetailsForConfirmationOutput;

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.legacySystemInvoice).toBeNull();
    expect(result.newSystemInvoice).toBeDefined();
    expect(result.newSystemInvoice?.invoiceNumber).toBe('INV-2024-001');
    expect(result.newSystemInvoice?.invoiceDate).toBe('2024-01-10T00:00:00Z');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(150000);
    expect(result.newSystemInvoice?.taxAmount).toBe(15000);
    expect(result.newSystemInvoice?.status).toBe('未払');
    expect(result.newSystemInvoice?.paymentDueDate).toBe('2024-02-10T00:00:00Z');
    expect(result.newSystemInvoice?.remarks).toBe('サービス提供料金');
    expect(result.discrepancyDetection.discrepancyType).toBe('データ欠落');
    expect(result.discrepancyDetection.discrepancyContent).toBe('旧システム請求書データが存在しない');
    expect(result.discrepancyDetection.amountDifference).toBe(50000);
    expect(result.discrepancyDetection.countDifference).toBe(1);
    expect(result.discrepancyDetection.statusDifference).toBe('未対応');
    expect(result.discrepancyDetection.detectionDateTime).toBe('2024-01-15T10:30:00Z');
    expect(result.discrepancyDetection.severity).toBe('高');
    expect(result.discrepancyDetection.causeClassification).toBe('データ移行漏れ');
    expect(result.discrepancyDetection.toleranceJudgment).toBe('範囲外');
    expect(result.discrepancyDetection.toleranceJudgmentDateTime).toBe('2024-01-15T11:00:00Z');
    expect(result.discrepancyDetection.judgedByUserId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
