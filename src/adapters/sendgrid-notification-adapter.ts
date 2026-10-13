import { randomUUID } from "crypto";

export interface AnomalyAlertRequest {
  recipientEmail: string;
  recipientName: string;
  anomalyType: "amount_mismatch" | "unbilled_project" | "status_inconsistency";
  projectId: string;
  projectName: string;
  details: string;
  severity: "low" | "medium" | "high";
}

export interface ProgressNotificationRequest {
  recipientEmail: string;
  recipientName: string;
  period: string;
  targetAmount: number;
  achievedAmount: number;
  progressPercentage: number;
  details: string;
}

export interface BatchNotificationRequest {
  notifications: Array<AnomalyAlertRequest | ProgressNotificationRequest>;
}

export interface NotificationResponse {
  messageId: string;
  status: "sent" | "queued" | "failed";
  timestamp: string;
}

export interface BatchNotificationResponse {
  batchId: string;
  totalCount: number;
  successCount: number;
  failureCount: number;
  results: NotificationResponse[];
  timestamp: string;
}

export interface NotificationServiceAdapter {
  sendAnomalyAlert(request: AnomalyAlertRequest): Promise<NotificationResponse>;
  sendProgressNotification(
    request: ProgressNotificationRequest
  ): Promise<NotificationResponse>;
  sendBatchNotification(
    request: BatchNotificationRequest
  ): Promise<BatchNotificationResponse>;
}

interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

interface SendGridEmailRequest {
  personalizations: Array<{
    to: Array<{ email: string; name: string }>;
    subject: string;
  }>;
  from: {
    email: string;
    name: string;
  };
  content: Array<{
    type: "text/html";
    value: string;
  }>;
  mail_settings?: {
    sandbox_mode?: {
      enable: boolean;
    };
  };
}

interface SendGridResponse {
  errors?: Array<{ message: string; field?: string }>;
}

const RETRY_DELAYS = [60000, 300000, 900000];
const MAX_RETRIES = 3;

async function sendWithRetry(
  config: SendGridConfig,
  emailRequest: SendGridEmailRequest,
  retryCount: number = 0
): Promise<string> {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(emailRequest),
    });

    if (!response.ok) {
      const errorData: SendGridResponse = await response.json();
      const errorMessage =
        errorData.errors?.[0]?.message || `HTTP ${response.status}`;
      throw new Error(`SendGrid API error: ${errorMessage}`);
    }

    const responseHeaders = response.headers;
    const messageId = responseHeaders.get("x-message-id");
    if (!messageId) {
      throw new Error("No message ID returned from SendGrid");
    }

    return messageId;
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = RETRY_DELAYS[retryCount];
      await new Promise((resolve) => setTimeout(resolve, delay));
      return sendWithRetry(config, emailRequest, retryCount + 1);
    }
    throw error;
  }
}

function buildAnomalyAlertHtml(request: AnomalyAlertRequest): string {
  const anomalyTypeLabel = {
    amount_mismatch: "金額ズレ",
    unbilled_project: "未請求案件",
    status_inconsistency: "ステータス不整合",
  }[request.anomalyType];

  const severityLabel = {
    low: "低",
    medium: "中",
    high: "高",
  }[request.severity];

  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>異常検知通知</h2>
        <p>${request.recipientName}様</p>
        <p>以下の異常が検知されました。</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">異常タイプ</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${anomalyTypeLabel}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">プロジェクト</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${request.projectName} (ID: ${request.projectId})</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">重要度</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${severityLabel}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">詳細</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${request.details}</td>
          </tr>
        </table>
        <p>ダッシュボードで詳細を確認してください。</p>
      </body>
    </html>
  `;
}

function buildProgressNotificationHtml(
  request: ProgressNotificationRequest
): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>営業進捗通知</h2>
        <p>${request.recipientName}様</p>
        <p>期間 ${request.period} の営業進捗をお知らせします。</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">目標金額</td>
            <td style="border: 1px solid #ddd; padding: 8px;">¥${request.targetAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">達成金額</td>
            <td style="border: 1px solid #ddd; padding: 8px;">¥${request.achievedAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">達成度</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${request.progressPercentage}%</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">詳細</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${request.details}</td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function isAnomalyAlertRequest(
  notification: AnomalyAlertRequest | ProgressNotificationRequest
): notification is AnomalyAlertRequest {
  return "anomalyType" in notification;
}

export function loadSendGridConfig(): SendGridConfig {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME;

  const missingVars: string[] = [];
  if (!apiKey) missingVars.push("SENDGRID_API_KEY");
  if (!fromEmail) missingVars.push("SENDGRID_FROM_EMAIL");
  if (!fromName) missingVars.push("SENDGRID_FROM_NAME");

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  return {
    apiKey,
    fromEmail,
    fromName,
  };
}

export function createSendGridNotificationAdapter(
  config: SendGridConfig
): NotificationServiceAdapter {
  return {
    async sendAnomalyAlert(
      request: AnomalyAlertRequest
    ): Promise<NotificationResponse> {
      const messageId = randomUUID();
      const emailRequest: SendGridEmailRequest = {
        personalizations: [
          {
            to: [{ email: request.recipientEmail, name: request.recipientName }],
            subject: `異常検知通知: ${request.projectName}`,
          },
        ],
        from: {
          email: config.fromEmail,
          name: config.fromName,
        },
        content: [
          {
            type: "text/html",
            value: buildAnomalyAlertHtml(request),
          },
        ],
      };

      try {
        await sendWithRetry(config, emailRequest);
        return {
          messageId,
          status: "sent",
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        throw new Error(
          `Failed to send anomaly alert after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },

    async sendProgressNotification(
      request: ProgressNotificationRequest
    ): Promise<NotificationResponse> {
      const messageId = randomUUID();
      const emailRequest: SendGridEmailRequest = {
        personalizations: [
          {
            to: [{ email: request.recipientEmail, name: request.recipientName }],
            subject: `営業進捗通知: ${request.period}`,
          },
        ],
        from: {
          email: config.fromEmail,
          name: config.fromName,
        },
        content: [
          {
            type: "text/html",
            value: buildProgressNotificationHtml(request),
          },
        ],
      };

      try {
        await sendWithRetry(config, emailRequest);
        return {
          messageId,
          status: "sent",
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        throw new Error(
          `Failed to send progress notification after ${MAX_RETRIES} retries: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    },

    async sendBatchNotification(
      request: BatchNotificationRequest
    ): Promise<BatchNotificationResponse> {
      const batchId = randomUUID();
      const results: NotificationResponse[] = [];
      let successCount = 0;
      let failureCount = 0;

      for (const notification of request.notifications) {
        try {
          let response: NotificationResponse;
          if (isAnomalyAlertRequest(notification)) {
            response = await this.sendAnomalyAlert(notification);
          } else {
            response = await this.sendProgressNotification(notification);
          }
          results.push(response);
          successCount++;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          results.push({
            messageId: randomUUID(),
            status: "failed",
            timestamp: new Date().toISOString(),
          });
          failureCount++;
        }
      }

      if (failureCount > 0) {
        throw new Error(
          `Batch notification completed with ${failureCount} failures out of ${request.notifications.length} notifications`
        );
      }

      return {
        batchId,
        totalCount: request.notifications.length,
        successCount,
        failureCount,
        results,
        timestamp: new Date().toISOString(),
      };
    },
  };
}
