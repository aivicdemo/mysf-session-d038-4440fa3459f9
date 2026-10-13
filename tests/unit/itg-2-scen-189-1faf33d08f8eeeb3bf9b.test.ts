import { updateMappingValidationResult } from '../../src/logic/mapping-persistence';
import * as authModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/platform/data-store');

describe('SCEN-189: updateMappingValidationResult - Keep existing values when all optional fields are undefined', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should preserve existing values when all optional fields are undefined', async () => {
    const validationResultId = 'vr-001';
    const projectId = 'proj-123';
    const userId = 'user-updater-002';
    const operationTimestamp = '2026-01-20T14:30:00Z';

    const existingRecord = {
      validationResultId: 'vr-001',
      projectId: 'proj-123',
      mappingDetailId: 'mmd-456',
      validationStatus: '検証完了',
      validationTimestamp: '2026-01-15T10:00:00Z',
      validatorId: 'user-validator-001',
      detectedIssues: 'Oracle側に承認フロー未実装',
      recommendations: 'Salesforceの承認フロー機能を活用',
      riskLevel: '中',
      remediationStatus: '対応中',
      remarks: '初期検証完了',
      gapClassification: '部分対応',
      gapScore: 65,
      createdAt: '2026-01-10T09:00:00Z',
      createdBy: 'user-creator-001',
      updatedAt: '2026-01-15T10:00:00Z',
      updatedBy: 'user-updater-001',
    };

    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      authenticated: true,
      authorized: true,
    });

    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      accessible: true,
      exists: true,
    });

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);
    (dataStore.updateRecord as jest.Mock).mockResolvedValue(undefined);

    const result = await updateMappingValidationResult({
      validationResultId,
      projectId,
      validationStatus: undefined,
      gapClassification: undefined,
      gapScore: undefined,
      detectedIssues: undefined,
      recommendations: undefined,
      riskLevel: undefined,
      remediationStatus: undefined,
      remarks: undefined,
      userId,
      operationTimestamp,
    });

    expect(result.validationResultId).toBe('vr-001');
    expect(result.projectId).toBe('proj-123');
    expect(result.validationStatus).toBe('検証完了');
    expect(result.gapClassification).toBe('部分対応');
    expect(result.gapScore).toBe(65);
    expect(result.detectedIssues).toBe('Oracle側に承認フロー未実装');
    expect(result.recommendations).toBe('Salesforceの承認フロー機能を活用');
    expect(result.riskLevel).toBe('中');
    expect(result.remediationStatus).toBe('対応中');
    expect(result.remarks).toBe('初期検証完了');
    expect(result.updatedAt).toBe(operationTimestamp);
    expect(result.updatedBy).toBe(userId);
  });
});
