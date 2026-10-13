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

describe('SCEN-220: 是正追跡管理履歴が複数件存在する場合、すべてのレコードが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('是正追跡管理履歴が3件の場合、すべてのレコードが返される', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEG-INV-001',
        新システム請求書ID: 'NEW-INV-001',
        差異種類: '金額差異',
        差異内容: '請求金額が異なる',
        金額差異: 5000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2026-01-15T10:30:00Z',
        重大度: '高',
        原因分類: '税計算誤差',
        許容範囲判定: '範囲外',
        判定日時: '2026-01-15T11:00:00Z',
        判定者: 'user-001',
        createdAt: '2026-01-15T10:30:00Z',
        updatedAt: '2026-01-15T11:00:00Z',
      },
    ];

    const legacySystemInvoiceData = [
      {
        id: 'leg-invoice-id-001',
        請求書ID: 'LEG-INV-001',
        ユーザーID: 'user-cust-001',
        請求書番号: 'LEG-2026-001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 100000,
        税金額: 10000,
        ステータス: '発行済み',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '2026年1月分商品代金',
        作成日時: '2026-01-10T09:00:00Z',
        更新日時: '2026-01-10T09:00:00Z',
        検証ステータス: '未検証',
        検証日時: null,
      },
    ];

    const newSystemInvoiceData = [
      {
        id: 'new-invoice-id-001',
        請求書ID: 'NEW-INV-001',
        請求書番号: 'NEW-2026-001',
        請求日: '2026-01-10T00:00:00Z',
        請求金額: 105000,
        税金額: 10500,
        ステータス: '発行済み',
        支払期限日: '2026-02-10T00:00:00Z',
        摘要: '2026年1月分商品代金',
      },
    ];

    const correctionTrackingData = [
      {
        id: 'correction-001',
        是正ID: 'corr-id-001',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        是正方法: 'マニュアル修正',
        是正ステータス: '完了',
        是正実行者: 'user-admin-001',
        是正実行日時: '2026-01-16T14:00:00Z',
        是正前データ: '{"金額": 100000}',
        是正後データ: '{"金額": 105000}',
        検証結果: '成功',
        createdAt: '2026-01-16T14:00:00Z',
        updatedAt: '2026-01-16T14:00:00Z',
      },
      {
        id: 'correction-002',
        是正ID: 'corr-id-002',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        是正方法: '自動同期',
        是正ステータス: '実行中',
        是正実行者: 'system-user',
        是正実行日時: '2026-01-16T15:30:00Z',
        是正前データ: '{"税金額": 10000}',
        是正後データ: '{"税金額": 10500}',
        検証結果: '実行中',
        createdAt: '2026-01-16T15:30:00Z',
        updatedAt: '2026-01-16T15:30:00Z',
      },
      {
        id: 'correction-003',
        是正ID: 'corr-id-003',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        是正方法: 'データ再取得',
        是正ステータス: '完了',
        是正実行者: 'user-admin-002',
        是正実行日時: '2026-01-17T09:00:00Z',
        是正前データ: '{"ステータス": "未確認"}',
        是正後データ: '{"ステータス": "確認済み"}',
        検証結果: '成功',
        createdAt: '2026-01-17T09:00:00Z',
        updatedAt: '2026-01-17T09:00:00Z',
      },
    ];

    const confirmationHistoryData = [
      {
        id: 'confirm-001',
        確認ID: 'conf-id-001',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        確認ユーザーID: 'user-reviewer-001',
        確認日時: '2026-01-16T16:00:00Z',
        確認内容: '是正方法を確認し承認',
        判定結果: '承認',
        createdAt: '2026-01-16T16:00:00Z',
        updatedAt: '2026-01-16T16:00:00Z',
      },
      {
        id: 'confirm-002',
        確認ID: 'conf-id-002',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        確認ユーザーID: 'user-reviewer-002',
        確認日時: '2026-01-17T10:00:00Z',
        確認内容: '是正結果を検証',
        判定結果: '完了確認',
        createdAt: '2026-01-17T10:00:00Z',
        updatedAt: '2026-01-17T10:00:00Z',
      },
    ];

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    mockListRecords.mockImplementation(async (tableName) => {
      if (tableName === '差異検出結果') return discrepancyDetectionData;
      if (tableName === '旧システム請求書') return legacySystemInvoiceData;
      if (tableName === '新システム請求書') return newSystemInvoiceData;
      if (tableName === '是正追跡管理') return correctionTrackingData;
      if (tableName === '差異確認履歴') return confirmationHistoryData;
      return [];
    });

    const result = (await retrieveDiscrepancyDetailsForConfirmation({
      discrepancyId,
    })) as RetrieveDiscrepancyDetailsForConfirmationOutput;

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.correctionTrackingHistory).toHaveLength(3);

    expect(result.correctionTrackingHistory[0].correctionId).toBe('corr-id-001');
    expect(result.correctionTrackingHistory[0].correctionMethod).toBe('マニュアル修正');
    expect(result.correctionTrackingHistory[0].correctionStatus).toBe('完了');
    expect(result.correctionTrackingHistory[0].correctionExecutorUserId).toBe('user-admin-001');
    expect(result.correctionTrackingHistory[0].verificationResult).toBe('成功');

    expect(result.correctionTrackingHistory[1].correctionId).toBe('corr-id-002');
    expect(result.correctionTrackingHistory[1].correctionMethod).toBe('自動同期');
    expect(result.correctionTrackingHistory[1].correctionStatus).toBe('実行中');
    expect(result.correctionTrackingHistory[1].correctionExecutorUserId).toBe('system-user');
    expect(result.correctionTrackingHistory[1].verificationResult).toBe('実行中');

    expect(result.correctionTrackingHistory[2].correctionId).toBe('corr-id-003');
    expect(result.correctionTrackingHistory[2].correctionMethod).toBe('データ再取得');
    expect(result.correctionTrackingHistory[2].correctionStatus).toBe('完了');
    expect(result.correctionTrackingHistory[2].correctionExecutorUserId).toBe('user-admin-002');
    expect(result.correctionTrackingHistory[2].verificationResult).toBe('成功');

    expect(result.discrepancyDetection.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.discrepancyDetection.legacySystemInvoiceId).toBe('LEG-INV-001');
    expect(result.discrepancyDetection.discrepancyType).toBe('金額差異');
    expect(result.discrepancyDetection.amountDifference).toBe(5000);
    expect(result.discrepancyDetection.severity).toBe('高');

    expect(result.legacySystemInvoice?.invoiceId).toBe('LEG-INV-001');
    expect(result.legacySystemInvoice?.invoiceAmount).toBe(100000);
    expect(result.legacySystemInvoice?.taxAmount).toBe(10000);

    expect(result.newSystemInvoice?.invoiceId).toBe('NEW-INV-001');
    expect(result.newSystemInvoice?.invoiceAmount).toBe(105000);
    expect(result.newSystemInvoice?.taxAmount).toBe(10500);

    expect(result.confirmationHistory).toHaveLength(2);
  });
});
