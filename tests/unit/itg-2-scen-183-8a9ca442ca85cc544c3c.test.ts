import { updateMappingValidationResult, ProjectMismatchError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as authModule from '../../src/logic/authentication-authorization';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');

describe('updateMappingValidationResult - SCEN-183: ProjectMismatchError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return ProjectMismatchError when projectId does not match the validation result record', async () => {
    // Arrange
    const validationResultId = 'validation-result-001';
    const inputProjectId = 'project-B';
    const recordProjectId = 'project-A';
    const userId = 'updating-user-001';
    const operationTimestamp = '2026-01-16T14:30:00Z';

    // Mock 認証・認可検証を成功させる
    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId,
      operationType: 'update',
      projectId: inputProjectId,
    });

    // Mock 既存マッピング検証結果レコード
    const existingRecord = {
      validationResultId: 'validation-result-001',
      projectId: 'project-A',
      mappingDetailId: 'mapping-detail-001',
      validationStatus: '検証完了',
      validationTimestamp: '2026-01-15T10:00:00Z',
      validatorId: 'validator-user-001',
      detectedIssues: 'フィールド型の不一致',
      recommendations: 'カスタマイズが必要',
      riskLevel: '中',
      gapClassification: '部分対応',
      gapScore: 60,
      createdAt: '2026-01-15T10:00:00Z',
      createdBy: 'creator-user-001',
      updatedAt: '2026-01-15T10:00:00Z',
      updatedBy: 'creator-user-001',
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);

    // Act & Assert
    const promise = updateMappingValidationResult({
      validationResultId,
      projectId: inputProjectId,
      validationStatus: '検証完了',
      gapClassification: '完全対応',
      gapScore: 85,
      detectedIssues: '問題なし',
      recommendations: 'そのまま対応可能',
      riskLevel: '低',
      remediationStatus: '対応完了',
      remarks: '最終検証完了',
      userId,
      operationTimestamp,
    });

    // 例外をキャッチしてメッセージを検証
    try {
      await promise;
      fail('Should have thrown ProjectMismatchError');
    } catch (error) {
      expect(error).toBeInstanceOf(ProjectMismatchError);
      expect((error as Error).message).toContain(recordProjectId);
      expect((error as Error).message).toContain(inputProjectId);
      expect((error as Error).message).toContain('一致しません');
    }
  });
});
