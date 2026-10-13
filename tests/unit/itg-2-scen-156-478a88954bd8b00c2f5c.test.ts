import { saveMappingValidationResult, InvalidGapScoreError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-156: saveMappingValidationResult - InvalidGapScoreError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ギャップスコアが0～100の範囲外である場合、InvalidGapScoreErrorが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const mappingDetailId = '550e8400-e29b-41d4-a716-446655440001';
    const validatorId = '550e8400-e29b-41d4-a716-446655440002';
    const validationTimestamp = '2026-01-15T10:30:00Z';

    // プロジェクトと機能マッピング詳細は存在する
    jest.spyOn(dataStore, 'listRecords').mockImplementation((tableName: string) => {
      if (tableName === 'Salesforce移行プロジェクト') {
        return Promise.resolve([
          {
            プロジェクトID: projectId,
            プロジェクト名: 'Salesforce移行プロジェクトA',
            ステータス: '進行中',
            作成日時: '2025-12-01T00:00:00Z',
            更新日時: '2026-01-10T00:00:00Z',
          },
        ]);
      } else if (tableName === '機能マッピング詳細') {
        return Promise.resolve([
          {
            機能マッピング詳細ID: mappingDetailId,
            移行プロジェクトID: projectId,
            既存機能名: '請求書作成',
            マッピング方式: 'カスタマイズ',
            検証ステータス: '未検証',
            作成日時: '2025-12-05T00:00:00Z',
            更新日時: '2026-01-05T00:00:00Z',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const input = {
      projectId: projectId,
      mappingDetailId: mappingDetailId,
      validationStatus: '検証完了',
      gapClassification: '部分対応',
      gapScore: 101, // 範囲外の値
      riskLevel: '中',
      validatorId: validatorId,
      validationTimestamp: validationTimestamp,
    };

    // InvalidGapScoreError が発生することを確認
    await expect(saveMappingValidationResult(input)).rejects.toThrow(InvalidGapScoreError);
    await expect(saveMappingValidationResult(input)).rejects.toThrow(
      'ギャップスコアは0～100の範囲で指定してください。'
    );

    // データベースへの保存は実行されない
    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
