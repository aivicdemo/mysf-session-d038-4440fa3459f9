export type StoredRecord = Record<string, unknown> & { id: string };

export class DataStoreError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DataStoreError";
  }
}

type AppSettings = {
  AIVIC_API_URL?: string;
  AIVIC_APP_ID?: string;
  AIVIC_DB_TYPE?: string;
  AIVIC_TABLES?: Array<{ tableName?: string }>;
  location?: { origin?: string };
};

const settings = (): AppSettings => globalThis as unknown as AppSettings;

const endpointFor = (tableName: string, id?: string): string => {
  const app = settings();
  const tables = Array.isArray(app.AIVIC_TABLES) ? app.AIVIC_TABLES : [];
  const index = tables.findIndex((table) => table && table.tableName === tableName);
  const segment = index >= 0 ? String(index) : "by-name";
  const configured = String(app.AIVIC_API_URL || "");
  const base = configured && configured !== "REPLACE_WITH_API_URL" ? configured : String(app.location?.origin || "");
  if (!base) throw new DataStoreError("データの保存先の接続先が設定されていません。");
  const dbType = String(app.AIVIC_DB_TYPE || "dynamodb");
  const query = `?app=${encodeURIComponent(String(app.AIVIC_APP_ID || ""))}&table=${encodeURIComponent(tableName)}${dbType !== "dynamodb" ? `&db=${encodeURIComponent(dbType)}` : ""}`;
  return `${base.replace(/\/+$/, "")}/api/${segment}${id ? `/${encodeURIComponent(id)}` : ""}${query}`;
};

const request = async (tableName: string, method: string, id?: string, body?: unknown): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetch(endpointFor(tableName, id), {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof DataStoreError) throw error;
    throw new DataStoreError(`データの保存先に接続できませんでした: ${String(error)}`);
  }
  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }
  if (!response.ok) {
    const detail = parsed && typeof parsed === "object" && "error" in parsed ? String((parsed as { error: unknown }).error) : text.slice(0, 200);
    throw new DataStoreError(`データの保存先がエラーを返しました（${response.status}）: ${detail}`);
  }
  return parsed;
};

export const listRecords = async (tableName: string): Promise<StoredRecord[]> => {
  const result = await request(tableName, "GET");
  if (Array.isArray(result)) return result as StoredRecord[];
  const items = result && typeof result === "object" ? (result as { items?: unknown }).items : undefined;
  return Array.isArray(items) ? (items as StoredRecord[]) : [];
};

export const createRecord = async (tableName: string, values: Record<string, unknown>): Promise<StoredRecord> =>
  (await request(tableName, "POST", undefined, values)) as StoredRecord;

export const updateRecord = async (tableName: string, id: string, changes: Record<string, unknown>): Promise<StoredRecord> =>
  (await request(tableName, "PUT", id, changes)) as StoredRecord;

export const deleteRecord = async (tableName: string, id: string): Promise<void> => {
  await request(tableName, "DELETE", id);
};
