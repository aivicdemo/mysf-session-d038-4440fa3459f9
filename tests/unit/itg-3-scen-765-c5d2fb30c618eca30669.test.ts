import { jest } from '@jest/globals';
import {
  retrieveDiscrepancyDetailsForConfirmation,
  NewInvoiceNotFoundError,
  type RetrieveDiscrepancyDetailsForConfirmationInput,
} from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-765: 新システムの請求データが空またはnullの場合、エラーメッセージが返され検証が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NewInvoiceNotFoundError when new system invoice data is all null or empty', async () => {
    const discrepancyId = 'diff-12345-uuid';
    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId,
    };

    const discrepancyDetectionRecord = {
      差異ID: 'diff-12345-uuid',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '請求金額が一致しません',
      金額差異: 5000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2026-01-15T10:30:00Z',
      重大度: '高',
      原因分類: '計算誤り',
      許容範囲判定: '範囲外',
      判定日時: '2026-01-15T10:35:00Z',
      判定者: 'user-judge-uuid',
    };

    const legacySystemInvoiceRecord = {
      請求書ID: 'legacy-inv-001',
      ユーザーID: 'customer-001',
      請求書番号: 'LEG-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: 100000,
      税金額: 10000,
      ステータス: '確定',
      支払期限日: '2026-02-10T00:00:00Z',
      摘要: '商品A、商品B',
    };

    const newSystemInvoiceRecordWithNulls = {
      請求書ID: 'new-inv-001',
      請求書番号: 'NEW-2026-001',
      請求日: '2026-01-10T00:00:00Z',
      請求金額: null,
      税金額: null,
      ステータス: null,
      支払期限日: null,
      摘要: null,
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((table: string) => {
      if (table === '差異検出結果') {
        return Promise.resolve([discrepancyDetectionRecord]);
      }
      if (table === '旧システム請求書') {
        return Promise.resolve([legacySystemInvoiceRecord]);
      }
      if (table === '新システム請求書') {
        return Promise.resolve([newSystemInvoiceRecordWithNulls]);
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
