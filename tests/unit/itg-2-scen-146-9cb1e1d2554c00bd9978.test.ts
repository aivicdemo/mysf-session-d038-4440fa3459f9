import { saveMappingDetails, DataValidationError } from '../../src/logic/mapping-persistence';
import * as authAuthModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-146: saveMappingDetails - データ検証エラー時にDataValidationErrorが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw DataValidationError when validation fails', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const targetSystemId = '550e8400-e29b-41d4-a716-446655440001';
    const userId = '550e8400-e29b-41d4-a716-446655440003';
    const operationTimestamp = '2026-01-15T10:30:00Z';

    const input = {
      projectId,
      targetSystemId,
      existingFunctionName: '請求書作成機能',
      existingFunctionDescription: 'Oracle ERP の請求書自動作成',
      mappingTargetObjectId: '550e8400-e29b-41d4-a716-446655440002',
      mappingMethod: 'カスタマイズ',
      implementationPolicy: '既存ロジックを Apex で再実装',
      priority: 3,
      complexity: '中',
      dependencies: '取引先オブジェクト、商談オブジェクトに依存',
      verificationMethod: 'UAT で請求書出力内容を確認',
      remarks: '既存システムとの計算ロジック整合性を確認済み',
      userId,
      operationTimestamp,
    };

    // Mock successful authentication
    (authAuthModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId,
    });

    // Mock successful project context
    (projectContextModule.resolveProjectContext as jest.Mock).mockResolvedValue({
      projectId,
      targetSystemId,
      userId,
      isContextValid: true,
    });

    // Mock validation failure
    (validationModule.validateStandardFunctionMappings as jest.Mock).mockRejectedValue(
      new DataValidationError('入力データが検証ルールに違反しています。詳細を確認してください。')
    );

    await expect(saveMappingDetails(input)).rejects.toThrow(DataValidationError);
    await expect(saveMappingDetails(input)).rejects.toThrow('入力データが検証ルールに違反しています。詳細を確認してください。');
  });
});
