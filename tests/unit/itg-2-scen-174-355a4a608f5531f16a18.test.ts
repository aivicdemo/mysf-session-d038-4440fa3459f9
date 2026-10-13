import { updateMappingDetails, MappingDetailNotFoundError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';
import * as projectContextResolver from '../../src/logic/project-context-resolver';
import * as authorizationModule from '../../src/logic/authentication-authorization';
import * as validationModule from '../../src/logic/data-validation-rules';

jest.mock('../../src/platform/data-store');
jest.mock('../../src/logic/project-context-resolver');
jest.mock('../../src/logic/authentication-authorization');
jest.mock('../../src/logic/data-validation-rules');

describe('SCEN-174: updateMappingDetails - MappingDetailNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw MappingDetailNotFoundError when mapping detail record does not exist', async () => {
    const mappingDetailId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '550e8400-e29b-41d4-a716-446655440001';
    const existingFunctionName = '請求書作成機能';
    const userId = '550e8400-e29b-41d4-a716-446655440002';
    const operationTimestamp = '2026-10-07T10:30:00.000Z';

    // Setup mocks to simulate empty record search
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    await expect(
      updateMappingDetails({
        mappingDetailId,
        projectId,
        existingFunctionName,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(MappingDetailNotFoundError);

    expect(dataStore.listRecords).toHaveBeenCalledWith(
      '機能マッピング詳細',
      expect.objectContaining({ mappingDetailId })
    );
  });
});
