import { updateMappingValidationResult } from '../../src/logic/mapping-persistence';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-190: updateMappingValidationResult - gapScore validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject gapScore outside 0-100 range', async () => {
    const validationResultId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '770e8400-e29b-41d4-a716-446655440002';
    const operationTimestamp = '2026-01-15T10:30:00Z';
    const gapScore = 150;

    const existingRecord = {
      validationResultId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      mappingDetailId: '880e8400-e29b-41d4-a716-446655440003',
      validationStatus: '検証完了',
      validationTimestamp: '2026-01-10T09:00:00Z',
      validatorId: '770e8400-e29b-41d4-a716-446655440002',
      detectedIssues: '既存の問題記録',
      recommendations: '既存の推奨事項',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '既存の備考',
      gapClassification: '部分対応',
      gapScore: 75,
      createdAt: '2026-01-05T08:00:00Z',
      createdBy: '770e8400-e29b-41d4-a716-446655440002',
      updatedAt: '2026-01-10T09:00:00Z',
      updatedBy: '770e8400-e29b-41d4-a716-446655440002',
    };

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      authenticated: true,
      hasUpdatePermission: true,
      userId,
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      projectFound: true,
      userHasAccess: true,
    });

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);

    await expect(
      updateMappingValidationResult({
        validationResultId,
        projectId,
        gapScore,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow();
  });
});
