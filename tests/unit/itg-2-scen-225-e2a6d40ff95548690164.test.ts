import { deleteMappingValidationResult, ProjectContextMismatchError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-225: deleteMappingValidationResult - ProjectContextMismatchError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectContextMismatchError when validation result projectId does not match input projectId', async () => {
    const validationResultId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '770e8400-e29b-41d4-a716-446655440002';
    const operationTimestamp = '2026-10-07T10:30:00.000Z';

    // Mock validation result record with different projectId
    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      validationResultId: '550e8400-e29b-41d4-a716-446655440000',
      projectId: '880e8400-e29b-41d4-a716-446655440003',
      mappingDetailId: '990e8400-e29b-41d4-a716-446655440004',
      validationStatus: 'COMPLETED',
      gapClassification: 'DATA_TYPE',
      gapScore: 45,
      detectedIssues: 'Field type mismatch',
      recommendations: 'Convert to decimal',
      riskLevel: 'MEDIUM',
      remediationStatus: 'PENDING',
      remarks: 'Requires data migration',
      validatorId: 'aaa0e8400-e29b-41d4-a716-446655440005',
      validationTimestamp: '2026-10-06T15:00:00.000Z',
      createdAt: '2026-10-06T14:00:00.000Z',
      createdBy: 'bbb0e8400-e29b-41d4-a716-446655440006',
      updatedAt: '2026-10-06T15:30:00.000Z',
      updatedBy: 'ccc0e8400-e29b-41d4-a716-446655440007',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);

    // Call the function and expect it to throw ProjectContextMismatchError
    await expect(
      deleteMappingValidationResult({
        validationResultId,
        projectId,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(new ProjectContextMismatchError(
      `プロジェクトコンテキスト（ID: ${projectId}）とマッピング検証結果レコードのプロジェクトが一致しません。`
    ));
  });
});
