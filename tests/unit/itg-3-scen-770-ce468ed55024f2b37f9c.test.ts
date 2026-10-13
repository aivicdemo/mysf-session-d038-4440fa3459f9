import { retrieveDiscrepancyDetailsForConfirmation } from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-770: 請求書のステータスが不整合な場合、その詳細がレポートに記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異検出結果からステータス差異、旧システムと新システム請求書データ、是正追跡管理履歴、差異確認履歴を取得して整形して返す', async () => {
    const discrepancyId = 'd550e8c4-e29f-41e0-9511-d3257588d18c';

    const discrepancyDetectionData = [
      {
        id: 'd550e8c4-e29f-41e0-9511-d3257588d18c',
        旧システム請求書ID: 'INV-OLD-2024-001',
        新システム請求書ID: 'INV-NEW-2024-001',
        差異種類: 'ステータス差異',
        差異内容: '請求書のステータスが不一致。旧システムでは『未支払』、新システムでは『支払済』に記録されている。',
        金額差異: 0,
        件数差異: 0,
        ステータス差異: '未支払→支払済',
        検出日時: '2025-01-15T10:30:00Z',
        重大度: '高',
        原因分類: 'データ同期遅延',
        許容範囲判定: '範囲外',
        判定日時: '2025-01-15T11:00:00Z',
        判定者: 'u-validator-001',
        createdAt: '2025-01-15T10:30:00Z',
        updatedAt: '2025-01-15T11:00:00Z',
      },
    ];

    const legacyInvoiceData = [
      {
        id: 'INV-OLD-2024-001',
        請求書ID: 'INV-OLD-2024-001',
        ユーザーID: 'user-12345',
        請求書番号: 'OLD-2024-0001',
        請求日: '2025-01-10T09:00:00Z',
        請求金額: 150000,
        税金額: 15000,
        ステータス: '未支払',
        支払期限日: '2025-02-10T23:59:59Z',
        摘要: '2025年1月度サービス利用料',
        作成日時: '2025-01-10T09:00:00Z',
        更新日時: '2025-01-10T09:00:00Z',
        検証ステータス: '検証済',
        検証日時: '2025-01-10T10:00:00Z',
        createdAt: '2025-01-10T09:00:00Z',
        updatedAt: '2025-01-10T09:00:00Z',
      },
    ];

    const newInvoiceData = [
      {
        id: 'INV-NEW-2024-001',
        請求書ID: 'INV-NEW-2024-001',
        請求書番号: 'NEW-2024-0001',
        請求日: '2025-01-10T09:00:00Z',
        請求金額: 150000,
        税金額: 15000,
        ステータス: '支払済',
        支払期限日: '2025-02-10T23:59:59Z',
        摘要: '2025年1月度サービス利用料',
        createdAt: '2025-01-10T09:00:00Z',
        updatedAt: '2025-01-14T14:30:00Z',
      },
    ];

    const correctionData = [
      {
        id: 'corr-001',
        是正ID: 'corr-001',
        差異ID: 'd550e8c4-e29f-41e0-9511-d3257588d18c',
        是正方法: '旧システムステータス更新',
        是正ステータス: '実行済',
        是正実行者: 'u-corrector-002',
        是正実行日時: '2025-01-15T13:00:00Z',
        是正前データ: '{"status": "未支払"}',
        是正後データ: '{"status": "支払済"}',
        検証結果: '合致',
        createdAt: '2025-01-15T13:00:00Z',
        updatedAt: '2025-01-15T14:00:00Z',
      },
    ];

    const confirmationData = [
      {
        id: 'conf-001',
        確認ID: 'conf-001',
        差異ID: 'd550e8c4-e29f-41e0-9511-d3257588d18c',
        確認ユーザーID: 'u-reviewer-003',
        確認日時: '2025-01-15T15:30:00Z',
        確認内容: '是正前後のステータス確認完了。旧システムの同期遅延が原因と判定。新システムのステータスが正しい状態を確認。',
        判定結果: '承認',
        createdAt: '2025-01-15T15:30:00Z',
        updatedAt: '2025-01-15T15:30:00Z',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockImplementation((tableName: string) => {
      if (tableName === '差異検出結果') return Promise.resolve(discrepancyDetectionData);
      if (tableName === '旧システム請求書') return Promise.resolve(legacyInvoiceData);
      if (tableName === '新システム請求書') return Promise.resolve(newInvoiceData);
      if (tableName === '是正追跡管理') return Promise.resolve(correctionData);
      if (tableName === '差異確認履歴') return Promise.resolve(confirmationData);
      return Promise.resolve([]);
    });

    const result = await retrieveDiscrepancyDetailsForConfirmation({ discrepancyId });

    expect(result.discrepancyId).toBe('d550e8c4-e29f-41e0-9511-d3257588d18c');
    expect(result.discrepancyDetection).toMatchObject({
      差異種類: 'ステータス差異',
      差異内容: '請求書のステータスが不一致。旧システムでは『未支払』、新システムでは『支払済』に記録されている。',
      ステータス差異: '未支払→支払済',
      重大度: '高',
      原因分類: 'データ同期遅延',
      許容範囲判定: '範囲外',
      検出日時: '2025-01-15T10:30:00Z',
      判定日時: '2025-01-15T11:00:00Z',
      判定者: 'u-validator-001',
    });
    expect(result.legacySystemInvoice).toMatchObject({
      請求書番号: 'OLD-2024-0001',
      請求日: '2025-01-10T09:00:00Z',
      請求金額: 150000,
      税金額: 15000,
      ステータス: '未支払',
      支払期限日: '2025-02-10T23:59:59Z',
      摘要: '2025年1月度サービス利用料',
    });
    expect(result.newSystemInvoice).toMatchObject({
      請求書番号: 'NEW-2024-0001',
      請求日: '2025-01-10T09:00:00Z',
      請求金額: 150000,
      税金額: 15000,
      ステータス: '支払済',
      支払期限日: '2025-02-10T23:59:59Z',
      摘要: '2025年1月度サービス利用料',
    });
    expect(result.correctionTrackingHistory).toHaveLength(1);
    expect(result.correctionTrackingHistory[0]).toMatchObject({
      是正方法: '旧システムステータス更新',
      是正ステータス: '実行済',
      是正実行者: 'u-corrector-002',
      是正実行日時: '2025-01-15T13:00:00Z',
      是正前データ: '{"status": "未支払"}',
      是正後データ: '{"status": "支払済"}',
      検証結果: '合致',
    });
    expect(result.confirmationHistory).toHaveLength(1);
    expect(result.confirmationHistory[0]).toMatchObject({
      確認ユーザーID: 'u-reviewer-003',
      確認日時: '2025-01-15T15:30:00Z',
      確認内容: '是正前後のステータス確認完了。旧システムの同期遅延が原因と判定。新システムのステータスが正しい状態を確認。',
      判定結果: '承認',
    });
  });
});
