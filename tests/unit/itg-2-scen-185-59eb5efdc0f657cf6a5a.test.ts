import { updateMappingValidationResult, AuthorizationFailedError } from '../../src/logic/mapping-persistence';
import * as authModule from '../../src/logic/authentication-authorization';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/logic/authentication-authorization', () => ({
  ...jest.requireActual<typeof import('../../src/logic/authentication-authorization')>('../../src/logic/authentication-authorization'),
  verifyUserAuthenticationAndAuthorization: jest.fn(),
}));
jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
  updateRecord: jest.fn(),
}));

describe('SCEN-185: updateMappingValidationResult - Authorization failed error', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return AuthorizationFailedError when user lacks update permission', async () => {
    const validationResultId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '770e8400-e29b-41d4-a716-446655440002';
    const operationTimestamp = '2026-10-07T10:30:00.000Z';
    const validationStatus = '検証完了';
    const gapClassification = '部分対応';
    const gapScore = 75;

    // Mock existing record
    const existingRecord = {
      validationResultId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '660e8400-e29b-41d4-a716-446655440001',
      mappingDetailId: '880e8400-e29b-41d4-a716-446655440003',
      validationStatus: '検証中',
      gapClassification: '完全対応',
      gapScore: 100,
      detectedIssues: '既存の問題記述',
      recommendations: '既存の推奨事項',
      riskLevel: '中',
      remediationStatus: '未対応',
      remarks: '既存の備考',
      validatorId: '990e8400-e29b-41d4-a716-446655440004',
      validationTimestamp: '2026-10-06T10:00:00.000Z',
      createdAt: '2026-10-05T09:00:00.000Z',
      createdBy: '990e8400-e29b-41d4-a716-446655440004',
      updatedAt: '2026-10-06T10:00:00.000Z',
      updatedBy: '990e8400-e29b-41d4-a716-446655440004',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);

    // Mock authentication/authorization to return isAuthenticated: false and hasUpdatePermission: false
    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthenticated: false,
      hasUpdatePermission: false,
    });

    const input = {
      validationResultId,
      projectId,
      validationStatus,
      gapClassification,
      gapScore,
      userId,
      operationTimestamp,
    };

    await expect(updateMappingValidationResult(input)).rejects.toThrow(AuthorizationFailedError);
    await expect(updateMappingValidationResult(input)).rejects.toThrow('マッピング検証結果の更新権限がありません。');

    // Verify that updateRecord was not called
    expect(dataStore.updateRecord).not.toHaveBeenCalled();
  });
});
