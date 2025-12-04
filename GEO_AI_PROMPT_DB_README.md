# 地理AIプロンプトデータベース

共通テスト地理の「図表教材」をAIに扱わせるための対話用プロンプトデータベース。

## 概要

このシステムは、共通テスト地理の図表（グラフ、地図、気候図など）について、AI（ChatGPT/Claudeなど）が生徒と対話しながら理解を深めるためのプロンプトをGoogleスプレッドシートで管理します。

### 用途

- ChatGPT / Claude などのベースプロンプトとして読み込む
- 自作のNext.jsアプリから参照する
- 地理塾での教材データベースとして活用

## スプレッドシート情報

- **スプレッドシート名**: 地理AIプロンプトDB
- **スプレッドシートID**: `1DOE8cJNxf4SkosUooveiGQTQuod1uzdJK3n9wS4O5G4`
- **URL**: https://docs.google.com/spreadsheets/d/1DOE8cJNxf4SkosUooveiGQTQuod1uzdJK3n9wS4O5G4

## シート構成

単元ごとにシートを分割して管理：

- **農業・水産業** （サンプルデータあり）
- 気候
- 地形
- 工業
- 人口・都市
- 貿易・資源
- 自然環境・防災
- 地誌・その他

## 列構造（全シート共通）

| 列名 | 説明 | 例 |
|------|------|-----|
| No | 一意のID | FISH_001 |
| 図表のテーマ | 図表の題名 | 世界の水産業の推移 |
| 説明対象 | 国・地域名など | 中国、日本、ペルー |
| 図の種類 | グラフタイプ | 折れ線グラフ、地図、気候グラフ |
| キー概念 | 重要キーワード | 養殖業, 漁獲量, エルニーニョ |
| AIプロンプト（要約版） | 短めの説明 | 中国は1990年以降急増... |
| 詳細プロンプト（完全版） | AIに渡す長文プロンプト | 対話の流れ、指導ポイントなど |
| 関連単元 | 関連する単元 | 農業・水産業, 貿易, 人口 |
| 因果の型 | 因果関係のパターン | 自然条件 × 人間活動 |
| タグ | 検索用キーワード | 水産業, 養殖, 中国, 日本 |
| 備考 | メモ欄 | 教科書対応情報など |

## セットアップ

### 前提条件

1. Python 3.x がインストール済み
2. Google認証が設定済み（`~/google_auth_template.py`）
3. 必要なパッケージがインストール済み：
   ```bash
   pip install gspread google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
   ```

### 認証設定

`~/google_auth_template.py` が既に設定されている場合は、そのまま使用できます。

設定されていない場合：
1. Google Cloud Console でプロジェクトを作成
2. Google Sheets API と Google Drive API を有効化
3. OAuth 2.0 認証情報を作成
4. `credentials.json` を `~/.config/gspread/credentials.json` に配置

## 使い方

### 1. 新規スプレッドシートを作成

```bash
cd /Users/shun/geography-db
python3 geography_ai_prompt_db.py --create-new
```

実行結果：
- 新しいスプレッドシートが作成されます
- 「農業・水産業」シートが作成されます
- ヘッダー行が設定されます
- サンプルデータ「世界の水産業の動向」が1件登録されます

### 2. 既存スプレッドシートを使用

```bash
python3 geography_ai_prompt_db.py --spreadsheet-id YOUR_SPREADSHEET_ID
```

### 3. 環境変数で指定

```bash
export GEO_AI_PROMPT_SPREADSHEET_ID=YOUR_SPREADSHEET_ID
python3 geography_ai_prompt_db.py
```

## スクリプトの主要機能

### `create_new_spreadsheet(gc, title)`
新規スプレッドシートを作成

### `get_or_create_sheet(gc, spreadsheet_id, sheet_name)`
指定されたシートを取得、存在しなければ作成

### `setup_sheet_headers(worksheet)`
共通ヘッダー行を設定

### `add_prompt_data(worksheet, data_row)`
プロンプトデータを1行追加

## サンプルデータ

「農業・水産業」シートには、以下のサンプルデータが登録されています：

- **No**: FISH_001
- **図表のテーマ**: 世界の水産業の推移
- **説明対象**: 中国、日本、ペルー、インド、インドネシア
- **図の種類**: 折れ線グラフ
- **キー概念**: 養殖業, 漁獲量, 資源枯渇, エルニーニョ, 人口増加

詳細プロンプトには、以下の構造の対話フローが含まれています：
1. 図の種類と目的
2. 数値的特徴
3. 国ごとのパターン比較
4. 理由の説明（自然要因 × 人間要因）
5. 他単元との関連
6. 共通テストでの出題パターン

## 他の単元シートを追加する方法

### Pythonスクリプトで追加

