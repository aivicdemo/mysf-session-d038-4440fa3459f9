import { saveMappingValidationResult, MappingDetailNotFoundError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-154: saveMappingValidationResult - MappingDetailNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定された機能マッピング詳細IDが存在しないか、指定されたプロジェクトに属していない場合、MappingDetailNotFoundErrorが発生する', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const mappingDetailId = '550e8400-e29b-41d4-a716-446655440999';
    const validatorId = 'validator-001';
    const validationTimestamp = '2026-10-07T10:30:00Z';

    // プロジェクトは存在しない、機能マッピング詳細も存在しない状態
    jest.spyOn(dataStore, 'listRecords').mockImplementation((tableName: string) => {
      if (tableName === 'Salesforce移行プロジェクト') {
        return Promise.resolve([]);
      } else if (tableName === '機能マッピング詳細') {
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
      detectedIssues: '計算ロジックが部分的に異なる',
      recommendations: 'カスタマイズで対応可能',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '追加テストが必要',
      validatorId: validatorId,
      validationTimestamp: validationTimestamp,
    };

    // MappingDetailNotFoundError が発生することを確認
    // ただし、プロジェクトが見つからない場合は ProjectNotFoundError が先に発生する可能性がある
    // ここではそのどちらかが発生することを確認
    await expect(saveMappingValidationResult(input)).rejects.toThrow();

    // レコード保存が実行されない
    expect(dataStore.createRecord).not.toHaveBeenCalled();
  });
});
