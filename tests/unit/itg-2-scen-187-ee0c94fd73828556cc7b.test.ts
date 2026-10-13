import { updateMappingValidationResult, ProjectNotFoundError } from '../../src/logic/mapping-persistence';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-187: updateMappingValidationResult - ProjectNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectNotFoundError when project does not exist', async () => {
    const validationResultId = '660e8400-e29b-41d4-a716-446655440111';
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const userId = '770e8400-e29b-41d4-a716-446655440222';
    const operationTimestamp = '2026-10-07T10:30:00Z';

    const existingRecord = {
      validationResultId: '660e8400-e29b-41d4-a716-446655440111',
      projectId: '999e8400-e29b-41d4-a716-446655440999',
      mappingDetailId: '880e8400-e29b-41d4-a716-446655440333',
      validationStatus: '未検証',
      validationTimestamp: '2026-10-01T09:00:00Z',
      validatorId: '770e8400-e29b-41d4-a716-446655440222',
      detectedIssues: null,
      recommendations: null,
      riskLevel: '低',
      remediationStatus: null,
      remarks: null,
      gapClassification: '完全対応',
      gapScore: 100,
      createdAt: '2026-10-01T08:00:00Z',
      createdBy: '770e8400-e29b-41d4-a716-446655440222',
      updatedAt: '2026-10-01T08:00:00Z',
      updatedBy: '770e8400-e29b-41d4-a716-446655440222',
    };

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      userId,
      authenticated: true,
      authorized: true,
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue(null);

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);

    await expect(
      updateMappingValidationResult({
        validationResultId,
        projectId,
        validationStatus: '検証完了',
        gapClassification: '部分対応',
        gapScore: 75,
        riskLevel: '中',
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(ProjectNotFoundError);

    expect(projectContextModule.resolveProjectContext).toHaveBeenCalledWith(expect.objectContaining({ projectId }));
  });
});
