import { deleteMappingValidationResult } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-223: 指定されたマッピング検証結果が存在し、プロジェクトIDが一致する場合、レコードが削除され成功する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('マッピング検証結果レコードが削除される', async () => {
    const validationResultId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = 'bb0e8400-e29b-41d4-a716-446655440006';
    const operationTimestamp = '2026-01-15T11:00:00Z';

    // 前提：マッピング検証結果レコードが存在し、プロジェクトIDが一致
    const existingRecord = {
      マッピング検証結果ID: validationResultId,
      移行プロジェクトID: projectId,
      機能マッピング詳細ID: '770e8400-e29b-41d4-a716-446655440002',
      検証ステータス: '完了',
      検証日時: '2026-01-15T10:30:00Z',
      検証者ID: '880e8400-e29b-41d4-a716-446655440003',
      検出問題: '請求書カスタムオブジェクトの金額計算式に誤差がある',
      推奨事項: 'Salesforceの計算項目ロジックを確認し、移行対象システムと同期させる',
      リスクレベル: '中',
      対応状況: '対応中',
      備考: '移行検証パス2で検出',
      作成日時: '2026-01-14T09:00:00Z',
      作成者ID: '990e8400-e29b-41d4-a716-446655440004',
      更新日時: '2026-01-15T10:30:00Z',
      更新者ID: 'aa0e8400-e29b-41d4-a716-446655440005',
      ギャップ分類: '計算ロジック',
      ギャップスコア: 7,
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);
    (dataStore.deleteRecord as jest.Mock).mockResolvedValue(undefined);
    (dataStore.createRecord as jest.Mock).mockResolvedValue({
      auditTrailId: 'audit-001',
      userId: userId,
      operationType: '削除',
      targetTableName: 'マッピング検証結果',
      targetRecordId: validationResultId,
      operationStatus: '成功',
      operationTimestamp: operationTimestamp,
      createdAt: operationTimestamp,
    });

    // 関数実行：void を返すため結果を検査しない
    await deleteMappingValidationResult({
      validationResultId,
      projectId,
      userId,
      operationTimestamp,
    });

    // データストアの deleteRecord が呼ばれたことを確認
    expect(dataStore.deleteRecord).toHaveBeenCalledWith('マッピング検証結果', validationResultId);

    // 監査証跡テーブルへの記録が実行されたことを確認（createRecord が呼ばれたことで確認）
    expect(dataStore.createRecord).toHaveBeenCalledWith(
      '操作監査証跡',
      expect.objectContaining({
        userId: userId,
        operationType: '削除',
        targetTableName: 'マッピング検証結果',
        targetRecordId: validationResultId,
        operationStatus: '成功',
        operationTimestamp: operationTimestamp,
      })
    );
  });
});
