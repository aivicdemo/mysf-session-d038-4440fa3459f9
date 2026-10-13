import { updateMappingValidationResult, AuthenticationFailedError } from '../../src/logic/mapping-persistence';
import * as authModule from '../../src/logic/authentication-authorization';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');

describe('updateMappingValidationResult - SCEN-184: AuthenticationFailedError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return AuthenticationFailedError when user is not authenticated', async () => {
    // Arrange
    const userId = 'user-123';
    const validationResultId = 'validation-result-456';
    const projectId = 'project-789';
    const operationTimestamp = '2026-01-15T10:30:00Z';

    // Mock 既存マッピング検証結果レコード
    const existingRecord = {
      validationResultId: 'validation-result-456',
      projectId: 'project-789',
      mappingDetailId: 'mapping-detail-111',
      validationStatus: '検証完了',
      validationTimestamp: '2026-01-14T09:00:00Z',
      validatorId: 'validator-user-001',
      detectedIssues: '部分的な機能不足',
      recommendations: 'カスタマイズが必要',
      riskLevel: '中',
      remediationStatus: '未対応',
      remarks: '既存の備考',
      createdAt: '2026-01-10T08:00:00Z',
      createdBy: 'creator-user-001',
      updatedAt: '2026-01-14T09:00:00Z',
      updatedBy: 'validator-user-001',
      gapClassification: '部分対応',
      gapScore: 65,
    };

    (dataStore.listRecords as jest.Mock).mockResolvedValue([existingRecord]);

    // verifyUserAuthenticationAndAuthorization がAuthenticationFailedErrorを発生させる
    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockRejectedValue(
      new AuthenticationFailedError('ユーザー認証に失敗しました。再度ログインしてください。')
    );

    // Act & Assert
    const promise = updateMappingValidationResult({
      validationResultId,
      projectId,
      userId,
      operationTimestamp,
    });

    // 例外をキャッチしてメッセージを検証
    try {
      await promise;
      fail('Should have thrown AuthenticationFailedError');
    } catch (error) {
      expect(error).toBeInstanceOf(AuthenticationFailedError);
      expect((error as Error).message).toContain('ユーザー認証に失敗しました');
      expect((error as Error).message).toContain('ログイン');
    }

    // レコードが更新されないことを確認
    expect(dataStore.updateRecord).not.toHaveBeenCalled();
  });
});
