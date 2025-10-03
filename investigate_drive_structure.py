#!/usr/bin/env python3
"""
Google Driveの地理問題データベースフォルダ構造を調査
"""
import sys
import os
sys.path.append('/Users/shun')

from google_auth_template import get_google_services
from googleapiclient.errors import HttpError

def get_folder_contents(drive_service, folder_id, indent=0):
    """フォルダの内容を再帰的に取得"""
    try:
        # フォルダ内のファイル・フォルダを取得
        query = f"'{folder_id}' in parents and trashed=false"
        results = drive_service.files().list(
            q=query,
            fields="files(id, name, mimeType, size, createdTime, owners)",
            orderBy="name"
        ).execute()
        
        items = results.get('files', [])
        structure = []
        
        for item in items:
            item_info = {
                'id': item['id'],
                'name': item['name'],
                'type': 'folder' if item['mimeType'] == 'application/vnd.google-apps.folder' else 'file',
                'size': item.get('size', 'N/A'),
                'created': item.get('createdTime', 'N/A'),
                'owners': [owner.get('displayName', 'Unknown') for owner in item.get('owners', [])]
            }
            
            structure.append(item_info)
            
            # フォルダの場合は再帰的に調査（ただし2階層まで）
            if item['mimeType'] == 'application/vnd.google-apps.folder' and indent < 2:
                item_info['contents'] = get_folder_contents(drive_service, item['id'], indent + 1)
        
        return structure
        
    except HttpError as error:
        print(f"フォルダ取得エラー (ID: {folder_id}): {error}")
        return []

def analyze_structure(drive_service, parent_folder_id):
    """フォルダ構造を分析"""
    print("=== Google Drive 地理問題データベース フォルダ構造調査 ===\n")
    
    # 親フォルダの情報を取得
    try:
        parent_info = drive_service.files().get(
            fileId=parent_folder_id,
            fields="id, name, owners, createdTime"
        ).execute()
        
        print(f"親フォルダ: {parent_info['name']}")
        print(f"フォルダID: {parent_info['id']}")
        print(f"所有者: {[owner.get('displayName', 'Unknown') for owner in parent_info.get('owners', [])]}")
        print(f"作成日: {parent_info.get('createdTime', 'N/A')}")
        print("-" * 60)
        
    except HttpError as error:
        print(f"親フォルダ情報取得エラー: {error}")
        return None
    
    # フォルダ構造を取得
    structure = get_folder_contents(drive_service, parent_folder_id)
    
    # 年度フォルダの分析
    year_folders = []
    other_items = []
    
    for item in structure:
        if item['type'] == 'folder':
            # 年度パターンを検出
            name = item['name']
            if any(year in name for year in ['2022', '2023', '2024', '2025']):
                year_folders.append(item)
            else:
                other_items.append(item)
        else:
            other_items.append(item)
    
    print(f"\n=== 年度フォルダ ({len(year_folders)}個) ===")
    for folder in sorted(year_folders, key=lambda x: x['name']):
        print(f"\n📁 {folder['name']}")
        print(f"   ID: {folder['id']}")
        print(f"   所有者: {folder['owners']}")
        print(f"   作成日: {folder['created']}")
        
        # サブフォルダ（第1問〜第5問）の確認
        if 'contents' in folder:
            mondai_folders = [item for item in folder['contents'] if item['type'] == 'folder' and '第' in item['name'] and '問' in item['name']]
            other_contents = [item for item in folder['contents'] if item not in mondai_folders]
            
            print(f"   問題フォルダ数: {len(mondai_folders)}")
            for mondai in sorted(mondai_folders, key=lambda x: x['name']):
                print(f"     📂 {mondai['name']}")
                if 'contents' in mondai:
                    image_count = len([item for item in mondai['contents'] if item['type'] == 'file'])
                    folder_count = len([item for item in mondai['contents'] if item['type'] == 'folder'])
                    print(f"        画像ファイル: {image_count}個, サブフォルダ: {folder_count}個")
            
            if other_contents:
                print(f"   その他のファイル/フォルダ: {len(other_contents)}個")
                for item in other_contents[:5]:  # 最初の5個を表示
                    print(f"     📄 {item['name']} ({item['type']})")
                if len(other_contents) > 5:
                    print(f"     ... 他{len(other_contents) - 5}個")
    
    print(f"\n=== その他のアイテム ({len(other_items)}個) ===")
    for item in other_items:
        icon = "📁" if item['type'] == 'folder' else "📄"
        print(f"{icon} {item['name']} ({item['type']})")
        if item['type'] == 'file' and item['size'] != 'N/A':
            size_mb = int(item['size']) / (1024 * 1024)
            print(f"   サイズ: {size_mb:.1f}MB")
    
    return structure

