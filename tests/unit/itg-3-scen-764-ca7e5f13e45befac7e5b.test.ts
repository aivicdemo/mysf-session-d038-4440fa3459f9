import { jest } from '@jest/globals';
import {
  retrieveDiscrepancyDetailsForConfirmation,
  LegacyInvoiceNotFoundError,
  type RetrieveDiscrepancyDetailsForConfirmationInput,
} from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-764: 旧システムの請求データが空またはnullの場合、エラーメッセージが返され検証が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw LegacyInvoiceNotFoundError when legacy invoice data is empty', async () => {
    const discrepancyId = 'diff-uuid-12345';
    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId,
    };

    const discrepancyDetectionRecord = {
      差異ID: 'diff-uuid-12345',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '請求金額に不一致あり',
      金額差異: 5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2026-01-15T10:30:00Z',
      重大度: '高',
      原因分類: '系統移行エラー',
      許容範囲判定: '範囲外',
      判定日時: '2026-01-15T11:00:00Z',
      判定者: 'user-uuid-001',
    };

    const newSystemInvoiceRecord = {
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 100000,
      税金額: 10000,
      ステータス: '発行済',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '商品販売',
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((table: string) => {
      if (table === '差異検出結果') {
        return Promise.resolve([discrepancyDetectionRecord]);
      }
      if (table === '旧システム請求書') {
        return Promise.resolve([]);
      }
      if (table === '新システム請求書') {
        return Promise.resolve([newSystemInvoiceRecord]);
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
    ).rejects.toThrow(LegacyInvoiceNotFoundError);
  });
});
