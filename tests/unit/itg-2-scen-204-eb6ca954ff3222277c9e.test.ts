import { retrieveMappingDetailsForProject, MappingDetailRecord } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as projectContextResolver from '../../src/logic/project-context-resolver';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/project-context-resolver');

describe('SCEN-204: 指定したプロジェクトIDに属する機能マッピング詳細レコード', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;
  const mockProjectContext = projectContextResolver as jest.Mocked<typeof projectContextResolver>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数のレコードが配列で返される', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';

    mockProjectContext.resolveProjectContext.mockResolvedValue({
      projectId,
      projectName: 'Salesforce to Oracle移行プロジェクト',
      status: 'active',
    });

    const mappingRecords: MappingDetailRecord[] = [
      {
        mappingDetailId: '660e8400-e29b-41d4-a716-446655440001',
        projectId,
        targetSystemId: '880e8400-e29b-41d4-a716-446655440001',
        existingFunctionName: '請求書ヘッダ作成',
        existingFunctionDescription: 'Salesforceの請求書カスタムオブジェクトのヘッダ情報作成機能',
        mappingTargetObjectId: '770e8400-e29b-41d4-a716-446655440001',
        mappingMethod: '1対1マッピング',
        implementationPolicy: 'Oracle請求テーブルのINSERTに変換',
        migrationStatus: 'マッピング完了',
        priority: 1,
        complexity: '低',
        dependencies: '取引先マスタ取得完了後に実行',
        verificationMethod: 'テストデータ100件でのデータ整合性検証',
        verificationStatus: '検証完了',
        remarks: 'Salesforceの記録タイプによる分岐処理あり',
        createdAt: '2026-01-15T10:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-01-15T10:00:00Z',
        updatedBy: 'user-001',
      },
      {
        mappingDetailId: '660e8400-e29b-41d4-a716-446655440002',
        projectId,
        targetSystemId: '880e8400-e29b-41d4-a716-446655440001',
        existingFunctionName: '請求明細行追加',
        existingFunctionDescription: '請求書に対する明細行の追加・削除機能',
        mappingTargetObjectId: '770e8400-e29b-41d4-a716-446655440002',
        mappingMethod: '1対複数マッピング',
        implementationPolicy: 'マスター詳細関係をOracle親子テーブルに変換',
        migrationStatus: 'マッピング完了',
        priority: 2,
        complexity: '中',
        dependencies: '請求書ヘッダ作成完了後に実行',
        verificationMethod: '200件の明細データでの参照整合性検証',
        verificationStatus: '検証完了',
        remarks: 'Salesforceロールアップ集計フィールドのロジックをOracleトリガに移行',
        createdAt: '2026-01-15T10:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-01-15T10:00:00Z',
        updatedBy: 'user-001',
      },
      {
        mappingDetailId: '660e8400-e29b-41d4-a716-446655440003',
        projectId,
        targetSystemId: '880e8400-e29b-41d4-a716-446655440001',
        existingFunctionName: '請求金額計算',
        existingFunctionDescription: '明細行の小計から請求書の合計金額を自動計算',
        mappingTargetObjectId: '770e8400-e29b-41d4-a716-446655440003',
        mappingMethod: '計算式変換',
        implementationPolicy: 'Salesforceの計算項目ロジックをOracleストアドプロシージャに変換',
        migrationStatus: 'マッピング完了',
        priority: 1,
        complexity: '高',
        dependencies: '請求明細行追加完了後に実行',
        verificationMethod: '1000件のシナリオテストでの金額精度検証',
        verificationStatus: '検証完了',
        remarks: '税計算ロジック・通货換算を含む複雑な計算式',
        createdAt: '2026-01-15T10:00:00Z',
        createdBy: 'user-001',
        updatedAt: '2026-01-15T10:00:00Z',
        updatedBy: 'user-001',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(mappingRecords);

    const result = await retrieveMappingDetailsForProject({ projectId });

    expect(result).toHaveLength(3);
    expect(result[0].mappingDetailId).toBe('660e8400-e29b-41d4-a716-446655440001');
    expect(result[0].existingFunctionName).toBe('請求書ヘッダ作成');
    expect(result[0].priority).toBe(1);
    expect(result[1].mappingDetailId).toBe('660e8400-e29b-41d4-a716-446655440002');
    expect(result[1].existingFunctionName).toBe('請求明細行追加');
    expect(result[1].priority).toBe(2);
    expect(result[2].mappingDetailId).toBe('660e8400-e29b-41d4-a716-446655440003');
    expect(result[2].existingFunctionName).toBe('請求金額計算');
    expect(result[2].priority).toBe(1);

    result.forEach((record) => {
      expect(record.projectId).toBe(projectId);
      expect(record.migrationStatus).toBe('マッピング完了');
      expect(record.verificationStatus).toBe('検証完了');
    });
  });
});