def check_spreadsheet_sheets(gc, spreadsheet_id):
    """スプレッドシートの各年度シートを確認"""
    print("\n" + "=" * 60)
    print("=== Google Sheets 年度シート調査 ===\n")
    
    try:
        spreadsheet = gc.open_by_key(spreadsheet_id)
        print(f"スプレッドシート名: {spreadsheet.title}")
        print(f"スプレッドシートID: {spreadsheet_id}")
        
        worksheets = spreadsheet.worksheets()
        print(f"\nシート数: {len(worksheets)}")
        
        for worksheet in worksheets:
            print(f"\n📊 シート名: {worksheet.title}")
            print(f"   ID: {worksheet.id}")
            
            # シートのデータ有無を確認（最初の10行を取得）
            try:
                data = worksheet.get_all_values()
                row_count = len(data)
                col_count = len(data[0]) if data else 0
                
                print(f"   データ行数: {row_count}")
                print(f"   データ列数: {col_count}")
                
                # 空でないセルをカウント
                non_empty_cells = sum(1 for row in data for cell in row if cell.strip())
                print(f"   空でないセル数: {non_empty_cells}")
                
                # 年度情報を推測
                year_detected = None
                for year in ['2022', '2023', '2024', '2025']:
                    if year in worksheet.title:
                        year_detected = year
                        break
                
                if year_detected:
                    print(f"   検出年度: {year_detected}")
                
                # ヘッダー行を表示
                if data and len(data) > 0:
                    headers = data[0]
                    print(f"   ヘッダー: {headers[:5]}...")  # 最初の5列を表示
                
            except Exception as e:
                print(f"   データ取得エラー: {e}")
        
    except Exception as error:
        print(f"スプレッドシート取得エラー: {error}")

def search_alternative_parent_folders(drive_service):
    """代替の親フォルダを検索"""
    print("\n=== 代替親フォルダの検索 ===")
    
    try:
        # 「地理」「共通テスト」などのキーワードでフォルダを検索
        keywords = ['地理', '共通テスト', 'geography', '問題']
        
        for keyword in keywords:
            print(f"\n🔍 キーワード「{keyword}」で検索中...")
            query = f"mimeType='application/vnd.google-apps.folder' and name contains '{keyword}'"
            results = drive_service.files().list(
                q=query,
                fields="files(id, name, parents)",
                pageSize=10
            ).execute()
            
            for folder in results.get('files', []):
                print(f"  📁 {folder['name']} (ID: {folder['id']})")
                if 'parents' in folder:
                    print(f"     親フォルダ: {folder['parents']}")
        
    except Exception as e:
        print(f"検索エラー: {e}")

def main():
    # 設定
    PARENT_FOLDER_ID = "1BDfVPQSQkTMABOM6Fr8qyTZIS1COhtWu"
    SPREADSHEET_ID = "17cxHniOQP2C7QKCV8nqnn3IKEcd1HwWiDgExGb6FfEE"
    
    try:
        # Google サービスを取得
        drive_service, gc = get_google_services()
        
        print("=== Google Drive 地理問題データベース調査 ===\n")
        
        # 最初にスプレッドシートを確認（これは動作している）
        check_spreadsheet_sheets(gc, SPREADSHEET_ID)
        
        # フォルダ構造を分析
        print(f"\n指定されたフォルダID: {PARENT_FOLDER_ID}")
        print("フォルダ構造の分析を開始...")
        
        structure = analyze_structure(drive_service, PARENT_FOLDER_ID)
        
        if structure is None:
            print("❌ 指定されたフォルダにアクセスできません")
            print("代替フォルダを検索します...")
            search_alternative_parent_folders(drive_service)
        else:
            print("\n" + "=" * 60)
            print("=== 分析完了 ===")
            
            # 他年度のデータ整備状況を判断
            year_folders = [item for item in structure if item['type'] == 'folder' and any(year in item['name'] for year in ['2022', '2023', '2024', '2025'])]
            
            print(f"\n🔍 他年度データ整備状況の判断:")
            print(f"   年度フォルダ数: {len(year_folders)}")
            
            for folder in year_folders:
                if 'contents' in folder:
                    mondai_folders = [item for item in folder['contents'] if item['type'] == 'folder' and '第' in item['name'] and '問' in item['name']]
                    if len(mondai_folders) == 5:  # 第1問〜第5問
                        print(f"   ✅ {folder['name']}: 完全な問題フォルダ構造 (5個)")
                    elif len(mondai_folders) > 0:
                        print(f"   ⚠️  {folder['name']}: 部分的な問題フォルダ構造 ({len(mondai_folders)}個)")
                    else:
                        print(f"   ❌ {folder['name']}: 問題フォルダ構造なし")
                else:
                    print(f"   ❓ {folder['name']}: 内容不明（アクセス制限の可能性）")
    
    except Exception as error:
        print(f"実行エラー: {error}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()