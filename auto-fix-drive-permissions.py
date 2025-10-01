#!/usr/bin/env python3
"""
Google Drive APIを使って全ての問題画像ファイルを一括で公開設定に変更
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

def make_file_public(drive_service, file_id, file_name):
    """個別ファイルを公開設定に変更"""
    try:
        # 既存の権限を確認
        permissions = drive_service.permissions().list(fileId=file_id).execute()
        
        # 既に公開されているかチェック
        for permission in permissions.get('permissions', []):
            if permission.get('type') == 'anyone':
                print(f"✓ 既に公開済み: {file_name}")
                return True
        
        # 公開権限を追加
        permission = {
            'type': 'anyone',
            'role': 'reader'
        }
        
        drive_service.permissions().create(
            fileId=file_id,
            body=permission
        ).execute()
        
        print(f"✅ 公開設定完了: {file_name}")
        return True
        
    except Exception as e:
        print(f"❌ エラー: {file_name} - {str(e)}")
        return False

def list_and_make_public_all_images():
    """全ての画像ファイルを検索して公開設定に変更"""
    try:
        creds = get_credentials()
        drive_service = build('drive', 'v3', credentials=creds)
        
        # 地理問題データベースの親フォルダID
        parent_folder_id = '1BDfVPQSQkTMABOM6Fr8qyTZIS1COhtWu'
        
        print("🔍 フォルダ構造を取得中...")
        
        # 親フォルダ内のサブフォルダを取得
        query = f"'{parent_folder_id}' in parents and mimeType='application/vnd.google-apps.folder'"
        subfolders = drive_service.files().list(q=query).execute()
        
        total_processed = 0
        total_success = 0
        
        for subfolder in subfolders.get('files', []):
            subfolder_id = subfolder['id']
            subfolder_name = subfolder['name']
            
            print(f"\n📁 処理中フォルダ: {subfolder_name}")
            
            # サブフォルダ内の画像ファイルを取得
            image_query = f"'{subfolder_id}' in parents and (mimeType contains 'image/' or name contains '.jpg' or name contains '.png' or name contains '.jpeg')"
            images = drive_service.files().list(q=image_query).execute()
            
            for image in images.get('files', []):
                image_id = image['id']
                image_name = image['name']
                
                if make_file_public(drive_service, image_id, image_name):
                    total_success += 1
                total_processed += 1
        
        print(f"\n🎉 処理完了!")
        print(f"📊 処理したファイル数: {total_processed}")
        print(f"✅ 成功したファイル数: {total_success}")
        print(f"❌ 失敗したファイル数: {total_processed - total_success}")
        
        return True
        
    except Exception as e:
        print(f"❌ 全体処理エラー: {str(e)}")
        return False

def main():
    print("🚀 Google Drive画像ファイルの一括公開設定を開始します...")
    
    if list_and_make_public_all_images():
        print("\n✨ 全ての処理が完了しました!")
        print("🌐 Webアプリで画像が表示されるようになりました")
        print("📱 WebアプリURL: https://script.google.com/a/macros/chirijyuku.com/s/AKfycby9LxHM1NnKw42yVVHpW_E9aoQ4ZAljtPcX3hTMEKIvrKI2h1M7fhXPYF17KbZ2sNvd/exec")
    else:
        print("❌ 処理に失敗しました")

if __name__ == "__main__":
    main()