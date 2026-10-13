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

describe('SCEN-221: 差異確認履歴が複数件存在する場合、すべてのレコードが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('差異確認履歴が3件の場合、すべてのレコードが返される', async () => {
    const discrepancyId = '550e8400-e29b-41d4-a716-446655440000';

    const discrepancyDetectionData = [
      {
        id: '550e8400-e29b-41d4-a716-446655440000',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        旧システム請求書ID: 'LEGACY-INV-2024-001',
        新システム請求書ID: 'NEW-INV-2024-001',
        差異種類: '金額差異',
        差異内容: '請求金額が異なる',
        金額差異: 50000,
        件数差異: 0,
        ステータス差異: null,
        検出日時: '2024-01-15T10:30:00Z',
        重大度: '高',
        原因分類: '消費税計算誤り',
        許容範囲判定: '範囲外',
        判定日時: '2024-01-15T11:00:00Z',
        判定者: 'user-uuid-001',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
      },
    ];

    const legacySystemInvoiceData = [
      {
        id: 'legacy-rec-001',
        請求書ID: 'LEGACY-INV-2024-001',
        ユーザーID: 'user-001',
        請求書番号: 'LG-20240115-001',
        請求日: '2024-01-15T00:00:00Z',
        請求金額: 1050000,
        税金額: 105000,
        ステータス: '請求済み',
        支払期限日: '2024-02-15T00:00:00Z',
        摘要: 'サービス利用料 2024年1月',
        作成日時: '2024-01-15T09:00:00Z',
        更新日時: '2024-01-15T09:00:00Z',
        検証ステータス: '検証待ち',
        検証日時: null,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
      },
    ];

    const newSystemInvoiceData = [
      {
        id: 'new-rec-001',
        請求書ID: 'NEW-INV-2024-001',
        請求書番号: 'NW-20240115-001',
        請求日: '2024-01-15T00:00:00Z',
        請求金額: 1000000,
        税金額: 100000,
        ステータス: '請求済み',
        支払期限日: '2024-02-15T00:00:00Z',
        摘要: 'サービス利用料 2024年1月',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
      },
    ];

    const correctionTrackingData = [
      {
        id: 'correction-rec-001',
        是正ID: '550e8400-e29b-41d4-a716-446655440001',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        是正方法: 'マスタ修正',
        是正ステータス: '完了',
        是正実行者: 'user-uuid-002',
        是正実行日時: '2024-01-16T14:30:00Z',
        是正前データ: '{"taxRate": 0.1}',
        是正後データ: '{"taxRate": 0.08}',
        検証結果: '成功',
        createdAt: '2024-01-16T14:30:00Z',
        updatedAt: '2024-01-16T14:30:00Z',
      },
      {
        id: 'correction-rec-002',
        是正ID: '550e8400-e29b-41d4-a716-446655440002',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        是正方法: 'データ転記',
        是正ステータス: '完了',
        是正実行者: 'user-uuid-003',
        是正実行日時: '2024-01-17T09:15:00Z',
        是正前データ: '{"amount": 1000000}',
        是正後データ: '{"amount": 1050000}',
        検証結果: '成功',
        createdAt: '2024-01-17T09:15:00Z',
        updatedAt: '2024-01-17T09:15:00Z',
      },
    ];

    const confirmationHistoryData = [
      {
        id: 'confirm-rec-001',
        確認ID: '550e8400-e29b-41d4-a716-446655440003',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        確認ユーザーID: 'user-uuid-004',
        確認日時: '2024-01-18T10:00:00Z',
        確認内容: '是正内容を確認し、承認します。',
        判定結果: '承認',
        createdAt: '2024-01-18T10:00:00Z',
        updatedAt: '2024-01-18T10:00:00Z',
      },
      {
        id: 'confirm-rec-002',
        確認ID: '550e8400-e29b-41d4-a716-446655440004',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        確認ユーザーID: 'user-uuid-005',
        確認日時: '2024-01-19T13:45:00Z',
        確認内容: '追加検証を実施し、差異が解消されたことを確認しました。',
        判定結果: '承認',
        createdAt: '2024-01-19T13:45:00Z',
        updatedAt: '2024-01-19T13:45:00Z',
      },
      {
        id: 'confirm-rec-003',
        確認ID: '550e8400-e29b-41d4-a716-446655440005',
        差異ID: '550e8400-e29b-41d4-a716-446655440000',
        確認ユーザーID: 'user-uuid-006',
        確認日時: '2024-01-20T15:20:00Z',
        確認内容: '最終確認。すべての是正手続きが完了したことを確認します。',
        判定結果: '承認',
        createdAt: '2024-01-20T15:20:00Z',
        updatedAt: '2024-01-20T15:20:00Z',
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

    expect(result.confirmationHistory).toHaveLength(3);

    expect(result.confirmationHistory[0].confirmationUserId).toBe('user-uuid-004');
    expect(result.confirmationHistory[0].confirmationDateTime).toBe('2024-01-18T10:00:00Z');
    expect(result.confirmationHistory[0].judgmentResult).toBe('承認');
    expect(result.confirmationHistory[0].confirmationContent).toBe('是正内容を確認し、承認します。');

    expect(result.confirmationHistory[1].confirmationUserId).toBe('user-uuid-005');
    expect(result.confirmationHistory[1].confirmationDateTime).toBe('2024-01-19T13:45:00Z');
    expect(result.confirmationHistory[1].judgmentResult).toBe('承認');
    expect(result.confirmationHistory[1].confirmationContent).toBe('追加検証を実施し、差異が解消されたことを確認しました。');

    expect(result.confirmationHistory[2].confirmationUserId).toBe('user-uuid-006');
    expect(result.confirmationHistory[2].confirmationDateTime).toBe('2024-01-20T15:20:00Z');
    expect(result.confirmationHistory[2].judgmentResult).toBe('承認');
    expect(result.confirmationHistory[2].confirmationContent).toBe('最終確認。すべての是正手続きが完了したことを確認します。');

    expect(result.discrepancyId).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});
