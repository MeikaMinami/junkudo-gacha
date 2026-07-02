// 【解決】CodePenのセキュリティ制限を確実に回避する、あなた専用 of データURLです！
const DATA_URL = 'https://gist.githubusercontent.com/MeikaMinami/597b26ef4e09b6bf7dedc2c7b7994fef/raw/books.json';

let books = []; 
let currentBook = null;
let nextQueuedBook = null; // あらかじめ裏で用意しておく「次の本」のデータ

// 過去に引いた本の履歴を保存する配列（記憶帳）
let bookHistory = []; 
// 何冊分重複を禁止するか（本全体の数の半分くらい、または「5」に設定するとループ感が消えます）
const HISTORY_LIMIT = 5; 

const startScreen = document.getElementById('start-screen');
const readingScreen = document.getElementById('reading-screen');
const coverScreen = document.getElementById('cover-screen');
const resultScreen = document.getElementById('result-screen');
const btnLocation = document.getElementById('btn-location');
const resultLocation = document.getElementById('result-location');

// アプリ起動時に、JSの非同期通信（Fetch）でGitHubから直接データを読み込む
async function loadBooksData() {
  try {
    const cacheBusterUrl = `${DATA_URL}?t=${Date.now()}`;
    
    const response = await fetch(cacheBusterUrl);
    if (!response.ok) throw new Error('通信エラーが発生しました');
    
    books = await response.json();
    console.log('JS（Fetch）でのデータ読み込みに成功しました！本の数：', books.length);
    
    // データが読み込まれたら、最初の「裏の予約本」を仕込んでおく
    preloadNextBook();
  } catch (error) {
    console.error('データの読み込みに失敗しました：', error);
  }
}

// 読み込みを実行
loadBooksData();

// 【大改造】過去5冊の履歴と重複しないように本を選ぶ、超安全なランダム関数
function getRandomBook() {
  if (!books || books.length === 0) return null;
  
  // まだ引いていない（＝履歴リストに入っていない）本だけの候補リストを作る
  let availableBooks = books.filter(book => !bookHistory.includes(book.title));
  
  // もし本の総数が少なくて、候補が空っぽになってしまった場合は、一番古い履歴を1つ解放する
  if (availableBooks.length === 0) {
    bookHistory.shift(); // 履歴の先頭（一番古い本）を削除
    availableBooks = books.filter(book => !bookHistory.includes(book.title));
  }
  
  // 絞り込まれた安全な候補の中から、ランダムに1冊選ぶ
  const selectedBook = availableBooks[Math.floor(Math.random() * availableBooks.length)];
  
  // 選ばれた本のタイトルを履歴リストの最後に追加
  if (selectedBook) {
    bookHistory.push(selectedBook.title);
    
    // 履歴が設定の上限（5冊）を超えたら、一番古い記憶を捨てる
    if (bookHistory.length > HISTORY_LIMIT) {
      bookHistory.shift();
    }
  }
  
  return selectedBook;
}

// 次に引く本の「タイトルなしジャケット」を裏で先読みする関数
function preloadNextBook() {
  nextQueuedBook = getRandomBook();
  if (nextQueuedBook && nextQueuedBook.imageCover) {
    const imgObj = new Image();
    imgObj.src = nextQueuedBook.imageCover;
  }
}

// ==========================================
// --- 【追加】文字数と画面幅に応じてサイズを自動調整する機能 ---
// ==========================================
function adjustFirstLineFontSize(text) {
  const displayFirstLineElement = document.getElementById('display-first-line');
  if (!displayFirstLineElement) return;

  const textLength = text.length;

  // スマホ画面（画面幅が768px未満）のときだけ実行
  if (window.innerWidth < 768) {
    if (textLength > 60) {
      // 60文字以上の超長文はかなり小さく
      displayFirstLineElement.style.fontSize = "13px";
      displayFirstLineElement.style.lineHeight = "1.5";
    } else if (textLength > 40) {
      // 40文字以上の長文は少し小さく
      displayFirstLineElement.style.fontSize = "15px";
      displayFirstLineElement.style.lineHeight = "1.6";
    } else {
      // 通常サイズ（元のCSSの設定に戻す）
      displayFirstLineElement.style.fontSize = "18px";
      displayFirstLineElement.style.lineHeight = "1.8";
    }
  } else {
    // パソコン画面のときは常に元のサイズ
    displayFirstLineElement.style.fontSize = "18px";
    displayFirstLineElement.style.lineHeight = "1.8";
  }
}

