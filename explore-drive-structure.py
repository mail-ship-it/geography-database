#!/usr/bin/env python3
"""
Google Driveのフォルダ構造を調査して画像ファイルの場所を特定
"""

import os
from google.oauth2 import service_account
from googleapiclient.discovery import build

def get_credentials():
    """認証情報を取得"""
    service_account_file = '/Users/shun/geography-service-account-key.json'
    SCOPES = [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file'
    ]
    
    creds = service_account.Credentials.from_service_account_file(
        service_account_file, scopes=SCOPES)
    return creds

def explore_folder_structure():
    """フォルダ構造を詳細に調査"""
    try:
        creds = get_credentials()
        drive_service = build('drive', 'v3', credentials=creds)
        
        # 地理問題データベースの親フォルダID
        parent_folder_id = '1BDfVPQSQkTMABOM6Fr8qyTZIS1COhtWu'
        
        print("🔍 親フォルダの情報を取得中...")
        
        # 親フォルダの情報を取得
        try:
            parent_folder = drive_service.files().get(fileId=parent_folder_id).execute()
            print(f"📁 親フォルダ名: {parent_folder['name']}")
        except Exception as e:
            print(f"❌ 親フォルダアクセスエラー: {str(e)}")
            return
        
        # 親フォルダ内の全ファイル・フォルダを取得
        print("\n📂 親フォルダ内のコンテンツ:")
        query = f"'{parent_folder_id}' in parents"
        contents = drive_service.files().list(q=query, fields="files(id,name,mimeType)").execute()
        
        subfolders = []
        files = []
        
        for item in contents.get('files', []):
            if item['mimeType'] == 'application/vnd.google-apps.folder':
                subfolders.append(item)
                print(f"  📁 フォルダ: {item['name']} (ID: {item['id']})")
            else:
                files.append(item)
                print(f"  📄 ファイル: {item['name']} (タイプ: {item['mimeType']})")
        
        print(f"\n📊 フォルダ数: {len(subfolders)}, ファイル数: {len(files)}")
        
        # 各サブフォルダの中身も調査
        total_images = 0
        for subfolder in subfolders:
            subfolder_id = subfolder['id']
            subfolder_name = subfolder['name']
            
            print(f"\n🔍 サブフォルダ '{subfolder_name}' の中身:")
            
            # サブフォルダ内のファイルを取得
            sub_query = f"'{subfolder_id}' in parents"
            sub_contents = drive_service.files().list(q=sub_query, fields="files(id,name,mimeType)").execute()
            
            image_count = 0
            for sub_item in sub_contents.get('files', []):
                if sub_item['mimeType'].startswith('image/') or any(ext in sub_item['name'].lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                    print(f"  🖼️  画像: {sub_item['name']} (ID: {sub_item['id']})")
                    image_count += 1
                else:
                    print(f"  📄 ファイル: {sub_item['name']} (タイプ: {sub_item['mimeType']})")
            
            total_images += image_count
            print(f"  📊 このフォルダの画像数: {image_count}")
        
        print(f"\n🖼️  合計画像ファイル数: {total_images}")
        
        # さらに深い階層も調査（孫フォルダがある場合）
        print("\n🔍 さらに深い階層を調査中...")
        for subfolder in subfolders:
            check_deeper_levels(drive_service, subfolder['id'], subfolder['name'], level=1)
        
    except Exception as e:
        print(f"❌ エラー: {str(e)}")

def check_deeper_levels(drive_service, folder_id, folder_name, level=1):
    """より深い階層のフォルダを調査"""
    indent = "  " * level
    
    # このフォルダ内のサブフォルダを取得
    query = f"'{folder_id}' in parents and mimeType='application/vnd.google-apps.folder'"
    sub_folders = drive_service.files().list(q=query, fields="files(id,name)").execute()
    
    for sub_folder in sub_folders.get('files', []):
        print(f"{indent}📁 {folder_name}/{sub_folder['name']}")
        
        # この孫フォルダ内の画像ファイルを確認
        image_query = f"'{sub_folder['id']}' in parents"
        contents = drive_service.files().list(q=image_query, fields="files(id,name,mimeType)").execute()
        
        image_count = 0
        for item in contents.get('files', []):
            if item['mimeType'].startswith('image/') or any(ext in item['name'].lower() for ext in ['.jpg', '.jpeg', '.png', '.gif']):
                print(f"{indent}  🖼️  {item['name']}")
                image_count += 1
        
        if image_count > 0:
            print(f"{indent}  📊 画像数: {image_count}")
        
        # さらに深い階層があるかチェック（最大3階層まで）
        if level < 3:
            check_deeper_levels(drive_service, sub_folder['id'], f"{folder_name}/{sub_folder['name']}", level + 1)

def main():
    print("🚀 Google Driveフォルダ構造の調査を開始します...")
    explore_folder_structure()

if __name__ == "__main__":
    main()