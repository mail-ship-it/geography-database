#!/usr/bin/env python3
"""
Google Apps Script プロジェクトのconvertImageUrl関数を自動修正
"""

import re
import requests
from google.oauth2 import service_account
from googleapiclient.discovery import build

def get_credentials():
    service_account_file = '/Users/shun/geography-service-account-key.json'
    SCOPES = [
        'https://www.googleapis.com/auth/script.projects',
        'https://www.googleapis.com/auth/script.deployments'
    ]
    
    creds = service_account.Credentials.from_service_account_file(
        service_account_file, scopes=SCOPES)
    return creds

def fix_gas_code():
    """GASプロジェクトのコードを修正"""
    try:
        creds = get_credentials()
        service = build('script', 'v1', credentials=creds)
        
        # プロジェクトIDを取得 (clasp listの結果から)
        project_id = '1uVSR--THzuhHDKePsK5kXlnL3U_6ONeVNrI3fDB4XMsS66VcyUtW6zHO'
        
        # 現在のプロジェクト内容を取得
        project_content = service.projects().getContent(scriptId=project_id).execute()
        
        print("プロジェクト内容を取得しました")
        
        # Code.jsファイルを探して修正
        files = project_content.get('files', [])
        updated_files = []
        
        for file in files:
            if file['name'] == 'Code':
                print("Code.jsファイルを修正中...")
                
                # 元のconvertImageUrl関数を置き換え
                old_function = r'function convertImageUrl\(driveUrl\) \{[^}]*\}'
                
                new_function = '''function convertImageUrl(driveUrl) {
  if (!driveUrl) return '';
  
  var match = driveUrl.match(/\\/file\\/d\\/([a-zA-Z0-9-_]+)/);
  if (match) {
    var fileId = match[1];
    
    try {
      var file = DriveApp.getFileById(fileId);
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {
        console.log('共有設定変更エラー (既に設定済みの可能性): ' + e.toString());
      }
      
      return 'https://drive.google.com/uc?id=' + fileId + '&export=view';
      
    } catch (error) {
      console.log('ファイルアクセスエラー: ' + fileId + ' - ' + error.toString());
      return 'https://drive.google.com/uc?id=' + fileId + '&export=view';
    }
  }
  
  return driveUrl;
}'''
                
                # 関数を置き換え
                updated_source = re.sub(
                    r'function convertImageUrl\(driveUrl\) \{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}',
                    new_function,
                    file['source'],
                    flags=re.DOTALL
                )
                
                file['source'] = updated_source
                print("convertImageUrl関数を修正しました")
            
            updated_files.append(file)
        
        # プロジェクトを更新
        content = {'files': updated_files}
        
        updated_project = service.projects().updateContent(
            scriptId=project_id,
            body=content
        ).execute()
        
        print("✅ プロジェクトの更新が完了しました")
        
        # 新しいデプロイメントを作成
        deployment_config = {
            'versionNumber': 'HEAD',
            'manifestFileName': 'appsscript',
            'description': 'Google Drive画像表示修正 - 自動更新'
        }
        
        deployment_body = {
            'deploymentConfig': deployment_config
        }
        
        deployment = service.projects().deployments().create(
            scriptId=project_id,
            body=deployment_body
        ).execute()
        
        print("✅ 新しいデプロイメントが作成されました")
        print(f"デプロイメントID: {deployment.get('deploymentId')}")
        
        return True
        
    except Exception as e:
        print(f"エラー: {e}")
        return False

def main():
    print("Google Apps Script プロジェクトの自動修正を開始します...")
    
    if fix_gas_code():
        print("\n🎉 修正完了!")
        print("WebアプリのURL: https://script.google.com/a/macros/chirijyuku.com/s/AKfycby9LxHM1NnKw42yVVHpW_E9aoQ4ZAljtPcX3hTMEKIvrKI2h1M7fhXPYF17KbZ2sNvd/exec")
        print("数分後に画像が表示されるようになります。")
    else:
        print("❌ 修正に失敗しました")

if __name__ == "__main__":
    main()