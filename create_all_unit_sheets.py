#!/usr/bin/env python3
"""
地理AIプロンプトDB - 全単元シート一括作成スクリプト

24個の単元シートを一括作成し、共通ヘッダーを設定する。
"""

import sys
import os
sys.path.append(os.path.expanduser('~'))

from google_auth_template import get_google_services
from geography_ai_prompt_db import get_or_create_sheet, setup_sheet_headers

# スプレッドシートID
SPREADSHEET_ID = '1DOE8cJNxf4SkosUooveiGQTQuod1uzdJK3n9wS4O5G4'

# 作成する単元シートのリスト
UNIT_SHEETS = [
    '地図と地理情報',
    '地形',
    '気候・植生・土壌',
    '自然災害・防災',
    '環境問題',
    '農林水産業',
    '資源・エネルギー',
    '工業',
    '第三次産業・交通・通信・貿易',
    '人口',
    '都市・村落',
    '生活文化',
    '民族・宗教・国家・領土問題',
    '日本',
    '東アジア',
    '東南アジア',
    '南アジア',
    '西アジア',
    'アフリカ',
    'ヨーロッパ',
    '北アメリカ',
    '南アメリカ',
    'オセアニア',
    'ロシア周辺'
]


def main():
    """メイン処理"""
    print("=" * 70)
    print("地理AIプロンプトDB - 全単元シート一括作成")
    print("=" * 70)
    print(f"\n作成するシート数: {len(UNIT_SHEETS)}件")
    print(f"スプレッドシートID: {SPREADSHEET_ID}")
    print()

    # Google認証
    print("[1/2] Google認証中...")
    try:
        drive_service, sheets_service, gc = get_google_services()
        print("✓ 認証成功\n")
    except Exception as e:
        print(f"✗ 認証エラー: {e}")
        return

    # 各シートを作成
    print("[2/2] シート作成中...\n")
    success_count = 0
    skip_count = 0
    error_count = 0

    for i, sheet_name in enumerate(UNIT_SHEETS, 1):
        print(f"[{i}/{len(UNIT_SHEETS)}] {sheet_name}", end=" ... ")

        try:
            # シートを取得または作成
            worksheet = get_or_create_sheet(gc, SPREADSHEET_ID, sheet_name)

            # ヘッダー行を設定
            setup_sheet_headers(worksheet)

            # 既存シートの場合はスキップカウント、新規の場合は成功カウント
            # （get_or_create_sheetの出力から判定するのは難しいので、とりあえず成功とする）
            success_count += 1
            print("✓")

        except Exception as e:
            print(f"✗ エラー: {e}")
            error_count += 1

    # 結果サマリー
    print("\n" + "=" * 70)
    print("完了")
    print("=" * 70)
    print(f"成功: {success_count}件")
    print(f"エラー: {error_count}件")
    print()
    print(f"スプレッドシートURL:")
    print(f"https://docs.google.com/spreadsheets/d/{SPREADSHEET_ID}")
    print()


if __name__ == '__main__':
    main()
