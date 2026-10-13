import { updateMappingValidationResult, MappingValidationResultRecord } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationModule from '../../src/logic/authentication-authorization';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');

describe('SCEN-181: updateMappingValidationResult - Update validation result record', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update mapping validation result record with all specified attributes', async () => {
    const validationResultId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '550e8400-e29b-41d4-a716-446655440001';
    const validationStatus = '検証完了';
    const gapClassification = 'カスタマイズ必要';
    const gapScore = 45;
    const detectedIssues =
      'Oracle の請求テーブルに存在する「割引額」フィールドが Salesforce カスタムオブジェクトに未実装。請求明細の税額計算ロジックが異なる。';
    const recommendations =
      'Salesforce カスタムオブジェクトに「割引額」フィールドを追加し、計算項目で税額計算ロジックを実装。移行後の検証テストで両システムの請求額を突合。';
    const riskLevel = '高';
    const remediationStatus = '対応中';
    const remarks =
      '2026-01-20 までに Salesforce 側フィールド追加予定。Oracle との計算ロジック差分は別途ドキュメント化済み。';
    const userId = '550e8400-e29b-41d4-a716-446655440020';
    const operationTimestamp = '2026-01-16T14:30:00Z';

    const existingRecord = {
      マッピング検証結果ID: '550e8400-e29b-41d4-a716-446655440000',
      移行プロジェクトID: '550e8400-e29b-41d4-a716-446655440001',
      機能マッピング詳細ID: '550e8400-e29b-41d4-a716-446655440002',
      検証ステータス: '検証中',
      検証日時: '2026-01-15T10:00:00Z',
      検証者ID: '550e8400-e29b-41d4-a716-446655440010',
      検出問題: 'Oracle の請求テーブルに存在する「割引額」フィールドが Salesforce カスタムオブジェクトに未実装',
      推奨事項: null,
      リスクレベル: '中',
      対応状況: null,
      備考: null,
      作成日時: '2026-01-14T09:00:00Z',
      作成者ID: '550e8400-e29b-41d4-a716-446655440010',
      更新日時: '2026-01-15T10:00:00Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440010',
      ギャップ分類: '部分対応',
      ギャップスコア: 65,
      id: '550e8400-e29b-41d4-a716-446655440000',
      createdAt: '2026-01-14T09:00:00Z',
      updatedAt: '2026-01-15T10:00:00Z',
    };

    const updatedRecord = {
      ...existingRecord,
      検証ステータス: '検証完了',
      ギャップ分類: 'カスタマイズ必要',
      ギャップスコア: 45,
      検出問題: detectedIssues,
      推奨事項: recommendations,
      リスクレベル: '高',
      対応状況: '対応中',
      備考: remarks,
      更新日時: '2026-01-16T14:30:00Z',
      更新者ID: '550e8400-e29b-41d4-a716-446655440020',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);
    (authorizationModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      authenticated: true,
      authorized: true,
    });
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectExists: true,
      userHasAccess: true,
    });
    (dataStore.updateRecord as jest.Mock).mockResolvedValue(updatedRecord);

    const result = await updateMappingValidationResult({
      validationResultId,
      projectId,
      validationStatus,
      gapClassification,
      gapScore,
      detectedIssues,
      recommendations,
      riskLevel,
      remediationStatus,
      remarks,
      userId,
      operationTimestamp,
    });

    expect(result).toMatchObject({
      validationResultId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '550e8400-e29b-41d4-a716-446655440001',
      mappingDetailId: '550e8400-e29b-41d4-a716-446655440002',
      validationStatus: '検証完了',
      gapClassification: 'カスタマイズ必要',
      gapScore: 45,
      detectedIssues:
        'Oracle の請求テーブルに存在する「割引額」フィールドが Salesforce カスタムオブジェクトに未実装。請求明細の税額計算ロジックが異なる。',
      recommendations:
        'Salesforce カスタムオブジェクトに「割引額」フィールドを追加し、計算項目で税額計算ロジックを実装。移行後の検証テストで両システムの請求額を突合。',
      riskLevel: '高',
      remediationStatus: '対応中',
      remarks:
        '2026-01-20 までに Salesforce 側フィールド追加予定。Oracle との計算ロジック差分は別途ドキュメント化済み。',
      validatorId: '550e8400-e29b-41d4-a716-446655440010',
      validationTimestamp: '2026-01-15T10:00:00Z',
      createdAt: '2026-01-14T09:00:00Z',
      createdBy: '550e8400-e29b-41d4-a716-446655440010',
      updatedBy: '550e8400-e29b-41d4-a716-446655440020',
    });

    expect(result.updatedAt).toBe('2026-01-16T14:30:00Z');
  });
});
