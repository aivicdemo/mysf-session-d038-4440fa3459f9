import {
  saveMappingValidationResult,
  type SaveMappingValidationResultInput,
  type MappingValidationResultRecord,
} from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
}));

describe('SCEN-163: エッジケース: 既に同じ機能マッピング詳細に対する検証結果が存在する場合、既存レコードが更新されて返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update existing validation result and return the updated record', async () => {
    const projectData = [
      {
        プロジェクトID: 'proj-001',
        プロジェクト名: 'Salesforce移行プロジェクトA',
        ステータス: '進行中',
        作成日時: '2025-01-01T00:00:00Z',
        更新日時: '2025-01-15T00:00:00Z',
      },
    ];

    const mappingDetailData = [
      {
        機能マッピング詳細ID: 'mapping-detail-001',
        移行プロジェクトID: 'proj-001',
        既存機能名: '請求書作成',
        作成日時: '2025-01-05T00:00:00Z',
        更新日時: '2025-01-10T00:00:00Z',
      },
    ];

    const existingRecord = {
      マッピング検証結果ID: 'validation-result-001',
      移行プロジェクトID: 'proj-001',
      機能マッピング詳細ID: 'mapping-detail-001',
      検証ステータス: '検証完了',
      ギャップ分類: '部分対応',
      ギャップスコア: 65,
      リスクレベル: '中',
      検証者ID: 'validator-001',
      検証日時: '2025-01-10T10:00:00Z',
      検出問題: '計算ロジックの相違あり',
      推奨事項: 'カスタム計算項目の実装が必要',
      対応状況: '未対応',
      備考: '詳細検討予定',
      作成日時: '2025-01-10T10:00:00Z',
      作成者ID: 'user-001',
      更新日時: '2025-01-10T10:00:00Z',
      更新者ID: 'user-001',
      id: 'rec-001',
      createdAt: '2025-01-10T10:00:00Z',
      updatedAt: '2025-01-10T10:00:00Z',
    };

    const mockUpdatedRecord: MappingValidationResultRecord = {
      validationResultId: 'validation-result-001',
      projectId: 'proj-001',
      mappingDetailId: 'mapping-detail-001',
      validationStatus: '検証完了',
      gapClassification: 'カスタマイズ必要',
      gapScore: 72,
      detectedIssues: '複数の計算項目が未対応。承認フロー仕様に差異あり。',
      recommendations: 'Salesforceカスタム計算項目の実装。承認フロー仕様の詳細レビュー推奨。',
      riskLevel: '高',
      remediationStatus: '対応中',
      remarks: '既存検証結果から条件が変更されたため更新。次回レビュー予定日：2025-01-25',
      validatorId: 'validator-002',
      validationTimestamp: '2025-01-20T14:30:00Z',
      createdAt: '2025-01-10T10:00:00Z',
      createdBy: 'user-001',
      updatedAt: '2025-01-20T14:30:00Z',
      updatedBy: 'current-user',
    };

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    const mockUpdateRecord = dataStore.updateRecord as jest.MockedFunction<typeof dataStore.updateRecord>;

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === 'Salesforce移行プロジェクト') {
        return Promise.resolve(projectData);
      }
      if (tableName === '機能マッピング詳細') {
        return Promise.resolve(mappingDetailData);
      }
      if (tableName === 'マッピング検証結果') {
        return Promise.resolve([existingRecord]);
      }
      return Promise.resolve([]);
    });

    mockUpdateRecord.mockResolvedValue(mockUpdatedRecord);

    const input: SaveMappingValidationResultInput = {
      projectId: 'proj-001',
      mappingDetailId: 'mapping-detail-001',
      validationStatus: '検証完了',
      gapClassification: 'カスタマイズ必要',
      gapScore: 72,
      detectedIssues: '複数の計算項目が未対応。承認フロー仕様に差異あり。',
      recommendations: 'Salesforceカスタム計算項目の実装。承認フロー仕様の詳細レビュー推奨。',
      riskLevel: '高',
      remediationStatus: '対応中',
      remarks: '既存検証結果から条件が変更されたため更新。次回レビュー予定日：2025-01-25',
      validatorId: 'validator-002',
      validationTimestamp: '2025-01-20T14:30:00Z',
    };

    const result = await saveMappingValidationResult(input);

    expect(result.validationResultId).toBe('validation-result-001');
    expect(result.projectId).toBe('proj-001');
    expect(result.mappingDetailId).toBe('mapping-detail-001');
    expect(result.validationStatus).toBe('検証完了');
    expect(result.gapClassification).toBe('カスタマイズ必要');
    expect(result.gapScore).toBe(72);
    expect(result.detectedIssues).toBe('複数の計算項目が未対応。承認フロー仕様に差異あり。');
    expect(result.recommendations).toBe('Salesforceカスタム計算項目の実装。承認フロー仕様の詳細レビュー推奨。');
    expect(result.riskLevel).toBe('高');
    expect(result.remediationStatus).toBe('対応中');
    expect(result.remarks).toBe('既存検証結果から条件が変更されたため更新。次回レビュー予定日：2025-01-25');
    expect(result.validatorId).toBe('validator-002');
    expect(result.validationTimestamp).toBe('2025-01-20T14:30:00Z');
    expect(result.createdAt).toBe('2025-01-10T10:00:00Z');
    expect(result.createdBy).toBe('user-001');
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
    expect(result.updatedBy).not.toBe('user-001');
  });
});
