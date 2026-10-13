import { saveMappingDetails, AuthorizationFailedError } from '../../src/logic/mapping-persistence';
import * as authAuthModule from '../../src/logic/authentication-authorization';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-143: saveMappingDetails - ユーザーが権限を持たない場合、AuthorizationFailedErrorが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw AuthorizationFailedError when user lacks permission', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const targetSystemId = '550e8400-e29b-41d4-a716-446655440001';
    const userId = '550e8400-e29b-41d4-a716-446655440003';
    const operationTimestamp = '2026-10-07T10:30:00Z';

    const input = {
      projectId,
      targetSystemId,
      existingFunctionName: '請求書作成機能',
      existingFunctionDescription: 'Oracle請求システムの請求書作成・編集機能',
      mappingTargetObjectId: '550e8400-e29b-41d4-a716-446655440002',
      mappingMethod: 'カスタマイズ',
      implementationPolicy: 'Salesforceの標準機能と業務要件を組み合わせ実装',
      priority: 2,
      complexity: '中',
      dependencies: '取引先、取引先責任者、商談オブジェクトへの依存',
      verificationMethod: '統合テスト環境での検証',
      remarks: 'マイグレーション対象の優先度が高い',
      userId,
      operationTimestamp,
    };

    // Mock authorization failure
    (authAuthModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockRejectedValue(
      new AuthorizationFailedError('この操作を実行する権限がありません。')
    );

    await expect(saveMappingDetails(input)).rejects.toThrow(AuthorizationFailedError);
    await expect(saveMappingDetails(input)).rejects.toThrow('この操作を実行する権限がありません。');
  });
});
