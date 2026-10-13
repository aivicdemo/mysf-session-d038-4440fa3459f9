import { saveMappingDetails, ProjectStatusInvalidError } from '../../src/logic/mapping-persistence';
import * as authAuthModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-145: saveMappingDetails - プロジェクトステータス無効時にProjectStatusInvalidErrorが発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ProjectStatusInvalidError when project status is cancelled', async () => {
    const projectId = 'proj-001';
    const targetSystemId = 'sys-001';
    const userId = 'user-001';
    const operationTimestamp = '2026-10-07T10:00:00.000Z';

    const input = {
      projectId,
      targetSystemId,
      existingFunctionName: '請求書作成',
      mappingTargetObjectId: 'obj-invoice-001',
      mappingMethod: 'カスタマイズ',
      userId,
      operationTimestamp,
    };

    // Mock successful authentication
    (authAuthModule.verifyUserAuthenticationAndAuthorization as jest.Mock).mockResolvedValue({
      isAuthorized: true,
      userId,
    });

    // Mock project context with invalid status
    (projectContextModule.resolveProjectContext as jest.Mock).mockRejectedValue(
      new ProjectStatusInvalidError('プロジェクトのステータスが保存操作に適していません。')
    );

    // Mock successful validation
    (validationModule.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
      validationResults: [],
    });

    await expect(saveMappingDetails(input)).rejects.toThrow(ProjectStatusInvalidError);
    await expect(saveMappingDetails(input)).rejects.toThrow('プロジェクトのステータスが保存操作に適していません。');
  });
});
