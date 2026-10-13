import {
  retrieveMigrationRiskAssessmentsForProject,
  MigrationRiskAssessmentRecord,
} from '../../src/logic/mapping-persistence';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));
jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

describe('SCEN-212: 指定されたプロジェクトIDに属する移行リスク評価レコードが複数件存在する場合、すべてのレコードを配列で取得できる', () => {
  const projectId = '550e8400-e29b-41d4-a716-446655440000';
  const mockProjectContext = {
    projectId,
    projectName: 'Salesforce to Oracle移行プロジェクト',
    exists: true,
  };

  const mockRiskRecords: MigrationRiskAssessmentRecord[] = [
    {
      riskAssessmentId: 'a1b2c3d4-e5f6-41d4-a716-111111111111',
      projectId,
      riskClassification: '技術的リスク',
      riskItemName: 'データマイグレーション',
      riskDescription: '大量のカスタムフィールドデータ移行時のデータ品質低下の可能性',
      occurrencePossibilityLevel: '高',
      impactLevel: '高',
      riskEvaluationScore: 85,
      remediationApproach: '段階的移行',
      remediationStrategy: '事前テスト環境で全データ検証、段階的バッチ処理',
      responsiblePerson: 'データマイグレーションリード',
      remediationStatus: '実行中',
      remarks: undefined,
      assessorId: 'assessor-001',
      assessmentTimestamp: '2026-01-15T10:30:00Z',
      createdAt: '2026-01-15T10:30:00Z',
      createdBy: 'user-001',
      updatedAt: '2026-01-20T14:00:00Z',
      updatedBy: 'user-001',
    },
    {
      riskAssessmentId: 'b2c3d4e5-f6a7-41d4-a716-222222222222',
      projectId,
      riskClassification: 'ビジネスプロセスリスク',
      riskItemName: '承認フロー検証',
      riskDescription: 'Oracle側の承認フロー仕様とSalesforce仕様の相違による承認プロセス漏れ',
      occurrencePossibilityLevel: '中',
      impactLevel: '高',
      riskEvaluationScore: 72,
      remediationApproach: 'ユーザーテスト強化',
      remediationStrategy: 'UAT期間を2週間延長、承認フロー全ケース検証',
      responsiblePerson: 'ビジネスアナリスト',
      remediationStatus: '計画中',
      remarks: undefined,
      assessorId: 'assessor-002',
      assessmentTimestamp: '2026-01-16T09:15:00Z',
      createdAt: '2026-01-16T09:15:00Z',
      createdBy: 'user-002',
      updatedAt: '2026-01-18T11:45:00Z',
      updatedBy: 'user-002',
    },
    {
      riskAssessmentId: 'c3d4e5f6-a7b8-41d4-a716-333333333333',
      projectId,
      riskClassification: '組織的リスク',
      riskItemName: 'チーム教育',
      riskDescription: '新システムの操作方法習得に予定より時間がかかる可能性',
      occurrencePossibilityLevel: '中',
      impactLevel: '中',
      riskEvaluationScore: 60,
      remediationApproach: '研修強化',
      remediationStrategy: 'go-live前に3日間の集中研修、オンデマンド動画配信',
      responsiblePerson: 'プロジェクトマネージャー',
      remediationStatus: '未開始',
      remarks: undefined,
      assessorId: 'assessor-003',
      assessmentTimestamp: '2026-01-17T13:20:00Z',
      createdAt: '2026-01-17T13:20:00Z',
      createdBy: 'user-003',
      updatedAt: '2026-01-17T13:20:00Z',
      updatedBy: 'user-003',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should retrieve all 3 migration risk assessment records for the specified projectId', async () => {
    // Mock resolveProjectContext to return valid project context
    (projectContextResolver.resolveProjectContext as jest.Mock).mockResolvedValue(
      mockProjectContext
    );

    // Mock data store to return all risk records
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockRiskRecords);

    // Call the function
    const result = await retrieveMigrationRiskAssessmentsForProject({ projectId });

    // Verify that the result is an array with 3 records
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(3);

    // Verify each record has correct values
    expect(result[0]).toEqual(
      expect.objectContaining({
        riskAssessmentId: 'a1b2c3d4-e5f6-41d4-a716-111111111111',
        riskItemName: 'データマイグレーション',
        riskEvaluationScore: 85,
      })
    );

    expect(result[1]).toEqual(
      expect.objectContaining({
        riskAssessmentId: 'b2c3d4e5-f6a7-41d4-a716-222222222222',
        riskItemName: '承認フロー検証',
        riskEvaluationScore: 72,
      })
    );

    expect(result[2]).toEqual(
      expect.objectContaining({
        riskAssessmentId: 'c3d4e5f6-a7b8-41d4-a716-333333333333',
        riskItemName: 'チーム教育',
        riskEvaluationScore: 60,
      })
    );

    // Verify all required fields are present in the records
    result.forEach((record) => {
      expect(record).toHaveProperty('riskAssessmentId');
      expect(record).toHaveProperty('projectId');
      expect(record).toHaveProperty('riskClassification');
      expect(record).toHaveProperty('riskItemName');
      expect(record).toHaveProperty('riskDescription');
      expect(record).toHaveProperty('occurrencePossibilityLevel');
      expect(record).toHaveProperty('impactLevel');
      expect(record).toHaveProperty('riskEvaluationScore');
      expect(record).toHaveProperty('remediationApproach');
      expect(record).toHaveProperty('remediationStrategy');
      expect(record).toHaveProperty('responsiblePerson');
      expect(record).toHaveProperty('remediationStatus');
      expect(record).toHaveProperty('assessorId');
      expect(record).toHaveProperty('assessmentTimestamp');
      expect(record).toHaveProperty('createdAt');
      expect(record).toHaveProperty('updatedAt');
    });

    // Verify that resolveProjectContext was called
    expect(projectContextResolver.resolveProjectContext).toHaveBeenCalled();

    // Verify that listRecords was called
    expect(dataStore.listRecords).toHaveBeenCalled();
  });
});
