import { saveMappingValidationResult, InvalidValidationStatusError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-157: saveMappingValidationResult - InvalidValidationStatusError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('検証ステータスが定義済み値（未検証・検証中・検証完了・検証失敗）以外の場合、InvalidValidationStatusErrorが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const mappingDetailId = '550e8400-e29b-41d4-a716-446655440001';
    const validatorId = '550e8400-e29b-41d4-a716-446655440002';
    const validationTimestamp = '2026-10-07T06:31:28.825Z';

    // プロジェクトと機能マッピング詳細は存在する
    jest.spyOn(dataStore, 'listRecords').mockImplementation((tableName: string) => {
      if (tableName === 'Salesforce移行プロジェクト') {
        return Promise.resolve([
          {
            プロジェクトID: projectId,
            プロジェクト名: 'Salesforce移行プロジェクト',
            ステータス: '進行中',
            作成日時: '2026-09-01T00:00:00.000Z',
            更新日時: '2026-10-07T00:00:00.000Z',
          },
        ]);
      } else if (tableName === '機能マッピング詳細') {
        return Promise.resolve([
          {
            機能マッピング詳細ID: mappingDetailId,
            移行プロジェクトID: projectId,
            既存機能名: '請求書作成',
            マッピング方式: 'カスタマイズ',
            作成日時: '2026-09-10T00:00:00.000Z',
            更新日時: '2026-10-07T00:00:00.000Z',
          },
        ]);
      }
      return Promise.resolve([]);
    });

    const input = {
      projectId: projectId,
      mappingDetailId: mappingDetailId,
      validationStatus: '無効なステータス', // 無効な値
      gapClassification: '完全対応',
      gapScore: 50,
      riskLevel: '中',
      validatorId: validatorId,
      validationTimestamp: validationTimestamp,
    };

    // InvalidValidationStatusError が発生することを確認
    await expect(saveMappingValidationResult(input)).rejects.toThrow(InvalidValidationStatusError);
    await expect(saveMappingValidationResult(input)).rejects.toThrow(
      '検証ステータスが無効です。未検証、検証中、検証完了、検証失敗のいずれかを指定してください。'
    );

    // データベースへの保存操作は実行されない
    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
