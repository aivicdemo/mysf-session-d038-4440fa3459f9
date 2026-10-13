import { saveMappingDetails, MissingRequiredFieldError } from '../../src/logic/mapping-persistence';
import * as authAuthModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-147: saveMappingDetails - 必須フィールド不足時にMissingRequiredFieldErrorが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MissingRequiredFieldError when existingFunctionName is empty', async () => {
    const projectId = '550e8400-e29b-41d4-a716-446655440000';
    const targetSystemId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '880e8400-e29b-41d4-a716-446655440003';
    const operationTimestamp = '2026-01-15T10:30:00Z';

    const input = {
      projectId,
      targetSystemId,
      existingFunctionName: '',
      existingFunctionDescription: '請求書承認フロー',
      mappingTargetObjectId: '770e8400-e29b-41d4-a716-446655440002',
      mappingMethod: '標準機能利用',
      implementationPolicy: 'Salesforce承認プロセスを利用',
      priority: 1,
      complexity: '中',
      dependencies: '取引先マスタ連携',
      verificationMethod: 'UAT環境で承認フロー動作確認',
      remarks: '移行対象機能',
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

    // Mock validation failure for missing required field
    (validationModule.validateStandardFunctionMappings as jest.Mock).mockRejectedValue(
      new MissingRequiredFieldError('必須フィールドが不足しています。')
    );

    await expect(saveMappingDetails(input)).rejects.toThrow(MissingRequiredFieldError);
    await expect(saveMappingDetails(input)).rejects.toThrow('必須フィールドが不足しています。');
  });
});
