import { deleteMappingValidationResult, ValidationResultNotFoundError } from '../../src/logic/mapping-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-224: deleteMappingValidationResult - ValidationResultNotFoundError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ValidationResultNotFoundError when validation result record does not exist', async () => {
    const validationResultId = '550e8400-e29b-41d4-a716-446655440000';
    const projectId = '660e8400-e29b-41d4-a716-446655440001';
    const userId = '770e8400-e29b-41d4-a716-446655440002';
    const operationTimestamp = '2026-10-07T10:30:00.000Z';

    // Mock data store to return empty array (no validation result found)
    (dataStore.listRecords as jest.Mock).mockResolvedValue([]);

    // Call the function and expect it to throw ValidationResultNotFoundError
    await expect(
      deleteMappingValidationResult({
        validationResultId,
        projectId,
        userId,
        operationTimestamp,
      })
    ).rejects.toThrow(new ValidationResultNotFoundError(
      `マッピング検証結果レコード（ID: ${validationResultId}）が見つかりません。`
    ));
  });
});
