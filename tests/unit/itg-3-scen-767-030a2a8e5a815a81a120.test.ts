import { jest } from '@jest/globals';
import {
  retrieveDiscrepancyDetailsForConfirmation,
  NewInvoiceNotFoundError,
  type RetrieveDiscrepancyDetailsForConfirmationInput,
} from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-767: 旧新システムで対応する請求書が見つからない場合、警告メッセージが記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NewInvoiceNotFoundError when new system invoice is not found (ID is null)', async () => {
    const discrepancyId = 'diff-2024-001-uuid';
    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId,
    };

    const discrepancyDetectionRecord = {
      id: 'diff-2024-001-uuid',
      差異ID: 'diff-2024-001-uuid',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: null,
      差異種類: '請求書不整合',
      差異内容: '新システム請求書が見つからない',
      金額差異: 150000,
      件数差異: 1,
      ステータス差異: null,
      検出日時: '2024-01-15T10:30:00Z',
      重大度: 'CRITICAL',
      原因分類: 'データ移行漏れ',
      許容範囲判定: 'NG',
      判定日時: '2024-01-15T10:35:00Z',
      判定者: 'user-uuid-001',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-15T10:35:00Z',
    };

    const legacySystemInvoiceRecord = {
      id: 'legacy-inv-001',
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'user-001',
      請求書番号: 'INV-2024-0001',
      請求日: '2024-01-10T00:00:00Z',
      請求金額: 150000,
      税金額: 15000,
      ステータス: 'issued',
      支払期限日: '2024-02-10T00:00:00Z',
      摘要: 'サービス提供分',
      作成日時: '2024-01-10T09:00:00Z',
      更新日時: '2024-01-10T09:00:00Z',
      検証ステータス: 'pending',
      検証日時: null,
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-10T09:00:00Z',
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((table: string) => {
      if (table === '差異検出結果') {
        return Promise.resolve([discrepancyDetectionRecord]);
      }
      if (table === '旧システム請求書') {
        return Promise.resolve([legacySystemInvoiceRecord]);
      }
      if (table === '新システム請求書') {
        return Promise.resolve([]);
      }
      if (table === '是正追跡管理履歴') {
        return Promise.resolve([]);
      }
      if (table === '差異確認履歴') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    await expect(
      retrieveDiscrepancyDetailsForConfirmation(input)
    ).rejects.toThrow(NewInvoiceNotFoundError);
  });
});
