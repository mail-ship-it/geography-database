/**
 * Google Drive画像URLを公開用に変換する修正版
 */
function convertImageUrl(driveUrl) {
  if (!driveUrl) return '';
  
  // Google Drive URLを直接表示可能な形式に変換
  var match = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    var fileId = match[1];
    
    try {
      // Drive APIでファイルの共有設定を確認・変更
      var file = DriveApp.getFileById(fileId);
      
      // ファイルを一般公開に設定（まだ公開されていない場合）
      try {
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      } catch (e) {
        console.log('共有設定変更エラー (既に設定済みの可能性): ' + e.toString());
      }
      
      // 直接表示用URLを返す
      return 'https://drive.google.com/uc?id=' + fileId + '&export=view';
      
    } catch (error) {
      console.log('ファイルアクセスエラー: ' + fileId + ' - ' + error.toString());
      // エラーの場合でも変換URLを返す
      return 'https://drive.google.com/uc?id=' + fileId + '&export=view';
    }
  }
  
  return driveUrl;
}

/**
 * 全ての画像ファイルの共有設定を一括変更
 */
function makeAllImagesPublic() {
  var folderId = '1BDfVPQSQkTMABOM6Fr8qyTZIS1COhtWu';
  
  try {
    var folder = DriveApp.getFolderById(folderId);
    var subFolders = folder.getFolders();
    var processedCount = 0;
    
    while (subFolders.hasNext()) {
      var subFolder = subFolders.next();
      console.log('処理中フォルダ: ' + subFolder.getName());
      
      var files = subFolder.getFiles();
      while (files.hasNext()) {
        var file = files.next();
        
        try {
          // 画像ファイルのみ処理
          if (file.getBlob().getContentType().startsWith('image/')) {
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            processedCount++;
            console.log('公開設定完了: ' + file.getName());
          }
        } catch (error) {
          console.log('ファイル処理エラー: ' + file.getName() + ' - ' + error.toString());
        }
      }
    }
    
    console.log('処理完了: ' + processedCount + '個のファイルを公開設定しました');
    return '処理完了: ' + processedCount + '個のファイルを公開設定しました';
    
  } catch (error) {
    console.log('フォルダアクセスエラー: ' + error.toString());
    return 'エラー: ' + error.toString();
  }
}