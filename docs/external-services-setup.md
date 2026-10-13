# 外部サービス接続設定手順

<!-- aivic-external-service-format: 2 -->

「営業プロセス・請求データ統合管理システム」 が利用する外部サービスの接続設定手順です。 設定値は稼働環境の環境変数として与えます。 ソースコードに直接書き込まないでください。

## SendGrid

用途: 営業担当者・取引先への異常検知・金額ズレ・未請求案件の自動通知
実装ファイル: `src/adapters/sendgrid-notification-adapter.ts`

### 必要な設定値

| 環境変数 | 用途 | 取得方法 |
| --- | --- | --- |
| `SENDGRID_API_KEY` | SendGrid Web API への認証に使う API キー | SendGrid の管理画面（Settings > API Keys）で発行する。発行時に「Mail Send」権限を含めること |
| `SENDGRID_FROM_EMAIL` | 通知メールの送信元メールアドレス | SendGrid で認証済みの送信者メールアドレスを指定。事前に SendGrid の管理画面で Sender Authentication を完了する必要がある |
| `SENDGRID_FROM_NAME` | 通知メールの送信元表示名 | 営業部門など、受信者に表示される送信元の名前を指定 |

### 接続手順

1. SendGrid と契約し、アカウントを作成する
2. SendGrid 管理画面で送信者メールアドレスを認証する（Sender Authentication）
3. SendGrid 管理画面の Settings > API Keys から API キーを生成する。権限は「Mail Send」を選択
4. 生成された API キーを SENDGRID_API_KEY として稼働環境の環境変数に設定する
5. 認証済みの送信者メールアドレスを SENDGRID_FROM_EMAIL に、表示名を SENDGRID_FROM_NAME に設定する
6. NotificationServiceAdapter から sendAnomalyAlert / sendProgressNotification / sendBatchNotification を呼び出して疎通確認を行う

## Amazon S3

用途: 請求書・請求明細の自動生成・PDF出力・ファイル保存
実装ファイル: `src/adapters/amazon-s3-file-storage.ts`

### 必要な設定値

| 環境変数 | 用途 | 取得方法 |
| --- | --- | --- |
| `AWS_ACCESS_KEY_ID` | Amazon S3 へのアクセスを認証するためのアクセスキー ID | AWS マネジメントコンソールの IAM ユーザー設定画面で発行する |
| `AWS_SECRET_ACCESS_KEY` | Amazon S3 へのアクセスを認証するためのシークレットアクセスキー | AWS マネジメントコンソールの IAM ユーザー設定画面で発行する |
| `AWS_S3_BUCKET_NAME` | 請求書 PDF を保存する S3 バケット名 | AWS マネジメントコンソールで S3 バケットを作成し、そのバケット名を指定する |
| `AWS_S3_REGION` | S3 バケットが配置されている AWS リージョン | AWS マネジメントコンソールで S3 バケットを作成したときのリージョンを指定する（例: ap-northeast-1） |
| `AWS_S3_PRESIGNED_URL_EXPIRATION_SECONDS` | 署名付き URL の有効期限（秒単位）。最大 43200 秒（12 時間） | 業務要件に応じて設定する。ダウンロードリンクの有効期間を秒単位で指定（例: 3600 = 1 時間） |

### 接続手順

1. AWS アカウントを契約し、マネジメントコンソールにアクセスする
2. IAM ユーザーを作成し、S3 へのアクセス権限を付与する
3. IAM ユーザーのアクセスキー ID とシークレットアクセスキーを発行する
4. S3 バケットを作成し、バケット名とリージョンを確認する
5. 稼働環境の環境変数に AWS_ACCESS_KEY_ID、AWS_SECRET_ACCESS_KEY、AWS_S3_BUCKET_NAME、AWS_S3_REGION、AWS_S3_PRESIGNED_URL_EXPIRATION_SECONDS を設定する
6. FileStorageAdapter の各操作（uploadInvoicePdf、generateDownloadUrl、deleteExpiredFiles）の疎通確認を行う
