#!/usr/bin/env python3
"""
Supabaseプロジェクトを自動作成し、地理問題データベースを構築
"""

import requests
import json
import os
import time
from datetime import datetime

def create_supabase_project():
    """
    Supabase CLIを使用してプロジェクトを作成
    """
    print("🚀 Supabaseプロジェクトを作成中...")
    
    # まずSupabase CLIをインストール
    print("📦 Supabase CLIをインストール中...")
    os.system("npm install -g supabase")
    
    # Supabaseにログイン（ブラウザが開きます）
    print("🔐 Supabaseにログイン中...")
    print("ブラウザが開くので、Supabaseアカウントでログインしてください")
    os.system("supabase login")
    
    # 新しいプロジェクトを作成
    project_name = "geography-database"
    print(f"📁 プロジェクト '{project_name}' を作成中...")
    
    # プロジェクトディレクトリを作成
    os.makedirs(f"/Users/shun/{project_name}-supabase", exist_ok=True)
    os.chdir(f"/Users/shun/{project_name}-supabase")
    
    # Supabaseプロジェクト初期化
    os.system("supabase init")
    
    print("✅ Supabaseプロジェクトの作成が完了しました")
    
    return f"/Users/shun/{project_name}-supabase"

def create_database_schema():
    """
    データベーススキーマを作成
    """
    print("🗄️ データベーススキーマを作成中...")
    
    # SQLファイルを作成
    sql_content = """
-- 地理問題データベーステーブル
CREATE TABLE IF NOT EXISTS questions (
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

-- 問題検索用のインデックス
CREATE INDEX IF NOT EXISTS idx_questions_year ON questions(year);
CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category);
CREATE INDEX IF NOT EXISTS idx_questions_question_id ON questions(question_id);

-- 行レベルセキュリティを有効化（誰でも読み取り可能）
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- 読み取り専用ポリシー
CREATE POLICY "Anyone can read questions" ON questions
    FOR SELECT USING (true);

-- サンプルデータを挿入
INSERT INTO questions (question_id, category, answer, correct_rate, image_url, year, notes) VALUES
('2024_geo_1_1', '地形', '3', '75%', '', 2024, '2024年共通テスト地理B 第1問 問1'),
('2024_geo_1_2', '気候', '1', '82%', '', 2024, '2024年共通テスト地理B 第1問 問2'),
('2024_geo_1_3', '農業', '4', '68%', '', 2024, '2024年共通テスト地理B 第1問 問3')
ON CONFLICT (question_id) DO NOTHING;
"""
    
    # SQLファイルを保存
    with open('supabase/migrations/001_create_questions_table.sql', 'w') as f:
        f.write(sql_content)
    
    print("✅ データベーススキーマファイルを作成しました")
    
    return sql_content

def start_local_development():
    """
    ローカル開発環境を開始
    """
    print("🔧 Supabaseローカル開発環境を開始中...")
    
    # Docker が必要です
    print("⚠️  注意: Docker Desktop が必要です")
    print("   Docker がインストールされていない場合は、https://www.docker.com/products/docker-desktop/ からダウンロードしてください")
    
    # ローカルSupabaseを開始
    os.system("supabase start")
    
    print("🌐 ローカルSupabaseが起動しました")
    print("   - Supabase Studio: http://localhost:54323")
    print("   - Database URL: postgresql://postgres:postgres@localhost:54322/postgres")
    
def setup_remote_project():
    """
    リモートSupabaseプロジェクトをセットアップ
    """
    print("☁️ リモートSupabaseプロジェクトを作成中...")
    
    # 組織とプロジェクトを作成
    print("📋 以下の情報が必要です:")
    print("1. Supabaseアカウント（無料）")
    print("2. プロジェクト名: geography-database")
    print("3. リージョン: Asia Northeast (Tokyo)")
    
    # プロジェクト作成コマンド
    print("\n以下のコマンドを実行してリモートプロジェクトを作成します:")
    print("supabase projects create geography-database --org-id <YOUR_ORG_ID>")
    
    print("\n組織IDは以下で確認できます:")
    os.system("supabase orgs list")

def generate_project_config():
    """
    プロジェクト設定ファイルを生成
    """
    config = {
        "project_name": "geography-database",
        "description": "共通テスト地理問題データベース",
        "database_url": "to_be_filled",
        "anon_key": "to_be_filled",
        "service_role_key": "to_be_filled",
        "created_date": datetime.now().isoformat()
    }
    
    with open('/Users/shun/geography-db/supabase-config.json', 'w') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
    
    print("✅ プロジェクト設定ファイルを生成しました: /Users/shun/geography-db/supabase-config.json")

def main():
    print("🌟 Supabase + Vercel 地理問題データベース構築開始")
    print("=" * 60)
    
    try:
        # Step 1: プロジェクト作成
        project_path = create_supabase_project()
        
        # Step 2: データベーススキーマ作成
        create_database_schema()
        
        # Step 3: 設定ファイル生成
        generate_project_config()
        
        # Step 4: リモートプロジェクト情報
        setup_remote_project()
        
        print("\n🎉 Supabaseプロジェクトのセットアップが完了しました!")
        print(f"📁 プロジェクトパス: {project_path}")
        print("\n次のステップ:")
        print("1. Supabase Dashboard でプロジェクトを確認")
        print("2. API Keys を取得")
        print("3. Next.js アプリと連携")
        
    except Exception as e:
        print(f"❌ エラー: {str(e)}")
        print("手動でのセットアップが必要です")

if __name__ == "__main__":
    main()