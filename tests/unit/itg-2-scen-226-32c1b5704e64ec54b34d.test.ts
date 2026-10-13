import { deleteMappingValidationResult, DataStoreError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-226: deleteMappingValidationResult - DataStoreError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataStoreError when data store deletion fails', async () => {
    const validationResultId = '550e8400-e29b-41d4-a716-446655440001';
    const projectId = '650e8400-e29b-41d4-a716-446655440002';
    const userId = '750e8400-e29b-41d4-a716-446655440003';
    const operationTimestamp = '2026-10-07T12:00:00Z';

    // Mock validation result record with matching projectId
    const mockRecord = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      validationResultId: '550e8400-e29b-41d4-a716-446655440001',
      projectId: '650e8400-e29b-41d4-a716-446655440002',
      mappingDetailId: '850e8400-e29b-41d4-a716-446655440004',
      validationStatus: 'COMPLETED',
      gapClassification: 'DATA_TYPE_MISMATCH',
      gapScore: 85,
      detectedIssues: 'フィールド型の不一致',
      recommendations: 'データ型変換ロジックを追加',
      riskLevel: 'HIGH',
      remediationStatus: 'PENDING',
      remarks: '要件定義フェーズで対応予定',
      validatorId: '950e8400-e29b-41d4-a716-446655440005',
      validationTimestamp: '2026-10-06T10:30:00Z',
      createdAt: '2026-10-06T10:00:00Z',
      createdBy: 'user-001',
      updatedAt: '2026-10-06T10:30:00Z',
      updatedBy: 'user-002',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([mockRecord]);
    (dataStore.deleteRecord as jest.Mock).mockRejectedValue(
      new DataStoreError('マッピング検証結果レコードの削除に失敗しました。')
    );

    // Call the function and expect it to throw DataStoreError
    await expect(
      deleteMappingValidationResult({
        validationResultId,
        projectId,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(new DataStoreError('マッピング検証結果レコードの削除に失敗しました。'));
  });
});
