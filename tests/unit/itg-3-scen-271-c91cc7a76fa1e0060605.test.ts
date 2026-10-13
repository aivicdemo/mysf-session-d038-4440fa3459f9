import { retrieveLegacyAndNewSystemSalesData, InvalidPeriodRange } from "../../src/logic/legacy-new-system-data-retrieval";

describe("SCEN-271: 指定期間の開始日が終了日より後の場合、期間無効エラーを発生させる", () => {
  it("should throw InvalidPeriodRange error when periodStart is after periodEnd", async () => {
    await expect(
      retrieveLegacyAndNewSystemSalesData({
        periodStart: "2024-12-31",
        periodEnd: "2024-12-25",
        dealIdRange: undefined,
      })
    ).rejects.toThrow(InvalidPeriodRange);

    try {
      await retrieveLegacyAndNewSystemSalesData({
        periodStart: "2024-12-31",
        periodEnd: "2024-12-25",
        dealIdRange: undefined,
      });
      fail("Expected InvalidPeriodRange to be thrown");
    } catch (error) {
      if (error instanceof InvalidPeriodRange) {
        expect(error.message).toBe(
          "指定された期間が無効です。periodStart は periodEnd 以前の日付を ISO 8601 形式で指定してください。"
        );
      } else {
        throw error;
      }
    }
  });
});
