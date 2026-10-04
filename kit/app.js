// 기본 단어 목록 — 이 부분만 바꾸면 나만의 단어장이 됩니다
const defaultWords = [
    { word: 'abandon', meaning: '버리다, 포기하다' },
    { word: 'ability', meaning: '능력' },
    { word: 'abroad', meaning: '해외로' },
    { word: 'absence', meaning: '부재, 결석' },
    { word: 'accept', meaning: '받아들이다' }
];

const STORAGE_KEY = 'vocab-learned';

let learned = {};      // { abandon: true, ... } 외운 단어 기록
let currentIndex = 0;

const card = document.getElementById('card');

// 저장된 기록 불러오기
function loadProgress() {
    try {
        learned = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
        learned = {};
    }
}

// 기록 저장하기
function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(learned));
}

// 지금 카드 보여주기
function renderCard() {
    const item = defaultWords[currentIndex];
    card.classList.remove('flipped');
    card.classList.toggle('learned', !!learned[item.word]);
    document.getElementById('card-front').textContent = item.word;
    document.getElementById('card-back').textContent = item.meaning;
    updateProgress();
    renderList();
}

// 넓은 화면용 단어 목록 (누르면 그 카드로 이동)
function renderList() {
    const list = document.getElementById('word-list');
    list.innerHTML = '';
    defaultWords.forEach((w, i) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = i === currentIndex ? 'current' : '';
        btn.textContent = w.word;
        const mark = document.createElement('span');
        mark.className = 'mark';
        mark.textContent = learned[w.word] ? '✓' : '';
        btn.appendChild(mark);
        btn.addEventListener('click', () => {
            currentIndex = i;
            renderCard();
        });
        li.appendChild(btn);
        list.appendChild(li);
    });
}

// 진도 막대 업데이트
function updateProgress() {
    const total = defaultWords.length;
    const done = defaultWords.filter(w => learned[w.word]).length;
    document.getElementById('progress-fill').style.width = (done / total) * 100 + '%';
    document.getElementById('progress-text').textContent = `${done} / ${total} 어휘 학습함`;
    document.getElementById('subtitle').textContent = `영어 어휘 학습 - ${done}/${total} 완료`;
}

function goNext() {
    currentIndex = (currentIndex + 1) % defaultWords.length;
    renderCard();
}

// 카드 뒤집기 (클릭 또는 키보드)
card.addEventListener('click', () => card.classList.toggle('flipped'));
card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('flipped');
    }
});

document.getElementById('prev-btn').addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + defaultWords.length) % defaultWords.length;
    renderCard();
});

document.getElementById('next-btn').addEventListener('click', goNext);

// 외웠어요: 표시를 켜고 끈 뒤 다음 카드로
document.getElementById('mark-btn').addEventListener('click', () => {
    const w = defaultWords[currentIndex].word;
    learned[w] = !learned[w];
    saveProgress();
    goNext();
});

// 발음 듣기 (브라우저 내장 음성)
document.getElementById('speak-btn').addEventListener('click', () => {
    if (!('speechSynthesis' in window)) return;
    const utter = new SpeechSynthesisUtterance(defaultWords[currentIndex].word);
    utter.lang = 'en-US';
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
});

// 처음부터: 두 번 눌러야 지워짐 (실수 방지)
const resetBtn = document.getElementById('reset-btn');
let resetArmed = false;
resetBtn.addEventListener('click', () => {
    if (!resetArmed) {
        resetArmed = true;
        resetBtn.textContent = '한 번 더 누르면 지워져요';
        setTimeout(() => {
            resetArmed = false;
            resetBtn.textContent = '처음부터';
        }, 3000);
        return;
    }
    learned = {};
    saveProgress();
    currentIndex = 0;
    resetArmed = false;
    resetBtn.textContent = '처음부터';
    renderCard();
});

loadProgress();
renderCard();
