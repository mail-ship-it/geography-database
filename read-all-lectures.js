const { google } = require('googleapis');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf8');
for (const line of envContent.split('\n')) {
  if (line.startsWith('GOOGLE_SERVICE_ACCOUNT_KEY=')) {
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY = line.slice('GOOGLE_SERVICE_ACCOUNT_KEY='.length);
  }
}

const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/drive.readonly', 'https://www.googleapis.com/auth/documents.readonly']
});

const docIds = [
  { id: '1xxynoIDyDYuWTIPk3UVNnd2BUsD4sDNis94i_TTHjyg', date: '11/24' },
  { id: '1XNy2GXomUg7IocigF5UJWn3si7A8Nt1Pdob0jCJecUc', date: '11/17' },
  { id: '1tf8-pzogd1TJImB4gDvWFbXl7kA3r96gKhqgif-ILLc', date: '11/10' },
  { id: '17-dI0uxfaI7fFsBSEb4bhZmvL2Siosrgjh3MIW9_bjg', date: '11/03' },
  { id: '1i7YpplTtyX9B1hMtpoCq44_ghoK0Iaro4IfTAEHjd1I', date: '10/27' },
  { id: '1PE7dIFniQR46dPUUTyVzr5EY9ctBgtfx4jYhdX6mNsQ', date: '10/20' },
  { id: '1_hlTy2a8-g4zsArPGzZimoKH4JjNxRq4sCUaux5sSU0', date: '10/13' },
  { id: '1MlWNck36h9RtYAlzoZk5PmfVFONeRpxRvLCWrnXUPBI', date: '10/06' },
  { id: '1n-srBNNPpx39ywQsl0C_u7R77Pk_V8XV9bvat86yPQQ', date: '09/22' },
  { id: '1SGf9TywJRmVLqBVG-KYihElpH0UI7-Rt92rziCZMXRk', date: '09/15' },
  { id: '1AEGkTn-fVCixHStre6dA9HYnm4DwwLGermFPbmxOelw', date: '09/08' },
  { id: '18pIlq4u40k-7TUIG1EoTI2js99z0tYaA_Im4oPrw1wU', date: '09/01' },
  { id: '1dla0dGh19lZ_qkF_By5JBQ_M686iZw2VaEhQKcUErR4', date: '08/25' },
  { id: '1ST07pRoAjyVVoo7ERKGrs2P4lsX0jA_9EKWjNCvbcnk', date: '08/18' },
  { id: '1tPZnPfo4HWNdtOJ6yu4VRElRYTCujFkVU60-vH-5yxU', date: '08/11' },
  { id: '1Y_zkhWQdswtLG0UEQo3R534A0xEYffgAcyBOFh6O6CU', date: '08/04' },
  { id: '1Ewj73H3kSFvag2QKhQ6jNDgEVQMQHQSr2GT7xxE3cC8', date: '07/28' },
  { id: '1JoLaLsYmFeNJ6Aa9MsdrX0jfiU0ahLlOZ2E11MQD1TE', date: '07/21' },
  { id: '1z6NTOlbEa3nMFjGhwLpmSZ_lXmyZGTugVj4wyLjM-Xw', date: '07/14' },
  { id: '1-TkdqGHwe0Z_NBOIlYryDx09q7GnQFtiv5uZE79nri0', date: '06/09' },
];

async function readDocument(docs, docId) {
  const response = await docs.documents.get({ documentId: docId });

  let text = '';
  const content = response.data.body.content || [];
  content.forEach(element => {
    if (element.paragraph) {
      element.paragraph.elements.forEach(el => {
        if (el.textRun) {
          text += el.textRun.content;
        }
      });
    }
  });

  return {
    title: response.data.title,
    text: text
  };
}

async function main() {
  const docs = google.docs({ version: 'v1', auth });

  const allDocs = [];

  console.log('=== 20件のドキュメントを読み込み中 ===\n');

  for (const doc of docIds) {
    try {
      const result = await readDocument(docs, doc.id);
      allDocs.push({
        date: doc.date,
        title: result.title,
        text: result.text
      });
      console.log('✓ ' + doc.date + ' (' + result.text.length + '文字)');
    } catch (err) {
      console.log('✗ ' + doc.date + ': ' + err.message);
    }
  }

  console.log('\n=== 読み込み完了 ===');
  console.log('成功:', allDocs.length, '件');
  console.log('合計文字数:', allDocs.reduce((sum, d) => sum + d.text.length, 0));

  // JSONファイルとして保存
  fs.writeFileSync('lecture-summaries.json', JSON.stringify(allDocs, null, 2));
  console.log('\nlecture-summaries.json に保存しました');
}

main().catch(console.error);
