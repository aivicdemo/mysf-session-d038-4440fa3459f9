import { saveMappingValidationResult, InvalidRiskLevelError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-158: saveMappingValidationResult - InvalidRiskLevelError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('リスクレベルが定義済み値（低・中・高・極高）以外の場合、InvalidRiskLevelErrorが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const mappingDetailId = '660e8400-e29b-41d4-a716-446655440001';
    const validatorId = '770e8400-e29b-41d4-a716-446655440002';
    const validationTimestamp = '2026-01-15T10:30:00Z';

    // プロジェクトと機能マッピング詳細は存在する
    jest.spyOn(dataStore, 'listRecords').mockImplementation((tableName: string) => {
      if (tableName === 'Salesforce移行プロジェクト') {
        return Promise.resolve([
          {
            プロジェクトID: projectId,
            プロジェクト名: 'Salesforceリプレース移行',
            ステータス: '実行中',
            作成日時: '2025-10-01T00:00:00Z',
            更新日時: '2026-01-10T00:00:00Z',
          },
        ]);
      } else if (tableName === '機能マッピング詳細') {
        return Promise.resolve([
          {
            機能マッピング詳細ID: mappingDetailId,
            移行プロジェクトID: projectId,
            既存機能名: '請求書承認',
            マッピング方式: 'カスタマイズ',
            検証ステータス: '未検証',
            作成日時: '2025-11-01T00:00:00Z',
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
      gapScore: 75,
      detectedIssues: '請求書の承認ステップがSalesforceでは段階的に設定できない',
      recommendations: 'カスタムApexトリガーで承認フロー を実装',
      riskLevel: '無効値', // 無効な値
      remediationStatus: '対応中',
      remarks: '要件確認待ち',
      validatorId: validatorId,
      validationTimestamp: validationTimestamp,
    };

    // InvalidRiskLevelError が発生することを確認
    await expect(saveMappingValidationResult(input)).rejects.toThrow(InvalidRiskLevelError);
    await expect(saveMappingValidationResult(input)).rejects.toThrow(
      'リスクレベルが無効です。低、中、高、極高のいずれかを指定してください。'
    );

    // レコード保存が実行されない
    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
