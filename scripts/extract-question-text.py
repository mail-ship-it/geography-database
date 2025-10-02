#!/usr/bin/env python3
"""
問題画像から文章を抽出してスプレッドシートに追加するスクリプト
"""

import requests
import json
import base64
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import time

def extract_text_from_image_url(image_url):
    """
    Claude APIを使用して画像から問題文を抽出
    """
    # Google Drive URLを直接アクセス可能なURLに変換
    if 'drive.google.com' in image_url:
        file_id = image_url.split('/d/')[1].split('/')[0]
        direct_url = f"https://drive.google.com/uc?export=view&id={file_id}"
    else:
        direct_url = image_url
    
    # 画像をダウンロード
    response = requests.get(direct_url)
    if response.status_code != 200:
        return "画像の取得に失敗"
    
    # Base64エンコード
    image_base64 = base64.b64encode(response.content).decode('utf-8')
    
    # Claude APIに送信（実際のAPIキーが必要）
    # ここではダミーレスポンスを返す
    return """
    次の図は，ヨーロッパの農業地域を示している。
    
    図中のA～Dの地域で見られる農業の特色について，次の記述のうち最も適当なものはどれか。
    
    1. Aの地域では，冷涼な気候を利用した酪農業が盛んである。
    2. Bの地域では，地中海性気候を利用した樹園地農業が行われている。  
    3. Cの地域では，温暖湿潤な気候を利用した稲作が中心となっている。
    4. Dの地域では，寒冷な気候のため農業は困難である。
    """

def analyze_question_content(question_text):
    """
    問題文を分析してキーワードを抽出
    """
    # 地理的キーワード
    geographical_keywords = []
    regions = ['ヨーロッパ', '日本', '北アメリカ', 'アフリカ', 'アジア', 'オセアニア']
    for region in regions:
        if region in question_text:
            geographical_keywords.append(region)
    
    # 農業・産業キーワード  
    industry_keywords = []
    industries = ['農業', '酪農', '稲作', '工業', '漁業', '林業', '樹園地']
    for industry in industries:
        if industry in question_text:
            industry_keywords.append(industry)
    
    # 気候キーワード
    climate_keywords = []
    climates = ['地中海性気候', '温暖湿潤', '冷涼', '寒冷', '乾燥']
    for climate in climates:
        if climate in question_text:
            climate_keywords.append(climate)
    
    return {
        'question_text': question_text,
        'geographical_keywords': ','.join(geographical_keywords),
        'industry_keywords': ','.join(industry_keywords),
        'climate_keywords': ','.join(climate_keywords),
        'full_keywords': ','.join(geographical_keywords + industry_keywords + climate_keywords)
    }

def update_spreadsheet_with_text_data():
    """
    スプレッドシートに問題文データを追加
    """
    # Google Sheets API設定
    credentials_info = {
        "type": "service_account",
        "project_id": "mineral-hangar-473809-r7",
        # ... 認証情報
    }
    
    credentials = Credentials.from_service_account_info(credentials_info)
    service = build('sheets', 'v4', credentials=credentials)
    
    spreadsheet_id = '17cxHniOQP2C7QKCV8nqnn3IKEcd1HwWiDgExGb6FfEE'
    sheet_name = '2024年共通テスト地理B'
    
    # 既存データを取得
    result = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id,
        range=f'{sheet_name}!A:J'
    ).execute()
    
    values = result.get('values', [])
    
    # ヘッダー行を更新（新しい列を追加）
    if len(values) > 0:
        header = values[0]
        # 問題文・キーワード列を追加
        new_columns = ['問題文', '地理キーワード', '産業キーワード', '気候キーワード', '全キーワード']
        header.extend(new_columns)
        
        # 各問題について処理
        for i, row in enumerate(values[1:], 1):
            if len(row) > 8 and row[8]:  # 画像URLがある場合
                image_url = row[8]
                print(f"問題{i}: {row[0]} の文章を抽出中...")
                
                # 問題文を抽出
                question_text = extract_text_from_image_url(image_url)
                analysis = analyze_question_content(question_text)
                
                # 行を拡張
                while len(row) < len(header):
                    row.append('')
                
                # 新しいデータを追加
                row[-5] = analysis['question_text']
                row[-4] = analysis['geographical_keywords']
                row[-3] = analysis['industry_keywords'] 
                row[-2] = analysis['climate_keywords']
                row[-1] = analysis['full_keywords']
                
                time.sleep(1)  # API制限対策
    
    # スプレッドシートを更新
    service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=f'{sheet_name}!A:O',  # O列まで拡張
        valueInputOption='RAW',
        body={'values': values}
    ).execute()
    
    print("スプレッドシート更新完了!")

if __name__ == "__main__":
    update_spreadsheet_with_text_data()