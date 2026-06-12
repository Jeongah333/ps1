import { useEffect, useMemo, useState } from 'react'
import {
  CategoryScale, Chart as ChartJS, Filler, LinearScale, LineElement, PointElement, Tooltip,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import {
  deleteTask, loginEmail, loginSocial, logout, observeAuth, observeUserData, saveRecord, saveTask, toggleTask,
} from './dataService'
import {
  calculateScore, createAiComment, energyLabels, moodLabels, sampleRecords, scoreInfo, todayKey,
} from './lib'
import { isFirebaseConfigured } from './firebase'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip)

const emptyCondition = { sleep: 7, mood: 'normal', fatigue: 3 }

function Login() {
  const [isSignup, setIsSignup] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true); setError('')
    try { await loginEmail(form.email, form.password, isSignup ? form.name : '') }
    catch (err) { setError(err.message.replace('Firebase: ', '')) }
    finally { setLoading(false) }
  }
  const social = async (provider) => {
    setLoading(true); setError('')
    try { await loginSocial(provider) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return <main className="login-page">
    <section className="login-visual">
      <div className="brand-mark">%</div>
      <p className="eyebrow">MY ENERGY PLANNER</p>
      <h1>오늘 몇<br /><span>퍼센트?</span></h1>
      <p>내 컨디션을 이해하면,<br />오늘의 계획은 조금 더 다정해져요.</p>
      <div className="float-card card-one"><b>82%</b><span>집중하기 좋은 날</span></div>
      <div className="float-card card-two"><b>💗</b><span>나를 위한 계획</span></div>
    </section>
    <section className="login-panel">
      <div className="login-box">
        <div className="mobile-logo"><span>%</span> 오늘 몇 퍼센트?</div>
        <p className="eyebrow">반가워요!</p>
        <h2>{isSignup ? '새로운 하루를 시작해요' : '오늘의 나를 만나볼까요?'}</h2>
        <p className="muted">{isSignup ? '가입하고 나만의 컨디션 기록을 시작하세요.' : '로그인하고 오늘의 에너지를 확인하세요.'}</p>
        <div className="socials">
          <button onClick={() => social('kakao')} className="social kakao">💬 <span>카카오</span></button>
          <button onClick={() => social('google')} className="social google">G <span>구글</span></button>
          <button onClick={() => social('naver')} className="social naver">N <span>네이버</span></button>
        </div>
        <div className="divider"><span>또는 이메일로</span></div>
        <form onSubmit={submit}>
          {isSignup && <label>이름<input required placeholder="퍼센티" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>}
          <label>이메일<input required type="email" placeholder="hello@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label>비밀번호<input required minLength="6" type="password" placeholder="6자 이상 입력해 주세요" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
          {error && <p className="error">{error}</p>}
          <button disabled={loading} className="primary full">{loading ? '잠시만요...' : isSignup ? '회원가입' : '로그인'}</button>
        </form>
        <button className="text-button" onClick={() => setIsSignup(!isSignup)}>
          {isSignup ? '이미 계정이 있나요? 로그인' : '처음이신가요? 이메일로 회원가입'}
        </button>
        {!isFirebaseConfigured && <p className="demo-note">현재 데모 모드예요. 어떤 버튼으로든 바로 체험할 수 있어요.</p>}
      </div>
    </section>
  </main>
}

function ConditionModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial)
  const preview = calculateScore(form)
  return <div className="modal-backdrop" onMouseDown={onClose}>
    <section className="modal" onMouseDown={(e) => e.stopPropagation()}>
      <button className="modal-close" onClick={onClose}>×</button>
      <p className="eyebrow">CHECK-IN</p><h2>오늘의 나는 어떤가요?</h2>
      <div className="preview-score"><span>{scoreInfo(preview).emoji}</span><b>{preview}%</b><small>예상 체력 점수</small></div>
      <label>수면시간 <b>{form.sleep}시간</b>
        <input type="range" min="0" max="12" step="0.5" value={form.sleep} onChange={(e) => setForm({ ...form, sleep: e.target.value })} />
      </label>
      <label>기분</label>
      <div className="choice-row">{[['good','😊','좋음'],['normal','😐','보통'],['bad','😔','나쁨']].map(([value, emoji, text]) =>
        <button key={value} className={form.mood === value ? 'choice active' : 'choice'} onClick={() => setForm({ ...form, mood: value })}><span>{emoji}</span>{text}</button>)}</div>
      <label>피로도 <b>{form.fatigue}단계</b></label>
      <div className="fatigue-row">{[1,2,3,4,5].map((value) => <button key={value} className={Number(form.fatigue) === value ? 'fatigue active' : 'fatigue'} onClick={() => setForm({ ...form, fatigue: value })}>{value}</button>)}</div>
      <button className="primary full" onClick={() => onSave(form)}>오늘 컨디션 저장하기</button>
    </section>
  </div>
}

