// AIVIC Backend Configuration
// AIVIC_APP_URL 環境変数が設定されている場合は自動セットされます
// 未設定の場合: REPLACE_WITH_API_URL を AIVIC アプリの URL（例: https://your-app.amplifyapp.com）に書き換えてください

window.AIVIC_API_URL = "REPLACE_WITH_API_URL";
window.AIVIC_TABLES = {
  "取引先": 0,
  "営業担当者": 1,
  "営業活動": 2,
  "商談": 3,
  "商談ステージマスタ": 4,
  "請求書": 5,
  "請求明細": 6,
  "営業目標": 7,
  "ユーザー権限": 8,
  "データ検証ルール": 9,
  "異常検知ログ": 10
};
