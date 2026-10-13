import { saveMappingDetails, DataStoreError } from '../../src/logic/mapping-persistence';
import * as authAuthModule from '../../src/logic/authentication-authorization';
import * as projectContextModule from '../../src/logic/project-context-resolver';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/data-validation-rules');
jest.mock('../../src/platform/data-store');

describe('SCEN-148: saveMappingDetails - データベース保存エラー時にDataStoreErrorが発生', () => {
  let mockDataStore: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const dataStoreModule = require('../../src/platform/data-store');
    mockDataStore = {
      createRecord: jest.fn(),
      listRecords: jest.fn().mockResolvedValue([]),
      updateRecord: jest.fn(),
      deleteRecord: jest.fn(),
    };
    dataStoreModule.dataStore = mockDataStore;
  });

  it('should throw DataStoreError when database write fails', async () => {
    const projectId = 'proj-uuid-001';
    const targetSystemId = 'sys-uuid-001';
    const userId = 'user-uuid-001';
    const operationTimestamp = '2026-10-07T06:31:50.000Z';

    const input = {
      projectId,
      targetSystemId,
      existingFunctionName: '請求書作成',
      mappingTargetObjectId: 'obj-uuid-001',
      mappingMethod: '標準機能利用',
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

    // Mock successful validation
    (validationModule.validateStandardFunctionMappings as jest.Mock).mockResolvedValue({
      isValid: true,
      validationResults: [],
    });

    // Mock data store error
    mockDataStore.createRecord.mockRejectedValue(
      new DataStoreError('データベースへの保存に失敗しました。しばらく後に再度お試しください。')
    );

    await expect(saveMappingDetails(input)).rejects.toThrow(DataStoreError);
    await expect(saveMappingDetails(input)).rejects.toThrow('データベースへの保存に失敗しました。しばらく後に再度お試しください。');
  });
});
