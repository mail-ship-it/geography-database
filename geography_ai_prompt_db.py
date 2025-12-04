#!/usr/bin/env python3
"""
地理AIプロンプトデータベース管理スクリプト

共通テスト地理の図表教材をAIに扱わせるための
対話用プロンプトデータベースをGoogleスプレッドシートで管理する。

使用例:
    # 新規スプレッドシート作成
    python geography_ai_prompt_db.py --create-new

    # 既存スプレッドシートを使用
    python geography_ai_prompt_db.py --spreadsheet-id YOUR_SHEET_ID

    # 環境変数で指定
    export GEO_AI_PROMPT_SPREADSHEET_ID=YOUR_SHEET_ID
    python geography_ai_prompt_db.py
"""

import sys
import os
import argparse
sys.path.append(os.path.expanduser('~'))

from google_auth_template import get_google_services
from typing import List, Dict, Optional

# 環境変数からスプレッドシートIDを取得（デフォルト値も用意）
SPREADSHEET_ID = os.getenv('GEO_AI_PROMPT_SPREADSHEET_ID', '')

# 共通の列ヘッダー定義
COMMON_HEADERS = [
    'No',
    '図表のテーマ',
    '説明対象',
    '図の種類',
    'キー概念',
    'AIプロンプト（要約版）',
    '詳細プロンプト（完全版）',
    '関連単元',
    '因果の型',
    'タグ',
    '備考'
]

# 単元リスト（将来的に追加可能）
UNITS = [
    '農業・水産業',
    '気候',
    '地形',
    '工業',
    '人口・都市',
    '貿易・資源',
    '自然環境・防災',
    '地誌・その他'
]


def create_new_spreadsheet(gc, title: str = "地理AIプロンプトDB") -> str:
    """
    新規スプレッドシートを作成

    Args:
        gc: gspread client
        title: スプレッドシート名

    Returns:
        str: 作成されたスプレッドシートID
    """
    spreadsheet = gc.create(title)
    print(f"✓ 新規スプレッドシート「{title}」を作成しました")
    print(f"  ID: {spreadsheet.id}")
    return spreadsheet.id


def get_or_create_sheet(gc, spreadsheet_id: str, sheet_name: str):
    """
    指定されたシートを取得、存在しなければ作成する

    Args:
        gc: gspread client
        spreadsheet_id: スプレッドシートID
        sheet_name: シート名

    Returns:
        worksheet: gspreadのworksheetオブジェクト
    """
    try:
        spreadsheet = gc.open_by_key(spreadsheet_id)
    except Exception as e:
        raise ValueError(f"スプレッドシートを開けませんでした: {e}")

    # シートが存在するか確認
    try:
        worksheet = spreadsheet.worksheet(sheet_name)
        print(f"✓ シート '{sheet_name}' が見つかりました")
        return worksheet
    except:
        # シートが存在しない場合は作成
        worksheet = spreadsheet.add_worksheet(title=sheet_name, rows=100, cols=11)
        print(f"✓ シート '{sheet_name}' を新規作成しました")
        return worksheet


def setup_sheet_headers(worksheet):
    """
    シートにヘッダー行を追加（既にある場合はスキップ）

    Args:
        worksheet: gspreadのworksheetオブジェクト
    """
    # 既にヘッダーが存在するかチェック
    existing_headers = worksheet.row_values(1)

    if existing_headers == COMMON_HEADERS:
        print("  ヘッダー行は既に設定されています")
        return

    # ヘッダーを設定
    worksheet.update(values=[COMMON_HEADERS], range_name='A1:K1')
    print("  ヘッダー行を設定しました")


def add_prompt_data(worksheet, data_row: List[str]):
    """
    シートにプロンプトデータを1行追加

    Args:
        worksheet: gspreadのworksheetオブジェクト
        data_row: 追加するデータ（11列分のリスト）
    """
    if len(data_row) != 11:
        raise ValueError(f"データは11列必要です（実際: {len(data_row)}列）")

    # 次の空白行を見つける
    all_values = worksheet.get_all_values()
    next_row = len(all_values) + 1

    # データを追加
    worksheet.append_row(data_row)
    print(f"  データを{next_row}行目に追加しました")


