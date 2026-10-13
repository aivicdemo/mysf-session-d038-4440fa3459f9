import { updateMappingValidationResult } from '../../src/logic/mapping-persistence';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-191: updateMappingValidationResult - updatedAt and updatedBy are updated', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update updatedAt and updatedBy fields', async () => {
    const validationResultId = 'vr-001';
    const projectId = 'proj-001';
    const userId = 'user-updater-002';
    const operationTimestamp = '2025-01-20T15:45:30Z';

    const existingRecord = {
      validationResultId: 'vr-001',
      projectId: 'proj-001',
      mappingDetailId: 'md-001',
      validationStatus: '検証完了',
      validationTimestamp: '2025-01-15T10:00:00Z',
      validatorId: 'user-validator-001',
      detectedIssues: 'フィールドマッピング不完全',
      recommendations: 'カスタムフィールド追加検討',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '初回検証',
      gapClassification: '部分対応',
      gapScore: 65,
      createdAt: '2025-01-10T08:00:00Z',
      createdBy: 'user-creator-001',
      updatedAt: '2025-01-12T14:30:00Z',
      updatedBy: 'user-updater-001',
    };

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: true,
      hasUpdatePermission: true,
      userId,
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
      gapScore: 65,
      detectedIssues: 'フィールドマッピング不完全',
      recommendations: 'カスタムフィールド追加検討',
      riskLevel: '高',
      remediationStatus: '対応中',
      remarks: '初回検証',
      userId,
      operationTimestamp,
    });

    expect(result.updatedAt).toBe('2025-01-20T15:45:30Z');
    expect(result.updatedBy).toBe('user-updater-002');
  });
});
