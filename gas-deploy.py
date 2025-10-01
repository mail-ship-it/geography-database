#!/usr/bin/env python3
"""
Google Apps Script API を使用して地理問題データベースWebアプリを作成・デプロイ
"""

import json
import os
import requests
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build

# 必要なスコープ
SCOPES = [
    'https://www.googleapis.com/auth/script.projects',
    'https://www.googleapis.com/auth/script.deployments',
    'https://www.googleapis.com/auth/drive.file'
]

def get_credentials():
    """認証情報を取得"""
    # サービスアカウントキーを使用して認証
    from google.oauth2 import service_account
    
    service_account_file = '/Users/shun/geography-service-account-key.json'
    creds = service_account.Credentials.from_service_account_file(
        service_account_file, scopes=SCOPES)
    
    return creds

def create_gas_project():
    """Google Apps Scriptプロジェクトを作成"""
    try:
        creds = get_credentials()
        service = build('script', 'v1', credentials=creds)
        
        # プロジェクト作成
        project_body = {
            'title': '共通テスト地理問題データベース',
            'parentId': None  # ドライブのルートに作成
        }
        
        project = service.projects().create(body=project_body).execute()
        project_id = project['scriptId']
        
        print(f"GASプロジェクトが作成されました: {project_id}")
        return project_id, service
        
    except Exception as e:
        print(f"プロジェクト作成エラー: {e}")
        return None, None

def upload_files_to_gas(project_id, service):
    """ファイルをGASプロジェクトにアップロード"""
    try:
        # メインスクリプトファイルを読み込み
        with open('/Users/shun/geography_webapp_gas.js', 'r', encoding='utf-8') as f:
            main_script = f.read()
        
        # HTMLファイルを読み込み
        with open('/Users/shun/index.html', 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # プロジェクトの内容を更新
        content = {
            'files': [
                {
                    'name': 'Code',
                    'type': 'SERVER_JS',
                    'source': main_script
                },
                {
                    'name': 'index',
                    'type': 'HTML',
                    'source': html_content
                }
            ]
        }
        
        # ファイルをアップロード
        updated_project = service.projects().updateContent(
            scriptId=project_id,
            body=content
        ).execute()
        
        print("ファイルのアップロードが完了しました")
        return True
        
    except Exception as e:
        print(f"ファイルアップロードエラー: {e}")
        return False

def deploy_web_app(project_id, service):
    """Webアプリとしてデプロイ"""
    try:
        # デプロイメント設定
        deployment_config = {
            'versionNumber': 1,
            'manifestFileName': 'appsscript',
            'description': '共通テスト地理問題データベース - 初回デプロイ'
        }
        
        # Webアプリ設定
        web_app_config = {
            'access': 'ANYONE',  # 誰でもアクセス可能
            'executeAs': 'USER_DEPLOYING'  # デプロイしたユーザーとして実行
        }
        
        deployment_body = {
            'deploymentConfig': deployment_config,
            'description': '地理問題データベースWebアプリ'
        }
        
        # デプロイ実行
        deployment = service.projects().deployments().create(
            scriptId=project_id,
            body=deployment_body
        ).execute()
        
        deployment_id = deployment['deploymentId']
        web_app_url = deployment.get('entryPoints', [{}])[0].get('webApp', {}).get('url', '')
        
        print(f"デプロイ完了!")
        print(f"デプロイメントID: {deployment_id}")
        print(f"WebアプリURL: {web_app_url}")
        
        return web_app_url
        
    except Exception as e:
        print(f"デプロイエラー: {e}")
        return None

def main():
    """メイン処理"""
    print("Google Apps Script Webアプリの作成を開始します...")
    
    # 1. プロジェクト作成
    project_id, service = create_gas_project()
    if not project_id:
        print("プロジェクト作成に失敗しました")
        return
    
    # 2. ファイルアップロード
    if not upload_files_to_gas(project_id, service):
        print("ファイルアップロードに失敗しました")
        return
    
    # 3. Webアプリデプロイ
    web_app_url = deploy_web_app(project_id, service)
    if web_app_url:
        print(f"\n✅ 地理問題データベースWebアプリが正常に作成されました!")
        print(f"🌐 URL: {web_app_url}")
        print(f"📝 プロジェクトID: {project_id}")
    else:
        print("デプロイに失敗しました")

if __name__ == "__main__":
    main()