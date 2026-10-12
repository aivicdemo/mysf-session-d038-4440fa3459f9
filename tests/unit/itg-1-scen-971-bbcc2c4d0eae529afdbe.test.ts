import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import type { DeleteRecordInput } from "../../src/logic/data-persistence";
import { deleteRecord, RecordNotFoundError } from "../../src/logic/data-persistence";

jest.mock("../../src/platform/data-store", () => ({
  ...jest.requireActual<typeof import("../../src/platform/data-store")>("../../src/platform/data-store"),
  listRecords: jest.fn(),
  deleteRecord: jest.fn(),
}));

import * as dataStore from "../../src/platform/data-store";

describe("SCEN-971: 削除対象レコードが存在しない場合、RecordNotFoundErrorが発生", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should throw RecordNotFoundError when record does not exist", async () => {
    (dataStore.listRecords as any).mockResolvedValue([]);

    const input: DeleteRecordInput = {
      targetTableName: "取引先",
      targetRecordId: "550e8400-e29b-41d4-a716-446655440000",
    };

    await expect(deleteRecord(input)).rejects.toThrow(RecordNotFoundError);
    await expect(deleteRecord(input)).rejects.toThrow(
      "削除対象のレコードが見つかりません。テーブル: 取引先, ID: 550e8400-e29b-41d4-a716-446655440000"
    );

    expect(dataStore.listRecords).toHaveBeenCalledWith("取引先");
  });
});
