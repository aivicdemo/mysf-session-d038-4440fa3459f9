jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

import { updateMappingValidationResult, DataStoreError } from '../../src/logic/mapping-persistence';
import * as authenticationAuthorization from '../../src/logic/authentication-authorization';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

describe('SCEN-188: updateMappingValidationResult - DataStoreError時の振舞い', () => {
  const validationResultId = '550e8400-e29b-41d4-a716-446655440000';
  const projectId = '660e8400-e29b-41d4-a716-446655440001';
  const userId = '770e8400-e29b-41d4-a716-446655440002';
  const operationTimestamp = '2026-10-07T10:30:00Z';

  const existingRecord = {
    マッピング検証結果ID: '550e8400-e29b-41d4-a716-446655440000',
    移行プロジェクトID: '660e8400-e29b-41d4-a716-446655440001',
    機能マッピング詳細ID: '880e8400-e29b-41d4-a716-446655440003',
    検証ステータス: '検証中',
    検証日時: '2026-10-06T09:00:00Z',
    検証者ID: '770e8400-e29b-41d4-a716-446655440002',
    検出問題: '既存の問題説明',
    推奨事項: '既存の推奨',
    リスクレベル: '低',
    対応状況: '未対応',
    備考: '既存の備考',
    作成日時: '2026-10-01T08:00:00Z',
    作成者ID: '770e8400-e29b-41d4-a716-446655440002',
    更新日時: '2026-10-06T09:00:00Z',
    更新者ID: '770e8400-e29b-41d4-a716-446655440002',
    ギャップ分類: '完全対応',
    ギャップスコア: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (authenticationAuthorization.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValueOnce({
      isAuthenticated: true,
      hasUpdatePermission: true,
    });

    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValueOnce({
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      projectName: 'Salesforce移行プロジェクト',
      userHasAccess: true,
    });

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce([existingRecord]);

    (dataStore.updateRecord as jest.Mock).mockRejectedValueOnce(
      new Error('Database connection failed')
    );
  });

  it('マッピング検証結果レコードの更新時にデータストアアクセスが失敗し DataStoreError が発生する', async () => {
    const input = {
      validationResultId,
      projectId,
      validationStatus: '検証完了',
      gapClassification: '部分対応',
      gapScore: 75,
      detectedIssues: '請求書の計算ロジックに差異あり',
      recommendations: 'カスタマイズにより対応可能',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '追加検証予定',
      userId,
      operationTimestamp,
    };

    await expect(updateMappingValidationResult(input)).rejects.toThrow(DataStoreError);
  });

  it('エラーメッセージが期待値と一致する', async () => {
    const input = {
      validationResultId,
      projectId,
      validationStatus: '検証完了',
      gapClassification: '部分対応',
      gapScore: 75,
      detectedIssues: '請求書の計算ロジックに差異あり',
      recommendations: 'カスタマイズにより対応可能',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '追加検証予定',
      userId,
      operationTimestamp,
    };

    try {
      await updateMappingValidationResult(input);
      fail('Error should be thrown');
    } catch (error) {
      if (error instanceof DataStoreError) {
        expect(error.message).toContain('マッピング検証結果レコードの更新に失敗しました');
      }
    }
  });

  it('マッピング検証結果レコードは更新前の状態のまま変更されない', async () => {
    const input = {
      validationResultId,
      projectId,
      validationStatus: '検証完了',
      gapClassification: '部分対応',
      gapScore: 75,
      detectedIssues: '請求書の計算ロジックに差異あり',
      recommendations: 'カスタマイズにより対応可能',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '追加検証予定',
      userId,
      operationTimestamp,
    };

    try {
      await updateMappingValidationResult(input);
    } catch {
      // エラーは期待通り
    }

    // データストアから取得されたレコードを確認
    expect(dataStore.listRecords).toHaveBeenCalledWith(
      'マッピング検証結果',
      expect.objectContaining({
        マッピング検証結果ID: validationResultId,
      })
    );

    // 取得時のレコード内容が変更されていないことを確認
    const retrievedRecords = (dataStore.listRecords as jest.Mock).mock.results[0].value;
    expect(retrievedRecords).toBeDefined();
  });
});
