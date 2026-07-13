// ---------- DATA ----------
const CATEGORIES = {
  "Места": ["Пляж","Больница","Школа","Космическая станция","Казино","Цирк","Подводная лодка","Аэропорт","Ресторан","Полицейский участок","Банк","Тюрьма","Гостиница","Театр","Университет","Военная база","Круизный лайнер","Супермаркет","Зоопарк","Ночной клуб"],
  "Профессии": ["Пожарный","Хирург","Учитель","Пилот","Повар","Детектив","Актёр","Программист","Журналист","Строитель","Официант","Фотограф","Дипломат","Тренер","Диджей"],
  "Еда": ["Пицца","Суши","Борщ","Плов","Шаурма","Паста","Бургер","Тако","Рамен","Оливье","Блины","Стейк"],
};
CATEGORIES["Смешанная"] = [].concat(...Object.values(CATEGORIES));

const WOLF_PAIRS = [
  ["Кофе","Чай"], ["Лето","Зима"], ["Кошка","Собака"], ["Море","Океан"],
  ["Гитара","Скрипка"], ["Врач","Медсестра"], ["Футбол","Хоккей"], ["Смартфон","Планшет"],
  ["Дождь","Снег"], ["Пицца","Паста"], ["Такси","Автобус"], ["Диван","Кресло"],
  ["Ручка","Карандаш"], ["Яблоко","Груша"], ["Ноутбук","Компьютер"], ["Фильм","Сериал"],
  ["Пляж","Бассейн"], ["Утро","Вечер"], ["Чай","Какао"], ["Велосипед","Самокат"],
  ["Книга","Журнал"], ["Пирог","Торт"], ["Рюкзак","Сумка"], ["Очки","Линзы"],
  ["Гора","Холм"], ["Река","Озеро"], ["Автомобиль","Мотоцикл"], ["Сыр","Творог"],
  ["Йога","Пилатес"], ["Клавиатура","Мышь"]
];

// ---------- STATE ----------
const S = {
  screen: 'setup',
  count: 4,
  names: [],
  mode: null,
  category: null,
  spyCount: 1,
  players: [],
  wordMajor: '',
  wordMinor: '',
  revealIndex: 0,
  timerTotal: 180,
  timerRemaining: 180,
  timerRunning: false,
  timerHandle: null,
};

