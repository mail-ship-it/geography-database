#!/usr/bin/env python3
"""
画像から問題文を読み取り、Google Sheetsに書き込むスクリプト
Claude Code経由で実行する際に使用
"""

import json
import requests
import base64
import time
import sys
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

# 設定
SPREADSHEET_ID = '1eqwocYOk34aANN78AuRzocV6l7NJll79yI_YOR3eocw'

def get_sheets_client():
    """Google Sheets クライアントを取得"""
    with open('.env.local', 'r') as f:
        content = f.read()
    for line in content.split('\n'):
        if line.startswith('GOOGLE_SERVICE_ACCOUNT_KEY='):
            key_json = line[len('GOOGLE_SERVICE_ACCOUNT_KEY='):]
            break

    creds = Credentials.from_service_account_info(
        json.loads(key_json),
        scopes=['https://www.googleapis.com/auth/spreadsheets']
    )
    return build('sheets', 'v4', credentials=creds)

def convert_drive_url(url):
    """Google Drive URLを直接アクセス可能な形式に変換"""
    if not url:
        return None

    # FILE_IDを抽出
    file_id = None

    # 形式1: https://drive.google.com/uc?export=view&id=FILE_ID
    if 'id=' in url:
        import re
        match = re.search(r'[?&]id=([a-zA-Z0-9-_]+)', url)
        if match:
            file_id = match.group(1)

    # 形式2: https://drive.google.com/file/d/FILE_ID/view
    if not file_id and '/file/d/' in url:
        import re
        match = re.search(r'/file/d/([a-zA-Z0-9-_]+)', url)
        if match:
            file_id = match.group(1)

    if file_id:
        return f"https://lh3.googleusercontent.com/d/{file_id}"

    return url

def get_questions_needing_ocr(sheets, sheet_name):
    """OCRが必要な問題のリストを取得"""
    result = sheets.spreadsheets().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=f"'{sheet_name}'!A:L"
    ).execute()
    rows = result.get('values', [])

    if len(rows) <= 1:
        return []

    questions = []
    for i, row in enumerate(rows[1:], start=2):
        question_id = row[1] if len(row) > 1 else ''
        i_val = row[8] if len(row) > 8 else ''  # 問題文
        l_val = row[11] if len(row) > 11 else ''  # 画像URL

        if l_val.strip() and not i_val.strip():
            questions.append({
                'row': i,
                'question_id': question_id,
                'image_url': convert_drive_url(l_val)
            })

    return questions

def download_image(url):
    """画像をダウンロードしてbase64エンコード"""
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            return base64.b64encode(response.content).decode('utf-8')
    except Exception as e:
        print(f"画像ダウンロードエラー: {e}")
    return None

def main():
    sheets = get_sheets_client()

    # シート一覧取得
    spreadsheet = sheets.spreadsheets().get(spreadsheetId=SPREADSHEET_ID).execute()
    sheet_names = [s['properties']['title'] for s in spreadsheet['sheets']]
    year_sheets = [s for s in sheet_names if '年' in s and '試験' in s]

    # 指定されたシートのみ処理（コマンドライン引数で指定可能）
    if len(sys.argv) > 1:
        target_sheet = sys.argv[1]
        if target_sheet in year_sheets:
            year_sheets = [target_sheet]
        else:
            print(f"シート '{target_sheet}' が見つかりません")
            return

    for sheet_name in year_sheets:
        questions = get_questions_needing_ocr(sheets, sheet_name)
        if not questions:
            print(f"{sheet_name}: OCR必要な問題なし")
            continue

        print(f"\n{sheet_name}: {len(questions)}問をOCR処理")

        for q in questions:
            print(f"  {q['question_id']}: {q['image_url']}")

if __name__ == '__main__':
    main()
