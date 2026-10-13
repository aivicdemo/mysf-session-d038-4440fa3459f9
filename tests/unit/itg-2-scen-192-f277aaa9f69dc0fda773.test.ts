import { updateMappingValidationResult } from '../../src/logic/mapping-persistence';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-192: updateMappingValidationResult - mappingDetailId and validatorId preserved', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preserve mappingDetailId and validatorId from existing record', async () => {
    const validationResultId = '550e8400-e29b-41d4-a716-446655440001';
    const projectId = '660e8400-e29b-41d4-a716-446655440002';
    const userId = '770e8400-e29b-41d4-a716-446655440003';
    const operationTimestamp = '2026-01-15T14:30:00Z';

    const existingRecord = {
      validationResultId: '550e8400-e29b-41d4-a716-446655440001',
      projectId: '660e8400-e29b-41d4-a716-446655440002',
      mappingDetailId: '880e8400-e29b-41d4-a716-446655440004',
      validationStatus: '検証中',
      validationTimestamp: '2026-01-10T10:00:00Z',
      validatorId: '990e8400-e29b-41d4-a716-446655440005',
      detectedIssues: '初期検出内容',
      recommendations: '初期推奨内容',
      riskLevel: '低',
      remediationStatus: '未対応',
      remarks: '初期備考',
      gapClassification: '完全対応',
      gapScore: 100,
      createdAt: '2026-01-05T09:00:00Z',
      createdBy: '990e8400-e29b-41d4-a716-446655440005',
      updatedAt: '2026-01-10T10:00:00Z',
      updatedBy: '990e8400-e29b-41d4-a716-446655440005',
    };

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      userId,
      hasUpdatePermission: true,
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      projectExists: true,
      userHasAccess: true,
    });

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);
    (dataStore.updateRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await updateMappingValidationResult({
      validationResultId,
      projectId,
      validationStatus: '検証完了',
      gapClassification: '部分対応',
      gapScore: 75,
      detectedIssues: 'カスタム計算項目が標準機能で実装不可',
      recommendations: 'Flow で計算ロジックを代替実装',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: 'プロジェクト承認者に確認済み',
      userId,
      operationTimestamp,
    });

    expect(result.validationResultId).toBe('550e8400-e29b-41d4-a716-446655440001');
    expect(result.projectId).toBe('660e8400-e29b-41d4-a716-446655440002');
    expect(result.mappingDetailId).toBe('880e8400-e29b-41d4-a716-446655440004');
    expect(result.validatorId).toBe('990e8400-e29b-41d4-a716-446655440005');
    expect(result.validationStatus).toBe('検証完了');
    expect(result.gapClassification).toBe('部分対応');
    expect(result.gapScore).toBe(75);
    expect(result.detectedIssues).toBe('カスタム計算項目が標準機能で実装不可');
    expect(result.recommendations).toBe('Flow で計算ロジックを代替実装');
    expect(result.riskLevel).toBe('中');
    expect(result.remediationStatus).toBe('対応中');
    expect(result.remarks).toBe('プロジェクト承認者に確認済み');
    expect(result.validationTimestamp).toBe('2026-01-10T10:00:00Z');
    expect(result.createdAt).toBe('2026-01-05T09:00:00Z');
    expect(result.createdBy).toBe('990e8400-e29b-41d4-a716-446655440005');
    expect(result.updatedAt).toBe('2026-01-15T14:30:00Z');
    expect(result.updatedBy).toBe('770e8400-e29b-41d4-a716-446655440003');
  });
});
