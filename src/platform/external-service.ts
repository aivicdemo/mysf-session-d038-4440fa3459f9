export type ExternalServiceRequest = {
  method?: string;
  path: string;
  query?: Record<string, string | number | boolean | null | undefined>;
  headers?: Record<string, string>;
  body?: unknown;
};

export type ExternalServiceResponse = {
  status: number;
  contentType: string;
  body: string;
};

export type ExternalServiceTransport = (request: ExternalServiceRequest) => Promise<ExternalServiceResponse>;

export class ExternalServiceError extends Error {
  readonly code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = "ExternalServiceError";
    this.code = code;
  }
}

type AppSettings = {
  AIVIC_GATEWAY_URL?: string;
  AIVIC_APP_ID?: string;
};

export const callExternalService = async (
  connectionId: string,
  request: ExternalServiceRequest,
): Promise<ExternalServiceResponse> => {
  const app = globalThis as unknown as AppSettings;
  const gatewayUrl = String(app.AIVIC_GATEWAY_URL || "").replace(/\/+$/, "");
  if (!gatewayUrl) {
    throw new ExternalServiceError("このアプリでは外部サービス連携の受け口が用意されていません。", "not_available");
  }
  let response: Response;
  try {
    response = await fetch(
      `${gatewayUrl}/ext/${encodeURIComponent(connectionId)}?app=${encodeURIComponent(String(app.AIVIC_APP_ID || ""))}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(request) },
    );
  } catch (error) {
    throw new ExternalServiceError(`外部サービス連携の受け口に接続できませんでした: ${String(error)}`, "unreachable");
  }
  const text = await response.text();
  let parsed: Record<string, unknown> = {};
  try {
    parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    parsed = {};
  }
  if (!response.ok) {
    throw new ExternalServiceError(
      String(parsed.error || `外部サービス連携の受け口がエラーを返しました（${response.status}）。`),
      String(parsed.code || "gateway_error"),
    );
  }
  return {
    status: Number(parsed.status || 0),
    contentType: String(parsed.contentType || ""),
    body: String(parsed.body || ""),
  };
};

export const transportFor = (connectionId: string): ExternalServiceTransport =>
  (request) => callExternalService(connectionId, request);
