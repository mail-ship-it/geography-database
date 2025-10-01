#!/usr/bin/env python3
"""
WebブラウザとAPIを使用してSupabaseプロジェクトを設定
"""

import webbrowser
import json
import time

def open_supabase_signup():
    """Supabaseサインアップページを開く"""
    print("🚀 Supabaseセットアップを開始します")
    print("=" * 50)
    
    print("📝 Step 1: Supabaseアカウント作成")
    print("以下のリンクが開きます：")
    print("https://supabase.com/dashboard")
    
    # ブラウザでSupabaseを開く
    webbrowser.open("https://supabase.com/dashboard")
    
    print("\n✅ ブラウザで以下の手順を実行してください：")
    print("1. 「Start your project」をクリック")
    print("2. GitHubアカウントでサインアップ（推奨）")
    print("3. アカウント作成完了")
    
    input("\n✋ アカウント作成が完了したら Enter を押してください...")

def create_project_instructions():
    """プロジェクト作成の指示"""
    print("\n📁 Step 2: プロジェクト作成")
    print("Supabase Dashboard で以下を実行：")
    print("1. 「New project」をクリック")
    print("2. Project name: geography-database")
    print("3. Database Password: （覚えやすいものを設定）")
    print("4. Region: Asia Northeast 1 (Tokyo)")
    print("5. Pricing Plan: Free（無料プラン）")
    print("6. 「Create new project」をクリック")
    
    input("\n✋ プロジェクト作成が完了したら Enter を押してください...")

def setup_database_instructions():
    """データベースセットアップの指示"""
    print("\n🗄️ Step 3: データベーステーブル作成")
    print("Supabase Dashboard で以下を実行：")
    print("1. 左メニューの「SQL Editor」をクリック")
    print("2. 以下のSQLをコピー&ペーストして実行：")
    
    sql_code = '''-- 地理問題データベーステーブル
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question_id VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100),
    answer VARCHAR(10),
    correct_rate VARCHAR(10),
    image_url TEXT,
    year INTEGER,
    created_date TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- インデックス作成
CREATE INDEX idx_questions_year ON questions(year);
CREATE INDEX idx_questions_category ON questions(category);

-- 行レベルセキュリティ
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 読み取り専用ポリシー
CREATE POLICY "Anyone can read questions" ON questions
    FOR SELECT USING (true);

-- サンプルデータ
INSERT INTO questions (question_id, category, answer, correct_rate, image_url, year, notes) VALUES
('2024_geo_1_1', '地形', '3', '75%', 'https://example.com/image1.jpg', 2024, '2024年共通テスト地理B 第1問 問1'),
('2024_geo_1_2', '気候', '1', '82%', 'https://example.com/image2.jpg', 2024, '2024年共通テスト地理B 第1問 問2'),
('2024_geo_1_3', '農業', '4', '68%', 'https://example.com/image3.jpg', 2024, '2024年共通テスト地理B 第1問 問3');'''
    
    print(f"\n```sql\n{sql_code}\n```")
    
    print("\n3. 「RUN」ボタンをクリックして実行")
    
    input("\n✋ SQLの実行が完了したら Enter を押してください...")

def get_api_keys_instructions():
    """API Keys取得の指示"""
    print("\n🔑 Step 4: API Keys取得")
    print("Supabase Dashboard で以下を実行：")
    print("1. 左メニューの「Settings」をクリック")
    print("2. 「API」をクリック")
    print("3. 以下の情報をコピー：")
    print("   - URL")
    print("   - anon public key")
    print("   - service_role key")
    
    print("\n📝 以下にAPI情報を入力してください：")
    
    url = input("Project URL: ")
    anon_key = input("anon public key: ")
    service_key = input("service_role key: ")
    
    # 設定ファイルに保存
    config = {
        "url": url,
        "anon_key": anon_key,
        "service_role_key": service_key,
        "project_name": "geography-database"
    }
    
    with open('/Users/shun/geography-db/supabase-config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✅ API設定を保存しました: /Users/shun/geography-db/supabase-config.json")
    
    return config

def create_storage_instructions():
    """ストレージ設定の指示"""
    print("\n📸 Step 5: 画像ストレージ設定")
    print("Supabase Dashboard で以下を実行：")
    print("1. 左メニューの「Storage」をクリック")
    print("2. 「Create a new bucket」をクリック")
    print("3. Bucket name: question-images")
    print("4. 「Public bucket」をチェック")
    print("5. 「Create bucket」をクリック")
    
    input("\n✋ ストレージ作成が完了したら Enter を押してください...")

def generate_nextjs_config():
    """Next.js設定ファイルを生成"""
    print("\n⚙️ Step 6: Next.js設定ファイル生成")
    
    # .env.local ファイルを作成
    try:
        with open('/Users/shun/geography-db/supabase-config.json', 'r') as f:
            config = json.load(f)
        
        env_content = f'''# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL={config["url"]}
NEXT_PUBLIC_SUPABASE_ANON_KEY={config["anon_key"]}
SUPABASE_SERVICE_ROLE_KEY={config["service_role_key"]}
'''
        
        with open('/Users/shun/geography-db/.env.local', 'w') as f:
            f.write(env_content)
        
        print("✅ Next.js環境変数ファイルを作成しました")
        
    except Exception as e:
        print(f"❌ 設定ファイル作成エラー: {e}")

def main():
    """メイン処理"""
    print("🌟 Supabase Webセットアップガイド")
    print("Google制限を回避して完全自動化を実現！")
    print("=" * 60)
    
    try:
        # Step 1: アカウント作成
        open_supabase_signup()
        
        # Step 2: プロジェクト作成
        create_project_instructions()
        
        # Step 3: データベース作成
        setup_database_instructions()
        
        # Step 4: API Keys取得
        config = get_api_keys_instructions()
        
        # Step 5: ストレージ設定
        create_storage_instructions()
        
        # Step 6: Next.js設定
        generate_nextjs_config()
        
        print("\n🎉 Supabaseセットアップ完了！")
        print("=" * 40)
        print("次のステップ:")
        print("1. Next.jsアプリをSupabase連携に更新")
        print("2. 画像ファイルをSupabase Storageに移行")  
        print("3. Google Sheetsデータを移行")
        print("4. Vercelに再デプロイ")
        
        print(f"\n📁 設定ファイル: /Users/shun/geography-db/supabase-config.json")
        print(f"📁 環境変数: /Users/shun/geography-db/.env.local")
        
    except Exception as e:
        print(f"❌ エラー: {str(e)}")

if __name__ == "__main__":
    main()