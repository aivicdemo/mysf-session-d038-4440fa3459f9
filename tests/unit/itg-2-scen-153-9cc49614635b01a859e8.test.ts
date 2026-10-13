import { saveMappingValidationResult, ProjectNotFoundError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-153: saveMappingValidationResult - ProjectNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定されたプロジェクトIDが存在しないか削除されている場合、ProjectNotFoundErrorが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const mappingDetailId = '550e8400-e29b-41d4-a716-446655440001';
    const validatorId = '550e8400-e29b-41d4-a716-446655440002';
    const validationTimestamp = '2026-01-15T10:30:00Z';

    // プロジェクトが存在しない状態に設定
    jest.spyOn(dataStore, 'listRecords').mockImplementation((tableName: string) => {
      if (tableName === 'Salesforce移行プロジェクト') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    const input = {
      projectId: projectId,
      mappingDetailId: mappingDetailId,
      validationStatus: '検証完了',
      gapClassification: '部分対応',
      gapScore: 75,
      detectedIssues: 'カスタムフィールド3個が未対応',
      recommendations: '独自カスタマイズにより対応可能',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '2月中の対応完了予定',
      validatorId: validatorId,
      validationTimestamp: validationTimestamp,
    };

    // ProjectNotFoundError が発生することを確認
    await expect(saveMappingValidationResult(input)).rejects.toThrow(ProjectNotFoundError);
    await expect(saveMappingValidationResult(input)).rejects.toThrow(
      '指定されたプロジェクトが見つかりません。プロジェクトIDを確認してください。'
    );

    // データベースへのレコード保存は実行されない
    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
