import { saveMappingValidationResult, DataStoreError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-159: saveMappingValidationResult - DataStoreError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('データベースへの保存操作が失敗した場合、DataStoreErrorが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const mappingDetailId = '660e8400-e29b-41d4-a716-446655440001';
    const validatorId = '770e8400-e29b-41d4-a716-446655440002';
    const validationTimestamp = '2026-01-15T10:30:00Z';

    // プロジェクトと機能マッピング詳細は存在する
    jest.spyOn(dataStore, 'listRecords').mockImplementation((tableName: string) => {
      if (tableName === 'Salesforce移行プロジェクト') {
        return Promise.resolve([
          {
            id: projectId,
            プロジェクト名: 'Salesforce→新ERP移行プロジェクト',
            説明: 'ライセンス料削減のための移行',
            ステータス: '進行中',
            開始予定日: '2026-01-01T00:00:00Z',
            終了予定日: '2026-12-31T00:00:00Z',
            実開始日: '2026-01-05T00:00:00Z',
            実終了日: null,
            移行元システム: 'Salesforce',
            プロジェクトマネージャー: '山田太郎',
            進捗率: 35,
            作成日時: '2025-12-20T08:00:00Z',
            更新日時: '2026-01-14T16:00:00Z',
            作成者: 'admin',
            更新者: 'admin',
          },
        ]);
      } else if (tableName === '機能マッピング詳細') {
        return Promise.resolve([
          {
            id: mappingDetailId,
            移行プロジェクトID: projectId,
            既存機能名: '請求書作成',
            既存機能説明: 'Oracle ERP請求書作成機能',
            マッピング対象オブジェクトID: '880e8400-e29b-41d4-a716-446655440003',
            マッピング方式: '標準オブジェクト+カスタムフィールド',
            実装方針: 'Invoice__cカスタムオブジェクトで実装',
            移行ステータス: 'マッピング中',
            優先度: 1,
            複雑度: '高',
            依存関係: 'Account, Opportunity, OpportunityLineItem',
            検証方法: '機能テスト、統合テスト',
            検証ステータス: '未検証',
            備考: null,
            作成日時: '2026-01-10T09:00:00Z',
            作成者: '770e8400-e29b-41d4-a716-446655440002',
            更新日時: '2026-01-14T14:30:00Z',
            更新者: '770e8400-e29b-41d4-a716-446655440002',
            マッピング対象システムID: '990e8400-e29b-41d4-a716-446655440004',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    // createRecord でエラーが発生する状態に設定
    jest.spyOn(dataStore, 'createRecord').mockRejectedValue(
      new DataStoreError('マッピング検証結果の保存に失敗しました。システム管理者に連絡してください。')
    );

    const input = {
      projectId: projectId,
      mappingDetailId: mappingDetailId,
      validationStatus: '検証完了',
      gapClassification: '部分対応',
      gapScore: 75,
      detectedIssues: '請求書の割引機能がSalesforceの標準機能では対応できない',
      recommendations: 'カスタムフィールドとプロセスビルダーを使用して割引処理を実装',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '予定通り進行中',
      validatorId: validatorId,
      validationTimestamp: validationTimestamp,
    };

    // DataStoreError が発生することを確認
    await expect(saveMappingValidationResult(input)).rejects.toThrow(DataStoreError);
    await expect(saveMappingValidationResult(input)).rejects.toThrow(
      'マッピング検証結果の保存に失敗しました。システム管理者に連絡してください。'
    );

    // createRecord が呼び出されたことを確認
    expect(dataStore.createRecord).toHaveBeenCalled();
  });
});
