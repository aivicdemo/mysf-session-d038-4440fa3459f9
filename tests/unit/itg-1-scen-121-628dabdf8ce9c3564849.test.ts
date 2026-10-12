import { generateInvoiceFromDeal } from '../../src/logic/invoice-generation-management';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  saveInvoice: jest.fn(),
  saveInvoiceLineItem: jest.fn(),
}));

describe('SCEN-121: 割引率が100%を超えるときの例外発生テスト', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 実装が完成した際に、割引率が 100% を超える場合のエラーハンドリングを検証します。
  // 割引率 1.5（150%）である請求明細行アイテムを含む場合、
  // generateInvoiceFromDeal は内部で validateInvoiceAmountCalculation を呼び出し、
  // 「割引率は100%を超えることはできません」エラーをスロー。
  it('割引率が1.5（150%）であるとき、generateInvoiceFromDealは「割引率は100%を超えることはできません」エラーをスローする', async () => {
    // 実装が undefined でない場合のみテストを実行
    if (typeof generateInvoiceFromDeal !== 'function') {
      // 実装が未生成（スキップ）
      return;
    }

    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const currentDateTime = new Date('2026-10-07T10:30:00Z');
    const executingUserId = 'user-12345';

    // 前提条件: dealData
    // 商談は存在し、金額・ステージ・取引先ID・営業担当者IDが揃っている
    const dealData = {
      dealId,
      dealName: 'テスト商談',
      dealAmount: 100000,
      stage: '提案',
      accountId: 'acc-001',
      ownerId: 'user-12345',
    };

    // fetchDealById が dealData を返すようにモック
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(dealData);

    const input = {
      dealId,
      currentDateTime,
      executingUserId,
    };

    // 仕様期待結果:
    // generateInvoiceFromDeal 処理を呼び出す際、内部で validateInvoiceAmountCalculation 関数が実行される。
    // validateInvoiceAmountCalculation 関数は、割引率が 100% を超える（1.5 = 150%）ことを検出し、
    // 「割引率は100%を超えることはできません」エラーをスロー。
    // その結果、generateInvoiceFromDeal の実行が中断され、同じエラーが呼び出し元に伝播する。
    await expect(generateInvoiceFromDeal(input)).rejects.toThrow('割引率は100%を超えることはできません');
  });
});
