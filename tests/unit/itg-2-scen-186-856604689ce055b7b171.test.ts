import { updateMappingValidationResult, ProjectAccessDeniedError } from '../../src/logic/mapping-persistence';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));
jest.mock('../../src/logic/project-context-resolver', () => ({
  ...jest.requireActual<typeof import('../../src/logic/project-context-resolver')>('../../src/logic/project-context-resolver'),
  resolveProjectContext: jest.fn(),
}));
jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
}));

describe('SCEN-186: updateMappingValidationResult - Project access denied error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return ProjectAccessDeniedError when user has no project access', async () => {
    const validationResultId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '770e8400-e29b-41d4-a716-446655440002';
    const operationTimestamp = '2025-07-15T10:30:00Z';
    const validationStatus = '検証完了';

    // Mock existing record
    const existingRecord = {
      validationResultId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      mappingDetailId: '880e8400-e29b-41d4-a716-446655440003',
      validationStatus: '検証中',
      gapClassification: '部分対応',
      gapScore: 65,
      detectedIssues: '既存の問題説明',
      recommendations: '既存の推奨事項',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '既存の備考',
      validatorId: '990e8400-e29b-41d4-a716-446655440004',
      validationTimestamp: '2025-07-10T09:00:00Z',
      createdAt: '2025-07-01T08:00:00Z',
      createdBy: 'aa0e8400-e29b-41d4-a716-446655440005',
      updatedAt: '2025-07-10T09:00:00Z',
      updatedBy: '990e8400-e29b-41d4-a716-446655440004',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);

    // Mock authentication/authorization to return success
    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      hasUpdatePermission: true,
    });

    // Mock project context to deny access
    (projectContextModule.resolveProjectContext as jest.Mock).mockRejectedValue(
      new ProjectAccessDeniedError(`プロジェクト（ID: ${projectId}）へのアクセス権がありません。`)
    );

    const input = {
      validationResultId,
      projectId,
      validationStatus,
      userId,
      operationTimestamp,
    };

    await expect(updateMappingValidationResult(input)).rejects.toThrow(ProjectAccessDeniedError);
    await expect(updateMappingValidationResult(input)).rejects.toThrow(`プロジェクト（ID: ${projectId}）へのアクセス権がありません。`);

    // Verify that updateRecord was not called
    expect(dataStore.updateRecord).not.toHaveBeenCalled();
  });
});
