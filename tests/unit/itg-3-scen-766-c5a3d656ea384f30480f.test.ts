import { jest } from '@jest/globals';
import {
  retrieveDiscrepancyDetailsForConfirmation,
  type RetrieveDiscrepancyDetailsForConfirmationInput,
} from '../../src/logic/discrepancy-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-766: 請求書の許容範囲が負数の場合、エラーメッセージが返され検証が中止される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when tolerance judgment is negative number', async () => {
    const discrepancyId = 'diff-001';
    const input: RetrieveDiscrepancyDetailsForConfirmationInput = {
      discrepancyId,
    };

    const discrepancyDetectionRecord = {
      差異ID: 'diff-001',
      旧システム請求書ID: 'legacy-inv-001',
      新システム請求書ID: 'new-inv-001',
      差異種類: '金額差異',
      差異内容: '請求金額が一致しない',
      金額差異: 10000,
      件数差異: 0,
      ステータス差異: null,
      検出日時: '2025-01-15T10:30:00Z',
      重大度: '高',
      原因分類: '税金計算エラー',
      許容範囲判定: '-500',
      判定日時: '2025-01-15T11:00:00Z',
      判定者: 'user-001',
    };

    (dataStore.listRecords as jest.Mock).mockImplementation((table: string) => {
      if (table === '差異検出結果') {
        return Promise.resolve([discrepancyDetectionRecord]);
      }
      return Promise.resolve([]);
    });

    await expect(
      retrieveDiscrepancyDetailsForConfirmation(input)
    ).rejects.toThrow();
  });
});
