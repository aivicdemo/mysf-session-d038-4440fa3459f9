import {
  saveMappingValidationResult,
  type SaveMappingValidationResultInput,
  type MappingValidationResultRecord,
} from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  createRecord: jest.fn(),
}));

describe('SCEN-162: エッジケース: 任意項目（検出問題・推奨事項・対応状況・備考）が全て未入力の場合、検証結果が保存され返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should save validation result with all optional fields as null/undefined and return the record', async () => {
    const projectData = [
      {
        プロジェクトID: 'proj-001',
        プロジェクト名: 'Salesforce移行プロジェクトA',
        ステータス: '進行中',
        作成日時: '2026-01-01T00:00:00Z',
        更新日時: '2026-01-15T00:00:00Z',
      },
    ];

    const mappingDetailData = [
      {
        機能マッピング詳細ID: 'map-detail-001',
        移行プロジェクトID: 'proj-001',
        既存機能名: '請求書作成',
        作成日時: '2026-01-05T00:00:00Z',
        更新日時: '2026-01-10T00:00:00Z',
      },
    ];

    const mockValidationResultRecord: MappingValidationResultRecord = {
      validationResultId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: 'proj-001',
      mappingDetailId: 'map-detail-001',
      validationStatus: '検証完了',
      gapClassification: '部分対応',
      gapScore: 75,
      detectedIssues: undefined,
      recommendations: undefined,
      riskLevel: '中',
      remediationStatus: undefined,
      remarks: undefined,
      validatorId: 'validator-user-001',
      validationTimestamp: '2026-01-20T10:30:00Z',
      createdAt: '2026-01-20T10:30:00Z',
      createdBy: 'system-user',
      updatedAt: '2026-01-20T10:30:00Z',
      updatedBy: 'system-user',
    };

    const mockListRecords = dataStore.listRecords as jest.MockedFunction<typeof dataStore.listRecords>;
    const mockCreateRecord = dataStore.createRecord as jest.MockedFunction<typeof dataStore.createRecord>;

    mockListRecords.mockImplementation((tableName: string) => {
      if (tableName === 'Salesforce移行プロジェクト') {
        return Promise.resolve(projectData);
      }
      if (tableName === '機能マッピング詳細') {
        return Promise.resolve(mappingDetailData);
      }
      if (tableName === 'マッピング検証結果') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    mockCreateRecord.mockResolvedValue(mockValidationResultRecord);

    const input: SaveMappingValidationResultInput = {
      projectId: 'proj-001',
      mappingDetailId: 'map-detail-001',
      validationStatus: '検証完了',
      gapClassification: '部分対応',
      gapScore: 75,
      detectedIssues: undefined,
      recommendations: undefined,
      riskLevel: '中',
      remediationStatus: undefined,
      remarks: undefined,
      validatorId: 'validator-user-001',
      validationTimestamp: '2026-01-20T10:30:00Z',
    };

    const result = await saveMappingValidationResult(input);

    expect(result.validationResultId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    expect(result.projectId).toBe('proj-001');
    expect(result.mappingDetailId).toBe('map-detail-001');
    expect(result.validationStatus).toBe('検証完了');
    expect(result.gapClassification).toBe('部分対応');
    expect(result.gapScore).toBe(75);
    expect(result.detectedIssues).toBeUndefined();
    expect(result.recommendations).toBeUndefined();
    expect(result.riskLevel).toBe('中');
    expect(result.remediationStatus).toBeUndefined();
    expect(result.remarks).toBeUndefined();
    expect(result.validatorId).toBe('validator-user-001');
    expect(result.validationTimestamp).toBe('2026-01-20T10:30:00Z');
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
