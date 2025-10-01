#!/usr/bin/env python3
"""
取得した画像ファイルIDリストを使って全ての画像を公開設定に変更
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

def make_file_public(drive_service, file_id):
    """個別ファイルを公開設定に変更"""
    try:
        # ファイル情報を取得
        file_info = drive_service.files().get(fileId=file_id).execute()
        file_name = file_info.get('name', file_id)
        
        # 既存の権限を確認
        permissions = drive_service.permissions().list(fileId=file_id).execute()
        
        # 既に公開されているかチェック
        for permission in permissions.get('permissions', []):
            if permission.get('type') == 'anyone':
                print(f"✓ 既に公開済み: {file_name}")
                return True, file_name
        
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
        return True, file_name
        
    except Exception as e:
        print(f"❌ エラー: {file_id} - {str(e)}")
        return False, file_id

def make_all_images_public():
    """ファイルIDリストから全ての画像を公開設定に変更"""
    try:
        creds = get_credentials()
        drive_service = build('drive', 'v3', credentials=creds)
        
        # ファイルIDリストを読み込み
        file_ids = []
        with open('/Users/shun/image-file-ids.txt', 'r') as f:
            for line in f:
                file_id = line.strip()
                if file_id:  # 空行をスキップ
                    file_ids.append(file_id)
        
        print(f"🔍 {len(file_ids)}個の画像ファイルを処理します...")
        
        success_count = 0
        error_count = 0
        processed_files = []
        
        for i, file_id in enumerate(file_ids, 1):
            print(f"\n[{i}/{len(file_ids)}] 処理中: {file_id}")
            
            success, file_name = make_file_public(drive_service, file_id)
            
            if success:
                success_count += 1
                processed_files.append({
                    'id': file_id,
                    'name': file_name,
                    'status': 'success'
                })
            else:
                error_count += 1
                processed_files.append({
                    'id': file_id,
                    'name': file_name,
                    'status': 'error'
                })
        
        # 結果をレポート
        print(f"\n🎉 処理完了!")
        print(f"📊 総ファイル数: {len(file_ids)}")
        print(f"✅ 成功: {success_count}")
        print(f"❌ 失敗: {error_count}")
        
        # 結果をファイルに保存
        with open('/Users/shun/image-public-results.txt', 'w') as f:
            f.write(f"画像ファイル公開設定結果\n")
            f.write(f"処理日時: {str(os.popen('date').read().strip())}\n")
            f.write(f"総ファイル数: {len(file_ids)}\n")
            f.write(f"成功: {success_count}\n")
            f.write(f"失敗: {error_count}\n\n")
            
            for file_info in processed_files:
                status_mark = "✅" if file_info['status'] == 'success' else "❌"
                f.write(f"{status_mark} {file_info['name']} ({file_info['id']})\n")
        
        print(f"📄 詳細結果は /Users/shun/image-public-results.txt に保存されました")
        
        if success_count > 0:
            print(f"\n🌐 Webアプリで画像が表示されるようになりました!")
            print(f"🔗 URL: https://script.google.com/a/macros/chirijyuku.com/s/AKfycby9LxHM1NnKw42yVVHpW_E9aoQ4ZAljtPcX3hTMEKIvrKI2h1M7fhXPYF17KbZ2sNvd/exec")
        
        return success_count > 0
        
    except Exception as e:
        print(f"❌ 全体処理エラー: {str(e)}")
        return False

def main():
    print("🚀 画像ファイル一括公開設定を開始します...")
    
    if make_all_images_public():
        print("\n✨ 処理が正常に完了しました!")
    else:
        print("❌ 処理に失敗しました")

if __name__ == "__main__":
    main()