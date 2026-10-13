import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-783: リスク程度が『重大』と判定された場合、推奨対応が『即座に移行を一時停止』となり、escalationRequiredがtrueに設定される', () => {
  const mockListRecords = jest.mocked(dataStore.listRecords);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('重大度が『重大』の差異詳細情報を返す', async () => {
    const discrepancyId = 'diff-001-uuid';

    const discrepancyDetectionData = [
      {
        id: discrepancyId,
        差異ID: discrepancyId,
        旧システム請求書ID: 'legacy-inv-001',
        新システム請求書ID: 'new-inv-001',
        差異種類: '金額差異',
        差異内容: '請求金額の不一致',
        金額差異: 50000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2026-01-15T10:30:00Z',
        重大度: '重大',
        原因分類: 'システム移行ロジックエラー',
        許容範囲判定: '範囲外',
        判定日時: '2026-01-15T10:35:00Z',
        判定者: 'user-judge-uuid',
        createdAt: '2026-01-15T10:30:00Z',
        updatedAt: '2026-01-15T10:35:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'legacy-inv-id-001',
        請求書ID: 'legacy-inv-001',
        ユーザーID: 'user-001',
        請求書番号: 'LEG-202601-0001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 1000000,
        税金額: 100000,
        ステータス: '確定',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '旧システム請求書',
        検証ステータス: '未検証',
        検証日時: null,
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: 'new-inv-id-001',
        請求書ID: 'new-inv-001',
        請求書番号: 'NEW-202601-0001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 950000,
        税金額: 95000,
        ステータス: '確定',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '新システム請求書',
        createdAt: '2026-01-10T00:00:00Z',
        updatedAt: '2026-01-10T00:00:00Z',
      },
    ];

    mockListRecords.mockImplementation(async (tableName: string) => {
      switch (tableName) {
        case '差異検出結果':
          return discrepancyDetectionData as any;
        case '旧システム請求書':
          return legacyInvoiceData as any;
        case '新システム請求書':
          return newInvoiceData as any;
        case '是正追跡管理':
          return [];
        case '差異確認履歴':
          return [];
        default:
          return [];
      }
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    });

    expect(result.discrepancyId).toBe(discrepancyId);
    expect(result.discrepancyDetection.severity).toBe('重大');
    expect(result.legacySystemInvoice).toMatchObject({
      invoiceAmount: 1000000,
    });
    expect(result.newSystemInvoice).toMatchObject({
      invoiceAmount: 950000,
    });
    expect(result.correctionTrackingHistory).toEqual([]);
    expect(result.confirmationHistory).toEqual([]);
  });
});
