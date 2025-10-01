#!/usr/bin/env python3
"""
Google Apps Script APIを使ってテスト関数を追加し、画像URL変換をテスト
"""

import os
import time
from google.oauth2 import service_account
from googleapiclient.discovery import build

def get_credentials():
    """認証情報を取得"""
    service_account_file = '/Users/shun/geography-service-account-key.json'
    SCOPES = [
        'https://www.googleapis.com/auth/script.projects',
        'https://www.googleapis.com/auth/script.deployments'
    ]
    
    creds = service_account.Credentials.from_service_account_file(
        service_account_file, scopes=SCOPES)
    return creds

def add_test_function_and_run():
    """テスト関数を追加して実行"""
    try:
        creds = get_credentials()
        service = build('script', 'v1', credentials=creds)
        
        project_id = '1uVSR--THzuhHDKePsK5kXlnL3U_6ONeVNrI3fDB4XMsS66VcyUtW6zHO'
        
        print("🔍 現在のプロジェクト内容を取得中...")
        
        # 現在のプロジェクト内容を取得
        project_content = service.projects().getContent(scriptId=project_id).execute()
        
        files = project_content.get('files', [])
        
        # Code.jsファイルを探してテスト関数を追加
        for file in files:
            if file['name'] == 'Code':
                print("📝 Code.jsファイルにテスト関数を追加中...")
                
                # テスト関数を追加
                test_function = '''

/**
 * 画像URL変換のテスト関数
 */
function testImageUrl() {
  var testUrl = "https://drive.google.com/file/d/1NxLRq2Ceq2DioGun0IPQXlMTam72-FtL/view?usp=drivesdk";
  
  console.log("元のURL: " + testUrl);
  
  try {
    var convertedUrl = convertImageUrl(testUrl);
    console.log("変換後URL: " + convertedUrl);
    
    // 実際にデータを取得してテスト
    var data = getQuestionData('2024');
    console.log("取得したデータ数: " + data.length);
    
    if (data.length > 0) {
      var firstQuestion = data[0];
      console.log("最初の問題: " + firstQuestion.questionId);
      console.log("画像URL: " + firstQuestion.imageUrl);
      
      if (firstQuestion.imageUrl) {
        var convertedFirstUrl = convertImageUrl(firstQuestion.imageUrl);
        console.log("変換後の最初の問題の画像URL: " + convertedFirstUrl);
      }
    }
    
    return {
      testUrl: testUrl,
      convertedUrl: convertedUrl,
      dataCount: data.length,
      firstQuestion: data.length > 0 ? data[0] : null
    };
    
  } catch (error) {
    console.log("エラー: " + error.toString());
    return {
      error: error.toString(),
      testUrl: testUrl
    };
  }
}

/**
 * デバッグ用: 具体的な問題の画像URLをテスト
 */
function debugSpecificQuestion() {
  try {
    // 2024年のデータを取得
    var data = getQuestionData('2024');
    console.log("全データ数: " + data.length);
    
    // 最初の3問をデバッグ
    for (var i = 0; i < Math.min(3, data.length); i++) {
      var question = data[i];
      console.log("\\n=== 問題 " + (i + 1) + " ===");
      console.log("問題ID: " + question.questionId);
      console.log("元画像URL: " + question.imageUrl);
      
      if (question.imageUrl) {
        var converted = convertImageUrl(question.imageUrl);
        console.log("変換後URL: " + converted);
      } else {
        console.log("画像URLなし");
      }
    }
    
    return "デバッグ完了";
    
  } catch (error) {
    console.log("デバッグエラー: " + error.toString());
    return "エラー: " + error.toString();
  }
}'''
                
                # 既存のコードに追加
                file['source'] = file['source'] + test_function
                
        # プロジェクトを更新
        content = {'files': files}
        
        print("⬆️  更新されたコードをアップロード中...")
        updated_project = service.projects().updateContent(
            scriptId=project_id,
            body=content
        ).execute()
        
        print("✅ テスト関数の追加が完了しました")
        
        # テスト関数を実行
        print("\n🧪 テスト関数を実行中...")
        
        # testImageUrl関数を実行
        execution_request = {
            'function': 'testImageUrl'
        }
        
        execution = service.scripts().run(
            scriptId=project_id,
            body=execution_request
        ).execute()
        
        if 'error' in execution:
            error = execution['error']
            print(f"❌ 実行エラー: {error.get('details', [{}])[0].get('errorMessage', 'Unknown error')}")
        else:
            result = execution.get('response', {}).get('result')
            print("✅ テスト関数実行結果:")
            print(f"   - テストURL: {result.get('testUrl', 'N/A')}")
            print(f"   - 変換後URL: {result.get('convertedUrl', 'N/A')}")
            print(f"   - データ数: {result.get('dataCount', 'N/A')}")
            
            if result.get('firstQuestion'):
                first = result['firstQuestion']
                print(f"   - 最初の問題ID: {first.get('questionId', 'N/A')}")
                print(f"   - 最初の問題画像URL: {first.get('imageUrl', 'N/A')}")
        
        # 追加でデバッグ関数も実行
        print("\n🔍 詳細デバッグ関数を実行中...")
        
        debug_execution_request = {
            'function': 'debugSpecificQuestion'
        }
        
        debug_execution = service.scripts().run(
            scriptId=project_id,
            body=debug_execution_request
        ).execute()
        
        if 'error' in debug_execution:
            error = debug_execution['error']
            print(f"❌ デバッグ実行エラー: {error.get('details', [{}])[0].get('errorMessage', 'Unknown error')}")
        else:
            debug_result = debug_execution.get('response', {}).get('result')
            print(f"✅ デバッグ関数実行結果: {debug_result}")
        
        return True
        
    except Exception as e:
        print(f"❌ エラー: {str(e)}")
        return False

def main():
    print("🚀 Google Apps Script画像URL変換テストを開始します...")
    
    if add_test_function_and_run():
        print("\n✨ テストが完了しました!")
        print("🌐 WebアプリURL: https://script.google.com/a/macros/chirijyuku.com/s/AKfycby9LxHM1NnKw42yVVHpW_E9aoQ4ZAljtPcX3hTMEKIvrKI2h1M7fhXPYF17KbZ2sNvd/exec")
        print("📝 GASプロジェクト: https://script.google.com/d/1uVSR--THzuhHDKePsK5kXlnL3U_6ONeVNrI3fDB4XMsS66VcyUtW6zHO/edit")
    else:
        print("❌ テストに失敗しました")

if __name__ == "__main__":
    main()