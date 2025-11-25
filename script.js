// app.js (ES module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getDatabase, ref, push, onChildAdded, set, onValue, remove, runTransaction, get, child, update } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

/* ====== ضع هنا إعدادات Firebase التي زودتني بها ====== */
const firebaseConfig = {
  apiKey: "AIzaSyCUykduRqyAIJBq3AmAiSaohwETYXFliCg",
  authDomain: "lafamilleapp.firebaseapp.com",
  databaseURL: "https://lafamilleapp-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lafamilleapp",
  storageBucket: "lafamilleapp.firebasestorage.app",
  messagingSenderId: "1046421397750",
  appId: "1:1046421397750:web:473b460107e6fc78570cd7",
  measurementId: "G-TW90804ET9"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics ? getAnalytics(app) : null;
const db = getDatabase(app);

/* ====== عناصر DOM ====== */
const loginScreen = document.getElementById('login-screen');
const mainScreen = document.getElementById('main-screen');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const usernameInput = document.getElementById('username');
const adminPassInput = document.getElementById('admin-pass');
const userInfo = document.getElementById('user-info');

const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');

const quotesList = document.getElementById('quotes-list');
const quoteInput = document.getElementById('quote-input');
const postQuoteBtn = document.getElementById('post-quote-btn');

const rollBtn = document.getElementById('roll-btn');
const diceResult = document.getElementById('dice-result');
const ludoTurn = document.getElementById('ludo-turn');
const resetLudoBtn = document.getElementById('reset-ludo');

const adminTab = document.getElementById('admin-tab');
const adminSection = document.getElementById('admin');
const clearMessagesBtn = document.getElementById('clear-messages');
const clearQuotesBtn = document.getElementById('clear-quotes');
const resetLudoAdminBtn = document.getElementById('reset-ludo-admin');
const adminLog = document.getElementById('admin-log');

const tabs = document.querySelectorAll('.tab-btn');
const tabSections = document.querySelectorAll('.tab');

/* ====== حالة المستخدم محليًا ====== */
let currentUser = { name: null, isAdmin: false, id: null };

/* ====== وظائف الواجهة ====== */
function showScreen(screenId) {
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function showTab(tabName) {
  tabs.forEach(b=>b.classList.remove('active'));
  tabSections.forEach(t=>t.classList.remove('active'));
  document.querySelector(`.tab-btn[data-show="${tabName}"]`).classList.add('active');
  document.getElementById(tabName).classList.add('active');
}

/* التبويبات */
tabs.forEach(btn=>{
  btn.addEventListener('click', ()=> showTab(btn.dataset.show));
});

/* تسجيل دخول محلي + علامة أدمن */
btnLogin.addEventListener('click', async ()=>{
  const name = usernameInput.value.trim();
  if(!name){ alert('أدخل اسم مستخدم'); return; }
  const pass = adminPassInput.value.trim();

  currentUser.name = name;
  currentUser.isAdmin = (pass === 'mohcinrx');
  currentUser.id = 'u_' + Date.now() + '_' + Math.floor(Math.random()*999);

  userInfo.textContent = `${currentUser.name} ${currentUser.isAdmin? '(أدمن)':''}`;
  showScreen('main-screen');

  if(currentUser.isAdmin){
    adminTab.style.display = 'inline-block';
  } else {
    adminTab.style.display = 'none';
  }

  // سجل دخول المستخدم في قائمة المتصلين (اختياري)
  const activeRef = ref(db, 'activeUsers/' + currentUser.id);
  set(activeRef, {name: currentUser.name, ts: Date.now()});
  // إزالة بعد ترك الصفحة
  window.addEventListener('beforeunload', ()=> remove(activeRef));
});

/* خروج */
btnLogout.addEventListener('click', ()=>{
  // إزالة من activeUsers
  if(currentUser.id) remove(ref(db, 'activeUsers/' + currentUser.id));
  currentUser = {name:null,isAdmin:false,id:null};
  usernameInput.value = '';
  adminPassInput.value = '';
  userInfo.textContent = '';
  adminTab.style.display = 'none';
  showScreen('login-screen');
});

/* ========== CHAT (Realtime) ========== */
const messagesRef = ref(db, 'messages');
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keyup', (e)=>{ if(e.key==='Enter') sendMessage(); });

function sendMessage(){
  if(!currentUser.name){ alert('سجل دخول أولاً'); return; }
  const text = chatInput.value.trim();
  if(!text) return;
  push(messagesRef, { username: currentUser.name, text, ts: Date.now(), uid: currentUser.id })
    .then(()=> chatInput.value = '')
    .catch(err=> console.error(err));
}

/* استماع لرسائل جديدة */
onChildAdded(messagesRef, (snap)=>{
  const val = snap.val();
  const id = snap.key;
  appendMessage(id, val);
});

function appendMessage(id, data){
  const div = document.createElement('div');
  div.className = 'msg';
  const meta = document.createElement('div');
  meta.className = 'meta';
  meta.textContent = `${data.username}`;
  const body = document.createElement('div');
  body.className = 'body';
  body.textContent = data.text;
  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.alignItems = 'center';
  right.style.gap = '8px';

  // delete btn (admin)
  if(currentUser.isAdmin){
    const del = document.createElement('button');
    del.textContent = 'حذف';
    del.addEventListener('click', ()=> {
      remove(ref(db, `messages/${id}`));
      logAdmin(`حذف رسالة ${id}`);
    });
    right.appendChild(del);
  }

  div.appendChild(meta);
  div.appendChild(body);
  div.appendChild(right);
  div.dataset.key = id;

  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/* ========== QUOTES ========== */
const quotesRef = ref(db, 'quotes');
postQuoteBtn.addEventListener('click', postQuote);
quoteInput.addEventListener('keyup', (e)=>{ if(e.key==='Enter') postQuote(); });

function postQuote(){
  if(!currentUser.name){ alert('سجل دخول أولاً'); return; }
  const text = quoteInput.value.trim();
  if(!text) return;
  push(quotesRef, { username: currentUser.name, text, ts: Date.now(), likes: 0 })
    .then(()=> quoteInput.value = '')
    .catch(err=> console.error(err));
}

/* استماع للاقتباسات */
onChildAdded(quotesRef, (snap)=>{
  const val = snap.val();
  const id = snap.key;
  appendQuote(id, val);
});

/* تحديث الاقتباسات (مثل لايك) */
onValue(quotesRef, (snap)=>{
  // إعادة رسم القائمة الخفيفة (يمكن تحسين الأداء لاحقًا)
  quotesList.innerHTML = '';
  snap.forEach(child=>{
    appendQuote(child.key, child.val());
  });
});

function appendQuote(id, data){
  const item = document.createElement('div');
  item.className = 'quote-item';
  const left = document.createElement('div');
  left.innerHTML = `<strong style="color:#ff6b6b">${data.username}</strong><div>${data.text}</div>`;

  const actions = document.createElement('div');
  actions.className = 'quote-actions';

  const likeBtn = document.createElement('button');
  likeBtn.textContent = `❤️ ${data.likes||0}`;
  likeBtn.addEventListener('click', ()=> {
    // زيادة اللايك بطريقة آمنة (transaction)
    const qRef = ref(db, `quotes/${id}/likes`);
    runTransaction(qRef, (cur)=>{
      return (cur||0) + 1;
    }).catch(e=>console.error(e));
  });
  actions.appendChild(likeBtn);

  // تعليقات (بسيطة - تفتح prompt)
  const commentBtn = document.createElement('button');
  commentBtn.textContent = '💬';
  commentBtn.addEventListener('click', async ()=>{
    const comment = prompt('اكتب تعليقك:');
    if(!comment) return;
    const cmRef = ref(db, `quotes/${id}/comments`);
    push(cmRef, { username: currentUser.name, text: comment, ts: Date.now() });
  });
  actions.appendChild(commentBtn);

  // حذف للأدمن
  if(currentUser.isAdmin){
    const del = document.createElement('button');
    del.textContent = 'حذف';
    del.addEventListener('click', ()=> {
      remove(ref(db, `quotes/${id}`));
      logAdmin(`حذف اقتباس ${id}`);
    });
    actions.appendChild(del);
  }

  item.appendChild(left);
  item.appendChild(actions);

  // عرض التعليقات (عند وجودها)
  const commentsDiv = document.createElement('div');
  commentsDiv.style.marginTop = '8px';
  commentsDiv.style.fontSize = '13px';
  commentsDiv.style.opacity = '0.9';

  // جلب التعليقات الحالية
  const cmRefAll = ref(db, `quotes/${id}/comments`);
  onValue(cmRefAll, snap=>{
    commentsDiv.innerHTML = '';
    snap.forEach(c=>{
      const cv = c.val();
      const el = document.createElement('div');
      el.textContent = `${cv.username}: ${cv.text}`;
      commentsDiv.appendChild(el);
    });
  });

  item.appendChild(commentsDiv);
  item.dataset.key = id;

  quotesList.prepend(item);
}

/* ========== LUDO (مشاركة الحالة عبر DB) ========== */
/*
  بنية لودو في DB:
  ludo: {
    positions: { red:0, blue:0, green:0, yellow:0 },
    currentPlayer: 0
  }
*/
const ludoRef = ref(db, 'ludo/state');

function initLudoIfNeeded(){
  // تأكد من وجود الحالة
  get(ludoRef).then(snap=>{
    if(!snap.exists()){
      set(ludoRef, {
        positions: { red:0, blue:0, green:0, yellow:0 },
        currentPlayer: 0,
        ts: Date.now()
      });
    } else {
      // nothing
    }
  }).catch(e=>console.error(e));
}

/* استماع لتغيّر حالة لودو وعرضها */
onValue(ludoRef, snap=>{
  const val = snap.val();
  if(!val) return;
  updateLudoUI(val);
});

/* تحديث الواجهة */
function updateLudoUI(state){
  const pos = state.positions || {red:0,blue:0,green:0,yellow:0};
  // حرك قطع اللاعبين إلى الخانات المناسبة عن طريق تغيير موضع CSS
  ['red','blue','green','yellow'].forEach((c, idx)=>{
    const pawn = document.getElementById(`pawn-${c}`);
    const cell = document.getElementById(`cell-${pos[c]}`);
    if(pawn && cell){
      pawn.style.top = cell.offsetTop + 'px';
      pawn.style.left = cell.offsetLeft + 'px';
    }
  });
  const names = ['الأحمر 🔴','الأزرق 🔵','الأخضر 🟢','الأصفر 🟡'];
  ludoTurn.textContent = `دور: ${names[(state.currentPlayer||0)%4]}`;
}

/* عند الضغط رمي النرد — استخدم runTransaction لتفادي التعارض */
rollBtn.addEventListener('click', ()=>{
  if(!currentUser.name){ alert('سجل دخول أولاً'); return; }
  // تشغيل معاملة لتحديث الحالة بأمان
  runTransaction(ludoRef, (curr)=>{
    if(curr === null){
      return {
        positions: { red:0,blue:0,green:0,yellow:0 },
        currentPlayer: 0
      };
    }
    const dice = Math.floor(Math.random()*6) + 1;
    diceResult.textContent = `النرد: ${dice}`;
    const order = ['red','blue','green','yellow'];
    const player = order[curr.currentPlayer % 4];
    curr.positions[player] = (curr.positions[player] || 0) + dice;
    if(curr.positions[player] > 11) curr.positions[player] = 11;
    // فوز (لا نعيد تعيين في DB هنا؛ سيبقى حتى يعيد أحدهم reset)
    curr.currentPlayer = (curr.currentPlayer + 1) % 4;
    curr.ts = Date.now();
    // نعيد الحالة المعدلة
    return curr;
  }).then(()=> {
    // تمت المعاملة
  }).catch(e=>console.error(e));
});

/* إعادة تعيين لودو محليًا (زر عام للمستخدمين) */
resetLudoBtn.addEventListener('click', ()=> {
  if(!confirm('إعادة تعيين لعبة لودو للجميع؟')) return;
  set(ludoRef, { positions: { red:0,blue:0,green:0,yellow:0 }, currentPlayer: 0, ts: Date.now()});
});

/* admin reset */
resetLudoAdminBtn.addEventListener('click', ()=> {
  if(!currentUser.isAdmin){ alert('أنت لست أدمن'); return; }
  set(ludoRef, { positions: { red:0,blue:0,green:0,yellow:0 }, currentPlayer: 0, ts: Date.now()});
  logAdmin('قام الأدمن بإعادة تعيين لودو');
});

/* ========== Admin actions: clear messages / quotes ========== */
clearMessagesBtn.addEventListener('click', ()=> {
  if(!currentUser.isAdmin){ alert('أنت لست أدمن'); return; }
  if(!confirm('حذف كل الرسائل نهائياً؟')) return;
  remove(ref(db, 'messages')).then(()=> logAdmin('حذف كل الرسائل')).catch(e=>console.error(e));
});

clearQuotesBtn.addEventListener('click', ()=> {
  if(!currentUser.isAdmin){ alert('أنت لست أدمن'); return; }
  if(!confirm('حذف كل الاقتباسات نهائياً؟')) return;
  remove(ref(db, 'quotes')).then(()=> logAdmin('حذف كل الاقتباسات')).catch(e=>console.error(e));
});

/* admin log */
function logAdmin(text){
  const el = document.createElement('div');
  el.textContent = `${new Date().toLocaleString()}: ${text}`;
  adminLog.prepend(el);
}

/* ========== helpers وتهيئة ====== */
function scrollToBottom(el){
  el.scrollTop = el.scrollHeight;
}

/* init */
initLudoIfNeeded();

/* وضع أزرار حذف للرسائل الموجودة سابقًا عند دخول الأدمن
   ملاحظة: appendMessage ينفذ عند onChildAdded فقط للمستقبل. */
/* للحصول على الرسائل الحالية (عند الدخول لأول مرة)، نستخدم onValue لمرة */
onValue(messagesRef, (snap)=>{
  chatBox.innerHTML = '';
  snap.forEach(child=>{
    appendMessage(child.key, child.val());
  });
});

/* إظهار تبويب الأدمن إذا المستخدم أدمن (حين تسجيل الدخول) */
const observerAdminVisibility = setInterval(()=>{
  if(currentUser && currentUser.isAdmin){
    adminTab.style.display = 'inline-block';
    clearInterval(observerAdminVisibility);
  }
}, 500);

/* اختتام */
console.log('App initialized. Firebase DB URL:', firebaseConfig.databaseURL);