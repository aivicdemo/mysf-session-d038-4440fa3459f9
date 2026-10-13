import { updateMappingValidationResult, ValidationResultNotFoundError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as authModule from '../../src/logic/authentication-authorization';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');

describe('updateMappingValidationResult - SCEN-182: ValidationResultNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return ValidationResultNotFoundError when validationResultId does not exist', async () => {
    // Arrange
    const validationResultId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '770e8400-e29b-41d4-a716-446655440002';
    const operationTimestamp = '2026-01-15T10:30:00Z';
    const validationStatus = '完了';

    // Mock 認証・認可検証を成功させる
    (authModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId,
      operationType: 'update',
      projectId,
    });

    // Mock データストアで既存レコードが見つからない状態を作成
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    // Act & Assert
    const promise = updateMappingValidationResult({
      validationResultId,
      projectId,
      validationStatus,
      userId,
      operationTimestamp,
    });

    // 例外をキャッチしてメッセージを検証
    try {
      await promise;
      fail('Should have thrown ValidationResultNotFoundError');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationResultNotFoundError);
      expect((error as Error).message).toContain(validationResultId);
      expect((error as Error).message).toContain('見つかりません');
    }
  });
});