function App() {
  const [user, setUser] = useState(undefined)
  const [data, setData] = useState({})
  const [modal, setModal] = useState(false)
  const [taskText, setTaskText] = useState('')
  const [taskEnergy, setTaskEnergy] = useState('medium')
  const [diary, setDiary] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => observeAuth(setUser), [])
  useEffect(() => user ? observeUserData(user.uid, setData) : undefined, [user])
  const records = useMemo(() => Object.values(data.records || {}).sort((a, b) => a.date.localeCompare(b.date)), [data.records])
  const todayRecord = data.records?.[todayKey()]
  const score = todayRecord?.score ?? 68
  const info = scoreInfo(score)
  const tasks = useMemo(() => Object.values(data.tasks || {}).sort((a, b) => b.createdAt - a.createdAt), [data.tasks])
  const recommended = tasks.filter((task) => !task.completed && task.energy === info.level)
  const chartRecords = [...sampleRecords, ...records].reduce((acc, record) => ({ ...acc, [record.date]: record }), {})
  const recent = Object.values(chartRecords).sort((a, b) => a.date.localeCompare(b.date)).slice(-7)

  useEffect(() => setDiary(todayRecord?.diary || ''), [todayRecord?.diary])

  if (user === undefined) return <div className="splash"><div className="brand-mark">%</div><p>오늘의 퍼센트를 준비 중...</p></div>
  if (!user) return <Login />

  const saveCondition = async (condition) => {
    try {
      await saveRecord(user.uid, { ...condition, date: todayKey(), score: calculateScore(condition), diary })
      setModal(false); setNotice('오늘의 컨디션을 저장했어요!')
    } catch { setNotice('저장하지 못했어요. 잠시 후 다시 시도해 주세요.') }
  }
  const addTask = async (event) => {
    event.preventDefault()
    if (!taskText.trim()) return
    const id = crypto.randomUUID()
    try { await saveTask(user.uid, { id, text: taskText.trim(), energy: taskEnergy, completed: false, createdAt: Date.now() }); setTaskText('') }
    catch { setNotice('할 일을 저장하지 못했어요.') }
  }
  const saveDiary = async () => {
    const condition = todayRecord || { ...emptyCondition, date: todayKey(), score }
    try { await saveRecord(user.uid, { ...condition, diary }); setNotice('오늘의 한 줄을 저장했어요.') }
    catch { setNotice('일기를 저장하지 못했어요.') }
  }

  return <div className="app-shell">
    {notice && <button className="toast" onClick={() => setNotice('')}>{notice} ×</button>}
    {modal && <ConditionModal initial={todayRecord || emptyCondition} onClose={() => setModal(false)} onSave={saveCondition} />}
    <header>
      <a className="logo"><span>%</span><b>오늘 몇 퍼센트?</b></a>
      <nav><a href="#today">오늘</a><a href="#tasks">할 일</a><a href="#record">기록</a></nav>
      <div className="user-menu"><span>{user.displayName || '퍼센티'} 님</span><button onClick={logout}>로그아웃</button></div>
    </header>
    <main className="dashboard">
      <section className="welcome"><div><p className="eyebrow">{new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })}</p><h1>좋은 하루예요, <span>{user.displayName?.split(' ')[0] || '퍼센티'} 님!</span></h1><p>오늘의 에너지에 맞춰 가볍게 시작해 봐요.</p></div><button className="primary" onClick={() => setModal(true)}>+ 오늘 컨디션 입력</button></section>

      <section id="today" className={`hero-card ${info.level}`}>
        <div className="score-copy"><span className="status-pill">{info.emoji} {info.label}</span><h2>오늘의 체력은<br /><b>{score}%</b>예요</h2><p>{info.message}</p><button onClick={() => setModal(true)}>컨디션 다시 체크하기 →</button></div>
        <div className="score-ring" style={{ '--score': `${score * 3.6}deg` }}><div><span>{info.emoji}</span><b>{score}</b><small>PERCENT</small></div></div>
        <div className="condition-summary">
          <div><span>🌙</span><small>수면</small><b>{todayRecord?.sleep ?? '-'}시간</b></div>
          <div><span>💭</span><small>기분</small><b>{moodLabels[todayRecord?.mood] || '-'}</b></div>
          <div><span>🔋</span><small>피로도</small><b>{todayRecord?.fatigue ? `${todayRecord.fatigue}단계` : '-'}</b></div>
        </div>
      </section>

      <section className="grid">
        <article className="card recommendation">
          <div className="card-head"><div><p className="eyebrow">FOR YOU</p><h2>지금 하기 좋은 일</h2></div><span className={`energy ${info.level}`}>{energyLabels[info.level]}</span></div>
          {recommended.length ? recommended.slice(0, 3).map((task) => <TaskItem key={task.id} task={task} user={user} />) :
            <div className="empty"><span>💌</span><b>딱 맞는 할 일을 기다리고 있어요</b><p>{energyLabels[info.level]} 할 일을 추가하면 여기에 보여드릴게요.</p></div>}
          {score < 50 && <p className="rest-message">☕ 오늘은 쉬어가는 것도 훌륭한 계획이에요.</p>}
        </article>
        <article id="record" className="card chart-card">
          <div className="card-head"><div><p className="eyebrow">WEEKLY</p><h2>최근 7일 컨디션 변화</h2></div><span className="trend">평균 {Math.round(recent.reduce((sum, r) => sum + r.score, 0) / recent.length)}%</span></div>
          <div className="chart-wrap"><Line data={{ labels: recent.map((r) => r.date.slice(5).replace('-', '/')), datasets: [{ data: recent.map((r) => r.score), borderColor: '#f35f91', backgroundColor: 'rgba(243,95,145,.12)', fill: true, tension: .42, pointBackgroundColor: '#fff', pointBorderColor: '#f35f91', pointBorderWidth: 3, pointRadius: 5 }] }} options={{ maintainAspectRatio: false, plugins: { tooltip: { displayColors: false, callbacks: { label: (ctx) => `${ctx.raw}%` } } }, scales: { y: { min: 0, max: 100, grid: { color: '#f5edf0' }, ticks: { stepSize: 25 } }, x: { grid: { display: false } } } }} /></div>
        </article>
      </section>

      <section className="grid lower">
        <article id="tasks" className="card tasks-card">
          <div className="card-head"><div><p className="eyebrow">TO-DO</p><h2>오늘의 할 일</h2></div><span className="count">{tasks.filter((t) => t.completed).length}/{tasks.length}</span></div>
          <form className="task-form" onSubmit={addTask}><input placeholder="무엇을 해볼까요?" value={taskText} onChange={(e) => setTaskText(e.target.value)} /><select value={taskEnergy} onChange={(e) => setTaskEnergy(e.target.value)}><option value="high">고에너지</option><option value="medium">중에너지</option><option value="low">저에너지</option></select><button className="primary">추가</button></form>
          <div className="task-list">{tasks.length ? tasks.map((task) => <TaskItem key={task.id} task={task} user={user} deletable />) : <div className="empty compact"><span>📝</span><p>오늘의 첫 할 일을 적어보세요.</p></div>}</div>
        </article>
        <div className="side-stack">
          <article className="card ai-card"><div className="ai-icon">✨</div><div><p className="eyebrow">PERCENT AI</p><h3>오늘의 코멘트</h3><p>{createAiComment(records, score)}</p></div></article>
          <article className="card diary-card"><div className="card-head"><div><p className="eyebrow">ONE LINE</p><h2>오늘의 한 줄</h2></div><span>✍️</span></div><textarea maxLength="100" placeholder="오늘 하루는 어땠나요?" value={diary} onChange={(e) => setDiary(e.target.value)} /><div className="diary-foot"><small>{diary.length}/100</small><button onClick={saveDiary}>저장하기</button></div></article>
        </div>
      </section>
    </main>
    <footer>오늘 몇 퍼센트? · 나에게 맞는 속도로 보내는 하루 💗</footer>
  </div>
}

function TaskItem({ task, user, deletable }) {
  return <div className={task.completed ? 'task done' : 'task'}>
    <button className="check" onClick={() => toggleTask(user.uid, task)}>{task.completed ? '✓' : ''}</button>
    <span className="task-name">{task.text}</span>
    <span className={`energy ${task.energy}`}>{energyLabels[task.energy]}</span>
    {deletable && <button className="delete" onClick={() => deleteTask(user.uid, task.id)}>×</button>}
  </div>
}

export default App