// ==========================================
// --- モード1：一行目ガチャの処理 ---
// ==========================================
const btnModeFirstline = document.getElementById('btn-mode-firstline');
if(btnModeFirstline) {
  btnModeFirstline.addEventListener('click', () => {
    currentBook = getRandomBook();
    if (!currentBook || books.length === 0) {
      return alert('データの読み込み中です。数秒待ってから再度押してください。');
    }
    document.getElementById('display-first-line').innerHTML = currentBook.firstLine;
    
    // ★【追加】文字サイズの調整を実行
    adjustFirstLineFontSize(currentBook.firstLine);

    startScreen.classList.remove('active');
    readingScreen.classList.add('active');
  });
}

// 「他の一行目を引く」のTinder風演出
const btnNextLine = document.getElementById('btn-next-line');
if(btnNextLine) {
  btnNextLine.addEventListener('click', () => {
    const box = document.querySelector('.first-line-box');
    if (box) {
      box.style.transform = 'scale(0.95) translateY(-5px)';
      box.style.opacity = '0';
    }
    
    setTimeout(() => {
      currentBook = getRandomBook();
      if(currentBook) {
        document.getElementById('display-first-line').innerHTML = currentBook.firstLine;
        
        // ★【追加】文字サイズの調整を実行
        adjustFirstLineFontSize(currentBook.firstLine);
      }
      if (box) {
        box.style.transform = 'scale(1) translateY(0)';
        box.style.opacity = '1';
      }
    }, 200);
  });
}

const btnBackFromLine = document.getElementById('btn-back-from-line');
if(btnBackFromLine) {
  btnBackFromLine.addEventListener('click', () => {
    readingScreen.classList.remove('active');
    startScreen.classList.add('active');
  });
}

// ==========================================
// --- モード2：ジャケットガチャの処理 ---
// ==========================================
const btnModeCover = document.getElementById('btn-mode-cover');
if(btnModeCover) {
  btnModeCover.addEventListener('click', () => {
    if (nextQueuedBook) {
      currentBook = nextQueuedBook;
    } else {
      currentBook = getRandomBook();
    }
    if (!currentBook || books.length === 0) {
      return alert('データの読み込み中です。数秒待ってから再度押してください。');
    }
    document.getElementById('display-cover-only').src = currentBook.imageCover;
    startScreen.classList.remove('active');
    coverScreen.classList.add('active');
    
    preloadNextBook();
  });
}

// 「他のジャケットを引く」の先読みシンクロモーション
const btnNextCover = document.getElementById('btn-next-cover');
if(btnNextCover) {
  btnNextCover.addEventListener('click', () => {
    const box = document.querySelector('.cover-only-box');
    
    if (box) {
      box.style.transition = 'all 0.2s ease';
      box.style.transform = 'scale(0.93) translateY(-5px)';
      box.style.opacity = '0';
    }
    
    setTimeout(() => {
      if (nextQueuedBook) {
        currentBook = nextQueuedBook;
        document.getElementById('display-cover-only').src = currentBook.imageCover;
      }
      
      if (box) {
        box.style.transform = 'scale(1) translateY(0)';
        box.style.opacity = '1';
      }
      
      preloadNextBook();
    }, 200);
  });
}