```python
#!/usr/bin/env python3
import sys
import os
sys.path.append(os.path.expanduser('~'))

from google_auth_template import get_google_services
from geography_ai_prompt_db import get_or_create_sheet, setup_sheet_headers, add_prompt_data

# 認証
drive_service, sheets_service, gc = get_google_services()

# スプレッドシートID
SPREADSHEET_ID = '1DOE8cJNxf4SkosUooveiGQTQuod1uzdJK3n9wS4O5G4'

# 「気候」シートを作成
worksheet = get_or_create_sheet(gc, SPREADSHEET_ID, '気候')
setup_sheet_headers(worksheet)

# データを追加
climate_data = [
    'CLIMATE_001',  # No
    'ケッペンの気候区分',  # 図表のテーマ
    '世界全体',  # 説明対象
    '地図',  # 図の種類
    '気温, 降水量, 植生, 緯度',  # キー概念
    '世界の気候区分を理解し、各気候帯の特徴を説明させる対話用プロンプト',  # 要約版
    '（詳細プロンプトをここに記述）',  # 完全版
    '気候, 自然環境',  # 関連単元
    '自然条件',  # 因果の型
    '気候, ケッペン, 熱帯, 乾燥帯, 温帯',  # タグ
    '教科書p.XX対応'  # 備考
]

add_prompt_data(worksheet, climate_data)
print("✓ 気候シートにデータを追加しました")
```

### 手動で追加

1. スプレッドシートを開く：https://docs.google.com/spreadsheets/d/1DOE8cJNxf4SkosUooveiGQTQuod1uzdJK3n9wS4O5G4
2. 下部の「+」ボタンで新しいシートを作成
3. シート名を変更（例：「気候」）
4. 1行目に共通ヘッダーをコピー&ペースト
5. 2行目以降にデータを入力

## Next.jsアプリからの参照例

```typescript
// lib/geoAiPromptDb.ts
import { google } from 'googleapis';

const SPREADSHEET_ID = '1DOE8cJNxf4SkosUooveiGQTQuod1uzdJK3n9wS4O5G4';

export async function getPromptsByUnit(unitName: string) {
  const sheets = google.sheets({ version: 'v4', auth: /* 認証 */ });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${unitName}!A2:K`,  // 2行目以降のデータ
  });

  const rows = response.data.values || [];
  return rows.map(row => ({
    no: row[0],
    theme: row[1],
    target: row[2],
    chartType: row[3],
    keyConcepts: row[4],
    shortPrompt: row[5],
    detailedPrompt: row[6],
    relatedUnits: row[7],
    causalType: row[8],
    tags: row[9],
    notes: row[10],
  }));
}

// 使用例
const fisheryPrompts = await getPromptsByUnit('農業・水産業');
```

## ChatGPT / Claude での利用例

### 1. スプレッドシートをCSVとしてエクスポート

1. スプレッドシートを開く
2. ファイル → ダウンロード → カンマ区切り形式（.csv）
3. 必要なシートをダウンロード

### 2. AIにプロンプトとして読み込ませる

```
以下のCSVファイルには、共通テスト地理の図表教材について、
生徒と対話しながら理解を深めるためのプロンプトが含まれています。

[CSVファイルの内容を貼り付け]

この中から「世界の水産業の推移」（FISH_001）の詳細プロンプトに従って、
生徒役の私と対話してください。
```

## トラブルシューティング

### 認証エラーが出る

```bash
# トークンをリセット
rm ~/.config/gspread/token.pickle

# 再実行
python3 geography_ai_prompt_db.py --create-new
```

### スプレッドシートが見つからない

スプレッドシートIDが正しいか確認してください：
```bash
python3 geography_ai_prompt_db.py --spreadsheet-id 1DOE8cJNxf4SkosUooveiGQTQuod1uzdJK3n9wS4O5G4
```

### Deprecation Warning が出る

最新版のgspreadを使用してください：
```bash
pip install --upgrade gspread
```

## ファイル構成

```
/Users/shun/geography-db/
├── geography_ai_prompt_db.py     # メインスクリプト
├── GEO_AI_PROMPT_DB_README.md    # このファイル
└── /Users/shun/
    └── google_auth_template.py   # 認証モジュール
```

## 今後の拡張案

1. 他の単元シート（気候、地形、工業など）にデータを追加
2. タグによる検索機能の実装
3. Web UI での閲覧・編集機能
4. 自動バックアップ機能
5. 画像URLの統合（Google Driveとの連携）
6. プロンプトテンプレートの自動生成機能

## 関連リンク

- スプレッドシート: https://docs.google.com/spreadsheets/d/1DOE8cJNxf4SkosUooveiGQTQuod1uzdJK3n9wS4O5G4
- Google Sheets API ドキュメント: https://developers.google.com/sheets/api
- gspread ドキュメント: https://docs.gspread.org/

## ライセンス

このプロジェクトは教育目的で使用されます。
