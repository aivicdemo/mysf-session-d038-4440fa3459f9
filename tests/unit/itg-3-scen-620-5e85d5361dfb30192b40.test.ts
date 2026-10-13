import { validateUserAuthorizationForToleranceJudgment } from '../../src/logic/authorization-validation';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  updateRecord: jest.fn(),
}));

describe('SCEN-620: validateUserAuthorizationForToleranceJudgment with table update failure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw error when table update fails during authorization validation', async () => {
    const input = {
      userId: 'user-123',
      userRole: 'DATA_ANALYST',
      userIsActive: true,
    };

    (dataStore.updateRecord as jest.Mock).mockRejectedValueOnce(new Error('Database update failed'));

    await expect(validateUserAuthorizationForToleranceJudgment(input)).rejects.toThrow('Database update failed');
  });
});