// ジャケットモードから選択画面に戻る
const btnBackFromCover = document.getElementById('btn-back-from-cover');
if(btnBackFromCover) {
  btnBackFromCover.addEventListener('click', () => {
    coverScreen.classList.remove('active');
    startScreen.classList.add('active');
  });
}

// ==========================================
// --- 正体を見る・結果画面の処理 ---
// ==========================================
const btnRevealFromLine = document.getElementById('btn-reveal-from-line');
if(btnRevealFromLine) {
  btnRevealFromLine.addEventListener('click', () => {
    showResult();
    readingScreen.classList.remove('active');
  });
}

const btnRevealFromCover = document.getElementById('btn-reveal-from-cover');
if(btnRevealFromCover) {
  btnRevealFromCover.addEventListener('click', () => {
    showResult();
    coverScreen.classList.remove('active');
  });
}

function showResult() {
  if (!currentBook) return;
  document.getElementById('result-title').textContent = currentBook.title;
  document.getElementById('result-author').textContent = currentBook.author;
  
  document.getElementById('result-img').src = currentBook.imageDetail;
  
  resultLocation.style.display = "none";
  btnLocation.style.display = "block";
  
  const layout = document.querySelector('.result-layout');
  if(layout) {
    layout.classList.remove('fade-in-up');
    setTimeout(() => { layout.classList.add('fade-in-up'); }, 1);
  }
  resultScreen.classList.add('active');
}

// ==========================================
// --- 棚の場所を見る・最初に戻る処理 ---
// ==========================================
if(btnLocation) {
  btnLocation.addEventListener('click', () => {
    resultLocation.innerHTML = `📍 <strong>在庫あり</strong><br>${currentBook.location}`;
    resultLocation.classList.remove('fade-in-up');
    resultLocation.style.display = "block";
    setTimeout(() => { resultLocation.classList.add('fade-in-up'); }, 1);
    btnLocation.style.display = "none";
  });
}

const retryBtn = document.getElementById('btn-retry') || document.getElementById('retry');
if(retryBtn) {
  retryBtn.addEventListener('click', () => {
    resultScreen.classList.remove('active');
    startScreen.classList.add('active');
    preloadNextBook();
  });
}

// ==========================================
// --- Web Share API（シェア機能）の処理 ---
// ==========================================
const btnShare = document.getElementById('btn-share');

if (btnShare) {
  btnShare.addEventListener('click', () => {
    
    let shareText = '';
    
    // 【解決1】「今、読書画面（reading-screen）がアクティブかどうか」で確実に判定
    const isReadingScreenActive = document.getElementById('reading-screen').classList.contains('active');

    if (isReadingScreenActive && currentBook.firstLine) {
      // 一行目モードから結果に来た場合
      shareText = `運命の本ガチャで素敵な本に出会いました！\n\n` +
                  `💡心に刺さった一行目:\n「${currentBook.firstLine}」\n\n` +
                  `📖『${currentBook.title}』(${currentBook.author})\n\n`;
    } else {
      // ジャケットモードから結果に来た場合
      shareText = `運命の本ガチャでジャケットで選んだ本はこちら！\n\n` +
                  `📖『${currentBook.title}』(${currentBook.author})\n\n`;
    }

    // キャッチコピーとハッシュタグを合流
    shareText += `▼本との偶然の出会いを楽しもう\n` +
                  `#運命の本ガチャ #ジュンク堂書店大阪本店`;

    const shareTitle = `運命の本ガチャ`;
    const shareUrl = window.location.href; // このホームページのリンク

    // ① ブラウザが Web Share API に対応しているかチェック（スマホなど）
    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      })
      .then(() => { console.log('シェア成功！'); })
      .catch((error) => {
        if (error.name !== 'AbortError') { 
          alert('Safariのエラー: ' + error.message);
        }
      });
    } else {
      // 【解決2】パソコン（Xの予備処理）で、文章（text）とリンク（url）を綺麗に分離して送る
      const xShareUrl = `https://twitter.com/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
      window.open(xShareUrl, '_blank');
    }
  });
}
