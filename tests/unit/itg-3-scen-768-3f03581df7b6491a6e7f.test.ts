import { jest } from '@jest/globals';
import {
  retrieveDiscrepancyDetailsForConfirmation,
  type RetrieveDiscrepancyDetailsForConfirmationInput,
  type RetrieveDiscrepancyDetailsForConfirmationOutput,
} from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-768: 金額差異が許容範囲を超える請求書が複数検出された場合、各請求書の詳細と合計差分がレポートに集計される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve discrepancy details with correction tracking and confirmation history', async () => {
    const discrepancyId = 'diff-001';
    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId,
    };

    const discrepancyDetectionRecord = {
      id: 'diff-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '請求金額が異なる',
      金額差異: 15000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-15T10:30:00Z',
      重大度: '高',
      原因分類: '税金計算ロジック差異',
      許容範囲判定: '超過',
      判定日時: '2025-01-15T11:00:00Z',
      判定者: 'user-001',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T11:00:00Z',
    };

    const legacySystemInvoiceRecord = {
      id: 'legacy-inv-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-123',
      請求書番号: 'LEG-20250115-0001',
      請求日: '2025-01-10T00:00:00Z',
      請求金額: 1000000,
      税金額: 100000,
      ステータス: '請求済み',
      支払期限日: '2025-02-10T00:00:00Z',
      摘要: '1月分サービス利用料',
      作成日時: '2025-01-10T09:00:00Z',
      更新日時: '2025-01-10T09:00:00Z',
      検証ステータス: '確認中',
      検証日時: '2025-01-15T10:30:00Z',
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: '2025-01-10T09:00:00Z',
    };

    const newSystemInvoiceRecord = {
      id: 'new-inv-001',
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-20250115-0001',
      請求日: '2025-01-10T00:00:00Z',
      請求金額: 1015000,
      税金額: 101500,
      ステータス: '請求済み',
      支払期限日: '2025-02-10T00:00:00Z',
      摘要: '1月分サービス利用料',
      createdAt: '2025-01-10T09:30:00Z',
      updatedAt: '2025-01-10T09:30:00Z',
    };

    const correctionTrackingRecord = {
      id: 'corr-001',
      是正ID: 'corr-001',
      差異ID: 'diff-001',
      是正方法: 'システム設定修正',
      是正ステータス: '対応中',
      是正実行者: 'user-002',
      是正実行日時: '2025-01-15T12:00:00Z',
      是正前データ: '{"taxRate": 0.08}',
      是正後データ: '{"taxRate": 0.10}',
      検証結果: '成功',
      createdAt: '2025-01-15T12:00:00Z',
      updatedAt: '2025-01-15T12:00:00Z',
    };

    const confirmationHistoryRecord = {
      id: 'conf-001',
      確認ID: 'conf-001',
      差異ID: 'diff-001',
      確認ユーザーID: 'user-003',
      確認日時: '2025-01-15T13:00:00Z',
      確認内容: '税金計算ロジックの差異を確認。新システムの計算が正しいことを検証済み。',
      判定結果: '是正待ち',
      createdAt: '2025-01-15T13:00:00Z',
      updatedAt: '2025-01-15T13:00:00Z',
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((table: string) => {
      if (table === '差異検出結果') {
        return Promise.resolve([discrepancyDetectionRecord]);
      }
      if (table === '旧システム請求書') {
        return Promise.resolve([legacySystemInvoiceRecord]);
      }
      if (table === '新システム請求書') {
        return Promise.resolve([newSystemInvoiceRecord]);
      }
      if (table === '是正追跡管理履歴') {
        return Promise.resolve([correctionTrackingRecord]);
      }
      if (table === '差異確認履歴') {
        return Promise.resolve([confirmationHistoryRecord]);
      }
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation(input);

    expect(result.discrepancyId).toBe('diff-001');
    expect(result.discrepancyDetection).toBeDefined();
    expect(result.discrepancyDetection.discrepancyId).toBe('diff-001');
    expect(result.discrepancyDetection.amountDifference).toBe(15000);
    expect(result.legacySystemInvoice).toBeDefined();
    expect(result.legacySystemInvoice?.invoiceId).toBe('legacy-inv-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1000000);
    expect(result.newSystemInvoice).toBeDefined();
    expect(result.newSystemInvoice?.invoiceId).toBe('new-inv-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1015000);
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.confirmationHistory).toHaveLength(1);
  });
});