function shuffle(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

// ---------- NAVIGATION ----------
function setCount(delta){
  S.count = Math.min(12, Math.max(3, S.count + delta));
  render();
}
function goToNames(){
  if(S.names.length !== S.count){
    const base = [];
    for(let i=0;i<S.count;i++) base.push(S.names[i] || '');
    S.names = base;
  }
  S.screen = 'names';
  render();
}
function updateName(i, val){
  S.names[i] = val;
}
function goToMode(){
  for(let i=0;i<S.count;i++){
    if(!S.names[i] || !S.names[i].trim()) S.names[i] = 'Агент ' + (i+1);
  }
  S.screen = 'mode';
  render();
}
function chooseMode(m){
  S.mode = m;
  render();
}
function goFromMode(){
  if(!S.mode) return;
  S.screen = (S.mode === 'classic') ? 'category' : 'roster';
  render();
}
function chooseCategory(c){
  S.category = c;
  render();
}
function goFromCategory(){
  if(!S.category) return;
  S.screen = 'roster';
  render();
}
function setSpyCount(delta){
  const max = Math.min(3, Math.max(1, S.count - 2));
  S.spyCount = Math.min(max, Math.max(1, S.spyCount + delta));
  render();
}
function backTo(screen){
  S.screen = screen;
  render();
}

// ---------- ROUND LOGIC ----------
function buildRound(){
  const order = shuffle(S.names.map((n,i)=>({name:n, idx:i})));
  const impostorIdxs = new Set(order.slice(0, S.spyCount).map(p=>p.idx));

  let players;
  if(S.mode === 'classic'){
    const list = CATEGORIES[S.category] || CATEGORIES["Смешанная"];
    S.wordMajor = pick(list);
    S.wordMinor = '';
    players = S.names.map((name, i)=>({
      name,
      isImpostor: impostorIdxs.has(i),
      word: impostorIdxs.has(i) ? null : S.wordMajor
    }));
  } else {
    const pair = pick(WOLF_PAIRS);
    S.wordMajor = pair[0];
    S.wordMinor = pair[1];
    players = S.names.map((name, i)=>({
      name,
      isImpostor: impostorIdxs.has(i),
      word: impostorIdxs.has(i) ? S.wordMinor : S.wordMajor
    }));
  }
  S.players = players;
  S.revealIndex = 0;
  S.timerRemaining = S.timerTotal;
  S.timerRunning = false;
  S.screen = 'reveal';
  render();
}

function nextPlayer(){
  const overlay = document.getElementById('overlay');
  if(overlay) overlay.classList.remove('show');
  S.revealIndex++;
  if(S.revealIndex >= S.players.length){
    S.screen = 'discuss';
  }
  render();
}

function showOverlay(){
  const o = document.getElementById('overlay');
  if(o) o.classList.add('show');
}
function hideOverlay(){
  const o = document.getElementById('overlay');
  if(o) o.classList.remove('show');
}

// ---------- TIMER ----------
function adjustTimer(delta){
  S.timerTotal = Math.max(30, S.timerTotal + delta);
  if(!S.timerRunning) S.timerRemaining = S.timerTotal;
  render();
}
function toggleTimer(){
  if(S.timerRunning){
    clearInterval(S.timerHandle);
    S.timerRunning = false;
    render();
  } else {
    S.timerRunning = true;
    render();
    S.timerHandle = setInterval(()=>{
      S.timerRemaining--;
      if(S.timerRemaining <= 0){
        S.timerRemaining = 0;
        clearInterval(S.timerHandle);
        S.timerRunning = false;
      }
      updateTimerDisplay();
    }, 1000);
  }
}
function resetTimer(){
  clearInterval(S.timerHandle);
  S.timerRunning = false;
  S.timerRemaining = S.timerTotal;
  render();
}
function updateTimerDisplay(){
  const el = document.getElementById('timerVal');
  if(!el) return;
  const m = Math.floor(S.timerRemaining/60).toString().padStart(2,'0');
  const s = (S.timerRemaining%60).toString().padStart(2,'0');
  el.textContent = m + ':' + s;
  if(S.timerRemaining === 0 && !document.getElementById('timerToggleBtn').dataset.locked){
    render();
  }
}
function goToResults(){
  clearInterval(S.timerHandle);
  S.timerRunning = false;
  S.screen = 'results';
  render();
}
function newRoundSamePlayers(){
  buildRound();
}
function newGame(){
  S.screen = 'setup';
  S.names = [];
  S.mode = null;
  S.category = null;
  S.spyCount = 1;
  S.players = [];
  render();
}

// ---------- RENDER ----------
function render(){
  const app = document.getElementById('app');
  app.innerHTML = SCREENS[S.screen]();
}

const SCREENS = {
  setup: () => `
    <div class="header">
      <div class="eyebrow">Секретная операция</div>
      <h1>ШПИОН</h1>
      <p>Найдите предателя, пока не стало слишком поздно.</p>
    </div>
    <div class="steps">${stepsHtml(0)}</div>
    <div class="card">
      <div class="stamp-badge">Досье 01</div>
      <label class="field-label">Сколько агентов в деле?</label>
      <div class="stepper">
        <button onclick="setCount(-1)">−</button>
        <div class="count">${S.count}</div>
        <button onclick="setCount(1)">+</button>
      </div>
      <div class="hint">от 3 до 12 участников</div>
      <button class="btn btn-primary" onclick="goToNames()">Далее →</button>
    </div>
  `,

  names: () => `
    <div class="header">
      <div class="eyebrow">Личный состав</div>
      <h1>Впишите агентов</h1>
    </div>
    <div class="steps">${stepsHtml(1)}</div>
    <div class="card">
      <div class="stamp-badge">Досье 02</div>
      <label class="field-label">Имена участников</label>
      ${Array.from({length:S.count}).map((_,i)=>`
        <div class="name-row">
          <div class="badge">${i+1}</div>
          <input type="text" maxlength="16" placeholder="Агент ${i+1}"
            value="${escapeHtml(S.names[i]||'')}"
            oninput="updateName(${i}, this.value)">
        </div>
      `).join('')}
      <button class="btn btn-primary" onclick="goToMode()">Далее →</button>
      <button class="btn btn-ghost" onclick="backTo('setup')">← Назад</button>
    </div>
  `,

  mode: () => `
    <div class="header">
      <div class="eyebrow">Протокол операции</div>
      <h1>Выберите режим</h1>
    </div>
    <div class="steps">${stepsHtml(2)}</div>
    <div class="card">
      <div class="stamp-badge">Досье 03</div>
      <div class="mode-option ${S.mode==='classic'?'selected':''}" onclick="chooseMode('classic')">
        <h3>Классический шпион</h3>
        <p>Все агенты получают секретное слово (место или профессию). Шпион не знает слова и должен вычислить его по разговору, не выдав себя.</p>
      </div>
      <div class="mode-option ${S.mode==='wolf'?'selected':''}" onclick="chooseMode('wolf')">
        <h3>Двойник</h3>
        <p>Почти все получают одно слово, а двойник — похожее, но другое. Никто прямо не назван шпионом — вычислите двойника по ответам.</p>
      </div>
      <button class="btn btn-primary" ${!S.mode?'disabled':''} onclick="goFromMode()">Далее →</button>
      <button class="btn btn-ghost" onclick="backTo('names')">← Назад</button>
    </div>
  `,

  category: () => `
    <div class="header">
      <div class="eyebrow">Тематика</div>
      <h1>Выберите категорию</h1>
    </div>
    <div class="steps">${stepsHtml(3)}</div>
    <div class="card">
      <div class="stamp-badge">Досье 04</div>
      <div class="cat-grid">
        ${Object.keys(CATEGORIES).map(c=>`
          <div class="cat-btn ${S.category===c?'selected':''}" onclick="chooseCategory('${c}')">${c}</div>
        `).join('')}
      </div>
      <button class="btn btn-primary" style="margin-top:18px" ${!S.category?'disabled':''} onclick="goFromCategory()">Далее →</button>
      <button class="btn btn-ghost" onclick="backTo('mode')">← Назад</button>
    </div>
  `,

  roster: () => `
    <div class="header">
      <div class="eyebrow">Финальная сверка</div>
      <h1>Личный состав готов</h1>
    </div>
    <div class="steps">${stepsHtml(4)}</div>
    <div class="card">
      <div class="stamp-badge">Досье 05</div>
      <label class="field-label">Участники (${S.count})</label>
      <ul class="roster-list">
        ${S.names.map(n=>`<li>${escapeHtml(n)}</li>`).join('')}
      </ul>
      <label class="field-label" style="margin-top:16px">${S.mode==='classic' ? 'Сколько шпионов?' : 'Сколько двойников?'}</label>
      <div class="stepper">
        <button onclick="setSpyCount(-1)">−</button>
        <div class="count">${S.spyCount}</div>
        <button onclick="setSpyCount(1)">+</button>
      </div>
      <button class="btn btn-primary" onclick="buildRound()">Опечатать досье и начать →</button>
      <button class="btn btn-ghost" onclick="backTo(S.mode==='classic'?'category':'mode')">← Назад</button>
    </div>
  `,

  reveal: () => {
    const p = S.players[S.revealIndex];
    const isSpy = p.isImpostor;
    let roleLabel, wordText, wordClass = '';
    if(S.mode === 'classic'){
      if(isSpy){ roleLabel = 'Секретное задание'; wordText = 'ВЫ — ШПИОН'; wordClass='spy'; }
      else { roleLabel = 'Секретное место / роль'; wordText = p.word; }
    } else {
      roleLabel = 'Ваше слово';
      wordText = p.word;
    }
    return `
    <div class="header">
      <div class="eyebrow">Передача устройства</div>
      <h1>Только один взгляд</h1>
    </div>
    <div class="reveal-wrap">
      <div class="reveal-target">Передайте устройство агенту</div>
      <div class="reveal-name">${escapeHtml(p.name)}</div>
      <div class="file-card">
        <div class="file-role">${roleLabel}</div>
        <div class="file-word ${wordClass}">${escapeHtml(wordText)}</div>
        <div class="overlay" id="overlay"><span>Досье засекречено</span></div>
      </div>
      <button class="hold-btn"
        onmousedown="peek()" onmouseup="unpeek()" onmouseleave="unpeek()"
        ontouchstart="peek()" ontouchend="unpeek()" ontouchcancel="unpeek()">
        Нажмите и удерживайте, чтобы посмотреть
      </button>
      <div class="progress-dots">
        ${S.players.map((_,i)=>`<span class="${i<S.revealIndex?'done':(i===S.revealIndex?'current':'')}"></span>`).join('')}
      </div>
      <button class="btn btn-secondary" onclick="nextPlayer()">Я запомнил(а), передать дальше →</button>
    </div>
    `;
  },

  discuss: () => `
    <div class="header">
      <div class="eyebrow">Обсуждение</div>
      <h1>Найдите предателя</h1>
    </div>
    <div class="card" style="text-align:center">
      <div class="stamp-badge">Досье 06</div>
      <p style="font-size:13px;color:var(--text-paper-dim);margin-top:6px">По очереди описывайте слово, не называя его напрямую. Затем проголосуйте, кто, по-вашему, ${S.mode==='classic' ? 'шпион' : 'двойник'}.</p>
      <div class="timer-display" id="timerVal">${fmtTime(S.timerRemaining)}</div>
      <div class="row2">
        <button class="btn btn-ghost" onclick="adjustTimer(-30)">−30с</button>
        <button class="btn btn-ghost" onclick="adjustTimer(30)">+30с</button>
      </div>
      <button class="btn btn-secondary" id="timerToggleBtn" onclick="toggleTimer()">${S.timerRunning ? 'Пауза' : 'Старт обсуждения'}</button>
      <button class="btn btn-ghost" onclick="resetTimer()">Сбросить таймер</button>
      <button class="btn btn-primary" onclick="goToResults()">Показать результаты →</button>
    </div>
  `,

  results: () => `
    <div class="header">
      <div class="eyebrow">Досье закрыто</div>
      <h1>Результаты операции</h1>
    </div>
    <div class="card">
      <div class="stamp-badge">Рассекречено</div>
      ${S.mode==='classic' ? `
        <div class="results-word">
          <div class="label">Секретное место / роль</div>
          <div class="value">${escapeHtml(S.wordMajor)}</div>
        </div>
      ` : `
        <div class="results-word">
          <div class="label">Слово большинства</div>
          <div class="value">${escapeHtml(S.wordMajor)}</div>
        </div>
        <div class="results-word">
          <div class="label">Слово двойника</div>
          <div class="value">${escapeHtml(S.wordMinor)}</div>
        </div>
      `}
      <label class="field-label">Кто есть кто</label>
      <ul class="roster-list">
        ${S.players.map(p=>`
          <li>${escapeHtml(p.name)} ${p.isImpostor ? `<span class="tag">${S.mode==='classic'?'Шпион':'Двойник'}</span>` : ''}</li>
        `).join('')}
      </ul>
      <button class="btn btn-primary" onclick="newRoundSamePlayers()">Новый раунд, те же агенты →</button>
      <button class="btn btn-ghost" onclick="newGame()">Новая игра</button>
    </div>
  `,
};

function stepsHtml(activeIndex){
  const total = 6;
  let out = '';
  for(let i=0;i<total;i++){
    out += `<span class="${i<=activeIndex?'active':''}"></span>`;
  }
  return out;
}
function fmtTime(sec){
  const m = Math.floor(sec/60).toString().padStart(2,'0');
  const s = (sec%60).toString().padStart(2,'0');
  return m+':'+s;
}
function escapeHtml(str){
  return String(str).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function peek(){ showOverlay(); }
function unpeek(){ hideOverlay(); }

render();