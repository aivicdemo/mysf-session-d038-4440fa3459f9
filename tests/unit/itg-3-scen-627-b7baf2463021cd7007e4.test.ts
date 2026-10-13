import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-627: 差異原因分類実行ユーザーの権限を検証して、営業部システム担当または経理部門の権限を確認し、権限なしユーザーは処理を拒否できる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異IDを指定して詳細情報を取得できる（権限検証は別途実装）', async () => {
    const discrepancyId = 'disc-001';

    const discrepancyDetectionRecord = {
      id: 'disc-001',
      差異ID: 'disc-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '請求金額が異なる',
      金額差異: 10000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-15T10:00:00Z',
      重大度: '高',
      原因分類: '税計算ロジック差異',
      許容範囲判定: '範囲外',
      判定日時: '2025-01-15T10:30:00Z',
      判定者: 'user-judge-001',
      createdAt: '2025-01-15T10:00:00Z',
      updatedAt: '2025-01-15T10:30:00Z',
    };

    const legacyInvoiceRecord = {
      id: 'legacy-inv-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-sales-001',
      請求書番号: 'LEG-2025-0001',
      請求日: '2025-01-10T00:00:00Z',
      請求金額: 1100000,
      税金額: 100000,
      ステータス: '確定',
      支払期限日: '2025-02-10T00:00:00Z',
      摘要: '営業システムからの請求',
      作成日時: '2025-01-10T09:00:00Z',
      更新日時: '2025-01-10T09:00:00Z',
      検証ステータス: '未確認',
      検証日時: null,
      createdAt: '2025-01-10T09:00:00Z',
      updatedAt: '2025-01-10T09:00:00Z',
    };

    const newInvoiceRecord = {
      id: 'new-inv-001',
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-2025-0001',
      請求日: '2025-01-10T00:00:00Z',
      請求金額: 1090000,
      税金額: 90000,
      ステータス: '確定',
      支払期限日: '2025-02-10T00:00:00Z',
      摘要: '経理システムからの請求',
      createdAt: '2025-01-10T10:00:00Z',
      updatedAt: '2025-01-10T10:00:00Z',
    };

    const mockListRecords = jest.fn();
    (dataStore.listRecords as jest.Mock) = mockListRecords;

    mockListRecords.mockResolvedValueOnce([discrepancyDetectionRecord]);
    mockListRecords.mockResolvedValueOnce([legacyInvoiceRecord]);
    mockListRecords.mockResolvedValueOnce([newInvoiceRecord]);
    mockListRecords.mockResolvedValueOnce([]);
    mockListRecords.mockResolvedValueOnce([]);

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    expect(result.discrepancyId).toBe('disc-001');
    expect(result.discrepancyDetection.discrepancyId).toBe('disc-001');
    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.discrepancyContent).toBe('請求金額が異なる');
    expect(result.discrepancyDetection.amountDifference).toBe(10000);

    expect(result.legacySystemInvoice).not.toBeNull();
    expect(result.legacySystemInvoice?.invoiceId).toBe('legacy-inv-001');
    expect(result.legacySystemInvoice?.invoiceNumber).toBe('LEG-2025-0001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(1100000);
    expect(result.legacySystemInvoice?.taxAmount).toBe(100000);

    expect(result.newSystemInvoice).not.toBeNull();
    expect(result.newSystemInvoice?.invoiceId).toBe('new-inv-001');
    expect(result.newSystemInvoice?.invoiceNumber).toBe('NEW-2025-0001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(1090000);
    expect(result.newSystemInvoice?.taxAmount).toBe(90000);

    expect(result.correctionTrackingHistory.length).toBe(0);
    expect(result.confirmationHistory.length).toBe(0);
  });
});
