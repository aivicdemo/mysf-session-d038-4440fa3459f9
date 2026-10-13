import { jest } from '@jest/globals';
import {
  retrieveDiscrepancyDetailsForConfirmation,
  type RetrieveDiscrepancyDetailsForConfirmationInput,
  type RetrieveDiscrepancyDetailsForConfirmationOutput,
} from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-769: 請求明細の件数が不一致な請求書が検出された場合、その詳細がレポートに記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve discrepancy details with count difference when line items mismatch', async () => {
    const discrepancyId = 'd550e8fc-4b45-4c2a-9f6e-2a1b3c4d5e6f';
    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId,
    };

    const discrepancyDetectionRecord = {
      id: 'd550e8fc-4b45-4c2a-9f6e-2a1b3c4d5e6f',
      旧システム請求書ID: 'LEG-INV-202501-001',
      新システム請求書ID: 'NEW-INV-202501-001',
      差異種類: '件数差異',
      差異内容: '請求明細の件数が不一致。旧システム：5件、新システム：3件',
      金額差異: 0,
      件数差異: 2,
      ステータス差異: null,
      検出日時: '2025-01-15T10:30:00Z',
      重大度: 'HIGH',
      原因分類: 'データ漏損',
      許容範囲判定: 'OUT_OF_RANGE',
      判定日時: '2025-01-15T11:00:00Z',
      判定者: 'a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6',
      createdAt: '2025-01-15T10:30:00Z',
      updatedAt: '2025-01-15T11:00:00Z',
    };

    const legacySystemInvoiceRecord = {
      id: 'leg-record-001',
      請求書ID: 'LEG-INV-202501-001',
      ユーザーID: 'USR-00123',
      請求書番号: 'LEG-2025-00001',
      請求日: '2025-01-10T00:00:00Z',
      請求金額: 500000,
      税金額: 50000,
      ステータス: 'ISSUED',
      支払期限日: '2025-02-10T00:00:00Z',
      摘要: '商品A・B・C・D・Eの納品に関する請求（5件の明細行を含む）',
      作成日時: '2025-01-10T09:15:00Z',
      更新日時: '2025-01-10T09:15:00Z',
      検証ステータス: 'VERIFIED',
      検証日時: '2025-01-10T14:30:00Z',
      createdAt: '2025-01-10T09:15:00Z',
      updatedAt: '2025-01-10T09:15:00Z',
    };

    const newSystemInvoiceRecord = {
      id: 'new-record-001',
      請求書ID: 'NEW-INV-202501-001',
      請求書番号: 'NEW-2025-00001',
      請求日: '2025-01-10T00:00:00Z',
      請求金額: 500000,
      税金額: 50000,
      ステータス: 'ISSUED',
      支払期限日: '2025-02-10T00:00:00Z',
      摘要: '商品A・B・Cの納品に関する請求（3件の明細行のみ。D・Eが漏損）',
      createdAt: '2025-01-10T09:15:00Z',
      updatedAt: '2025-01-10T09:15:00Z',
    };

    const correctionTrackingRecord = {
      id: 'corr-001',
      差異ID: 'd550e8fc-4b45-4c2a-9f6e-2a1b3c4d5e6f',
      是正方法: 'MANUAL_DATA_ENTRY',
      是正ステータス: 'IN_PROGRESS',
      是正実行者: 'b2c3d4e5-f6a7-48b9-c0d1-e2f3g4h5i6j7',
      是正実行日時: '2025-01-15T14:20:00Z',
      是正前データ: '{"件数": 3}',
      是正後データ: '{"件数": 5}',
      検証結果: 'PENDING',
      createdAt: '2025-01-15T14:20:00Z',
      updatedAt: '2025-01-15T14:20:00Z',
    };

    const confirmationHistoryRecord = {
      id: 'conf-001',
      差異ID: 'd550e8fc-4b45-4c2a-9f6e-2a1b3c4d5e6f',
      確認ユーザーID: 'c3d4e5f6-a7b8-49c0-d1e2-f3g4h5i6j7k8',
      確認日時: '2025-01-15T12:45:00Z',
      確認内容: '差異の原因を旧システムのデータ漏損と判定。商品D・Eの明細行が新システムに未反映。',
      判定結果: 'CONFIRMED',
      createdAt: '2025-01-15T12:45:00Z',
      updatedAt: '2025-01-15T12:45:00Z',
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

    expect(result.discrepancyId).toBe('d550e8fc-4b45-4c2a-9f6e-2a1b3c4d5e6f');
    expect(result.discrepancyDetection).toBeDefined();
    expect(result.discrepancyDetection.discrepancyId).toBe('d550e8fc-4b45-4c2a-9f6e-2a1b3c4d5e6f');
    expect(result.discrepancyDetection.discrepancyType).toBe('件数差異');
    expect(result.discrepancyDetection.countDifference).toBe(2);
    expect(result.discrepancyDetection.severity).toBe('HIGH');
    expect(result.discrepancyDetection.causeClassification).toBe('データ漏損');
    expect(result.legacySystemInvoice).toBeDefined();
    expect(result.legacySystemInvoice?.invoiceId).toBe('LEG-INV-202501-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(500000);
    expect(result.newSystemInvoice).toBeDefined();
    expect(result.newSystemInvoice?.invoiceId).toBe('NEW-INV-202501-001');
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('MANUAL_DATA_ENTRY');
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0].judgmentResult).toBe('CONFIRMED');
  });
});
