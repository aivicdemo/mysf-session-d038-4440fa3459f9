import { prepareMonthlyClosing, InvalidClosingInstructionId } from '../../src/logic/monthly-closing-preparation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-1577: 商談ID空または不正形式でエラー発生し検証中断', () => {
  it('closingInstructionIdが空文字列の場合、InvalidClosingInstructionIdエラーを発生させる', async () => {
    const input = {
      closingInstructionId: '',
      targetMonth: '2024-11',
      operatorUserId: 'user-001',
      executionTimestamp: new Date('2024-12-01T09:00:00Z'),
    };

    await expect(prepareMonthlyClosing(input)).rejects.toThrow(InvalidClosingInstructionId);
    await expect(prepareMonthlyClosing(input)).rejects.toThrow('月次締め確認指示が見つかりません。指示IDを確認してください。');
  });
});
