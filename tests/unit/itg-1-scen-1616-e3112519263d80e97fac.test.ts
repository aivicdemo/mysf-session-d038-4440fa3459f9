import { prepareMonthlyClosing, InvalidClosingInstructionId } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1616: 商談ID空または不正形式時、ステータス検証でエラー発生', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should raise InvalidClosingInstructionId error when closingInstructionId is empty', async () => {
    const result = prepareMonthlyClosing({
      closingInstructionId: '',
      targetMonth: '2024-12',
      operatorUserId: 'USR-001',
      executionTimestamp: new Date('2025-01-15T09:00:00Z')
    });

    await expect(result).rejects.toThrow(InvalidClosingInstructionId);
  });
});