def create_sample_fishery_data() -> List[str]:
    """
    「世界の水産業の動向」のサンプルデータを作成

    Returns:
        List[str]: 11列のデータ行
    """
    detailed_prompt = """以下の地理図表について、生徒と対話しながら理解を深める。

**図の概要**
図は「世界の水産業の動向」を示す折れ線グラフで、中国・日本・ペルー・インド・インドネシアなど主要国の漁業＋養殖業の生産量推移（1950〜2020年頃）を表す。

**対話の流れ**
対話では次の順番で問いかける：

① 図の種類と目的（何の図か、何を示しているか）
  - 「この図は何を表していると思いますか？」
  - 「縦軸・横軸は何を示していますか？」

② 数値的特徴（どの国がどの時期に増加・減少・変動しているか）
  - 「最も大きく変化している国はどこですか？」
  - 「日本の推移にはどんな特徴がありますか？」

③ 国ごとのパターン比較
  - 中国：1990年以降の急増
  - 日本：1980年代をピークに減少
  - ペルー：激しい変動（エルニーニョの影響）
  - インド・インドネシア：緩やかな増加

④ 理由の説明（自然要因と人間要因の両面から）
  - 自然要因：海流、水温、エルニーニョ現象、漁場の位置
  - 人間要因：養殖技術の発展、人口増加、輸出需要、資源管理政策、漁獲規制、経済発展

⑤ 他単元との関連
  - 人口：中国・インドの人口増加と食料需要
  - 食料問題：タンパク源としての水産物の重要性
  - 貿易：水産物の国際貿易（日本の輸入依存など）
  - 産業構造：先進国の漁業衰退と新興国の成長
  - 環境問題：乱獲による資源枯渇、持続可能な漁業

⑥ 共通テストでの出題パターン
  - グラフの読み取り（数値の増減、ピークの時期など）
  - 理由選択問題（なぜこの国だけ増加/減少したか）
  - 国ごとの特徴比較（養殖比率、漁獲対象魚種など）
  - 他の統計との組み合わせ（人口、GDP、貿易額など）

**指導上のポイント**
生徒に一度に答えを与えず、「この図で最初に注目すべき国はどれだと思う？」「なぜこの国だけ急に増えていると思う？」のように質問を返しながら、図表読解力と因果理解を促す。

特に、中国の急増については「養殖業の発展」と「人口増加による需要拡大」の両面から説明させることが重要。
"""

    return [
        'FISH_001',  # No
        '世界の水産業の推移',  # 図表のテーマ
        '中国、日本、ペルー、インド、インドネシア',  # 説明対象
        '折れ線グラフ',  # 図の種類
        '養殖業, 漁獲量, 資源枯渇, エルニーニョ, 人口増加',  # キー概念
        '中国は1990年以降に水産生産量が急増し、日本は1980年代をピークに減少している。各国の増減とその理由を自然要因と人間活動の両方から説明させる対話用プロンプト。',  # AIプロンプト（要約版）
        detailed_prompt,  # 詳細プロンプト（完全版）
        '農業・水産業, 貿易, 人口',  # 関連単元
        '自然条件 × 人間活動',  # 因果の型
        '水産業, 養殖, 中国, 日本, 漁獲量, エルニーニョ',  # タグ
        '図は教科書「世界の水産業の動向」に対応。FAOSTATデータが元。'  # 備考
    ]


def main():
    """メイン処理"""
    # コマンドライン引数のパース
    parser = argparse.ArgumentParser(description='地理AIプロンプトデータベース管理')
    parser.add_argument('--create-new', action='store_true', help='新規スプレッドシートを作成')
    parser.add_argument('--spreadsheet-id', type=str, help='既存のスプレッドシートID')
    args = parser.parse_args()

    print("=" * 60)
    print("地理AIプロンプトデータベース セットアップ")
    print("=" * 60)

    # Google認証
    print("\n[1/5] Google認証中...")
    try:
        drive_service, sheets_service, gc = get_google_services()
        print("✓ 認証成功")
    except Exception as e:
        print(f"✗ 認証エラー: {e}")
        return

    # スプレッドシートIDの確認
    global SPREADSHEET_ID

    if args.create_new:
        # 新規作成
        print("\n[2/5] 新規スプレッドシートを作成中...")
        try:
            SPREADSHEET_ID = create_new_spreadsheet(gc, "地理AIプロンプトDB")
        except Exception as e:
            print(f"✗ スプレッドシート作成エラー: {e}")
            return
    elif args.spreadsheet_id:
        # コマンドライン引数で指定
        SPREADSHEET_ID = args.spreadsheet_id
        print(f"\n[2/5] スプレッドシートID確認...")
    elif SPREADSHEET_ID:
        # 環境変数で指定
        print(f"\n[2/5] スプレッドシートID確認...")
    else:
        # 指定なし
        print("\n⚠ エラー: スプレッドシートが指定されていません")
        print("\n以下のいずれかの方法で指定してください:")
        print("  1. 新規作成: python geography_ai_prompt_db.py --create-new")
        print("  2. 既存使用: python geography_ai_prompt_db.py --spreadsheet-id YOUR_ID")
        print("  3. 環境変数: export GEO_AI_PROMPT_SPREADSHEET_ID=YOUR_ID")
        return

    print(f"使用するスプレッドシートID: {SPREADSHEET_ID}")

    # シート作成・取得
    print("\n[3/5] シート「農業・水産業」を準備中...")
    try:
        worksheet = get_or_create_sheet(gc, SPREADSHEET_ID, '農業・水産業')
    except Exception as e:
        print(f"✗ シート作成エラー: {e}")
        return

    # ヘッダー設定
    print("\n[4/5] ヘッダー行を設定中...")
    try:
        setup_sheet_headers(worksheet)
    except Exception as e:
        print(f"✗ ヘッダー設定エラー: {e}")
        return

    # サンプルデータ追加
    print("\n[5/5] サンプルデータ「世界の水産業の動向」を追加中...")
    try:
        sample_data = create_sample_fishery_data()
        add_prompt_data(worksheet, sample_data)
    except Exception as e:
        print(f"✗ データ追加エラー: {e}")
        return

    # 完了
    print("\n" + "=" * 60)
    print("✓ セットアップ完了！")
    print("=" * 60)
    print(f"\nスプレッドシートURL:")
    print(f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}")
    print(f"\nシート名: 農業・水産業")
    print(f"登録データ数: 1件")
    print("\n今後、他の単元シートを追加する場合:")
    print("  worksheet = get_or_create_sheet(gc, SPREADSHEET_ID, '気候')")
    print("  setup_sheet_headers(worksheet)")
    print("  add_prompt_data(worksheet, your_data)")
    print()


if __name__ == '__main__':
    main()
