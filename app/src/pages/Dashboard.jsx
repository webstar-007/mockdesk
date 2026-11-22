import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { duration, fmtDate, fmtDateTime, num } from '../lib/format.js';
import { EXAMS } from '../lib/exams.js';
import { tip } from '../components/Tip.jsx';
import PdfMenu from '../components/PdfMenu.jsx';
import Blueprint from '../components/Blueprint.jsx';
import PracticeCard from '../components/PracticeCard.jsx';
import { ActivityMap, LockedInsights, ToolTiles, ReadinessGauge, SkillRadar, StudyPlanner, Trajectory, readinessOf } from '../components/Insights.jsx';

const STATUS = { not_attempted: ['Not attempted', 'st-none'], in_progress: ['In progress', 'st-prog'], completed: ['Completed', 'st-done'] };
export default function Dashboard() {
  const { user, config } = useAuth();
  const nav = useNavigate();
  const exams = config?.exams?.length ? config.exams : EXAMS; const [examPick, setExam] = useState(null); const exam = examPick && exams.some((x) => x.id === examPick) ? examPick : exams[0].id; const [filter, setFilter] = useState('all'); const [allMocks, setMocks] = useState(null); const [stats, setStats] = useState(null); const [hist, setHist] = useState([]); const [err, setErr] = useState(''); const [busy, setBusy] = useState(''); const [tab, setTabState] = useState(() => { try { return sessionStorage.getItem('md-dash-tab') || 'mocks'; } catch { return 'mocks'; } });
  const setTab = (t) => { setTabState(t); try { sessionStorage.setItem('md-dash-tab', t); } catch { /* optional */ } };
  useEffect(() => {
    Promise.all([api.get('/mocks'), api.get('/stats'), api.get('/attempts')])
      .then(([m, s, h]) => { setMocks(m.mocks); setStats(s); setHist(h.attempts.filter((a) => a.status === 'submitted')); })
      .catch((e) => setErr(e.message));
  }, []);
  const start = async (m) => {
    if (m.locked) return nav('/profile#invite');
    if (m.status === 'in_progress') return nav(`/exam/${m.inProgressAttemptId}`);
    nav(`/mock/${m.id}`);
  };
  if (err) return <div className="alert" role="alert">{err}</div>;
  if (!allMocks) return <p role="status" className="muted">Loading dashboard…</p>;
  const mocks = allMocks.filter((m) => (m.examId || 'ssc-cgl-t2') === exam);
  const pat = config?.patterns?.[exam]; const bpConfig = pat ? { ...config, sections: pat.sections, segments: pat.segments } : config;
  const gap = user?.targetScore && stats?.bestScore != null ? user.targetScore - stats.bestScore : null;
  const first = user.name.split(' ')[0];
  const daysLeft = user.examDate ? Math.ceil((new Date(user.examDate + 'T00:00:00') - new Date().setHours(0, 0, 0, 0)) / 86400000) : null;
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Burning the midnight oil' : hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const done = mocks.filter((m) => m.status === 'completed').length;
  const inProg = mocks.find((m) => m.status === 'in_progress');
  const open_ = mocks.filter((m) => !m.locked && !m.upcoming && m.live?.state !== 'closed');
  const nextMock = inProg || open_.find((m) => m.status === 'not_attempted') || open_.slice().sort((x, y) => (x.best?.percentage ?? 0) - (y.best?.percentage ?? 0))[0];
  const lastDone = hist[0];
  const totalQs = mocks.reduce((a, m) => a + m.totalQuestions + (m.qualifying || []).reduce((b, x) => b + x.questions, 0), 0);
  const counts = { all: mocks.length, live: mocks.filter((m) => m.live).length, pyq: mocks.filter((m) => m.kind === 'pyq').length, not_attempted: mocks.filter((m) => m.status === 'not_attempted').length, in_progress: mocks.filter((m) => m.status === 'in_progress').length, completed: done };
  const shown = mocks.filter((m) => filter === 'all' || (filter === 'live' ? !!m.live : filter === 'pyq' ? m.kind === 'pyq' : m.status === filter));
  const examName = exams.find((x) => x.id === exam)?.name;
  const maxMarks = pat?.scoredMarks || config?.scoredMarks || 390;
  const primary = exam === exams[0].id; const mine = mocks.filter((m) => m.best); const kBest = mine.length ? Math.max(...mine.map((m) => m.best.score)) : null; const kAvg = mine.length ? mine.reduce((a, m) => a + m.best.percentage, 0) / mine.length : null;
  const examHist = hist.filter((h) => mocks.some((m) => m.id === h.mockId));
  const readiness = stats?.completed && primary ? readinessOf({ stats, mocksTotal: mocks.length, target: user.targetScore, maxMarks }) : null;
  const secs = Object.entries(config?.sections || {});
  const minsOf = (k) => config?.segments?.find((sg) => sg.sections.includes(k))?.minutes;
  const targetPct = user?.targetScore && stats?.bestScore != null ? Math.min(100, Math.round((stats.bestScore / user.targetScore) * 100)) : null;
  const ring = (pct, label, sub) => (
    <div className="hm-ring" role="img" aria-label={`${label}: ${sub}`}>
      <svg viewBox="0 0 36 36" aria-hidden="true"><circle className="hm-ring-bg" cx="18" cy="18" r="15.9" /><circle className="hm-ring-fg" cx="18" cy="18" r="15.9" strokeDasharray={`${pct} 100`} style={pct ? undefined : { opacity: 0 }} /></svg>
      <b>{sub}</b><span>{label}</span>
    </div>
  );
  const pSecs = Object.values(pat?.sections || config?.sections || {}); const sc = pSecs.find((x) => !x.qualifying) || { marksPerQuestion: 3, negativeMarks: 1 }; const qs = pSecs.find((x) => x.qualifying);
  const tips = [
    ['Start with your strongest section', pat && pat.segments.length > 1 ? 'Sections are timed and locked one after another, so bank the sure marks first.' : 'Spend the first pass on the questions you are sure about, then come back for the rest.'],
    [`Every wrong answer costs ${sc.negativeMarks} mark${sc.negativeMarks === 1 ? '' : 's'}`, `Each question is worth ${sc.marksPerQuestion} marks, so skip a question when you cannot cut at least two options.`],
    qs ? ['Computer is qualifying only', `You need ${qs.qualifyingMarks} of ${qs.questions * qs.marksPerQuestion} to qualify and its marks are not added to your total.`] : ['Keep an eye on the clock', 'Aim to finish a first pass with a few minutes spare, then revisit the questions you marked.'],
    ['Review every mock within a day', 'Read the “Common mistake” note even on questions you got right.'],
  ];
  const bestOf = (m) => m.best ? Math.round(m.best.percentage) : null;
  const tabs = [['mocks', 'Mocks'], ['progress', 'Progress'], ['practice', 'Practice'], ['guide', 'Guide']];
  const nextLabel = inProg ? 'Resume test' : done ? 'Start next mock' : 'Start your first mock';
  const mockAction = (m) => (m.upcoming ? 'Not open yet' : m.locked ? 'Invite to unlock' : m.status === 'in_progress' ? 'Resume' : m.status === 'completed' ? 'Retake' : 'Start');
  return (
    <div className="sd">
      <header className="sd-top">
        <div>
          <h1>{greet}, {first}</h1>
          <p className="muted">{done ? `${done} of ${mocks.length} mocks done` : 'Take a first mock to set your baseline'}{daysLeft != null && daysLeft >= 0 ? ` · ${daysLeft === 0 ? 'exam is today' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} to your exam`}` : ''}</p>
        </div>
        {exams.length > 1 && <div className="sd-exams" role="group" aria-label="Choose exam">{exams.map((x) => <button key={x.id} className={exam === x.id ? 'on' : ''} aria-pressed={exam === x.id} onClick={() => { setExam(x.id); setFilter('all'); }}>{x.name}</button>)}</div>}
      </header>

      <section className="sd-next" aria-label="Your next step">
        {nextMock ? (
          <div className="sd-next-main">
            <span className="sd-chip">{inProg ? 'In progress' : done ? 'Up next' : 'Start here'}</span>
            <h2>{nextMock.name.replace('CGL Tier-II ', '')}</h2>
            <p className="sd-facts">{nextMock.totalQuestions + (nextMock.qualifying || []).reduce((b, x) => b + x.questions, 0)} questions · {nextMock.totalMarks} marks · {nextMock.totalMinutes} min · {nextMock.difficulty}</p>
            <div className="sd-cta">
              <button className="sd-btn sd-btn-pri" onClick={() => start(nextMock)}>{nextLabel}</button>
              {lastDone && <Link className="sd-btn" to={`/results/${lastDone.id}`}>Last analysis</Link>}
            </div>
          </div>
        ) : <div className="sd-next-main"><h2>{mocks.length ? 'You have finished every open mock' : `No ${examName} mocks yet`}</h2><p className="sd-facts">{mocks.length ? 'Review your mistakes while new papers are added.' : 'Check back soon.'}</p>{lastDone && <div className="sd-cta"><Link className="sd-btn sd-btn-pri" to={`/results/${lastDone.id}`}>Last analysis</Link></div>}</div>}
        {mine.length > 0 && <dl className="sd-stats" aria-label="Your numbers">
          <div><dt>Best score</dt><dd>{kBest != null ? <>{num(kBest)}<small>/{maxMarks}</small></> : '–'}</dd></div>
          <div><dt>Average</dt><dd>{mine.length ? `${num(kAvg)}%` : '–'}</dd></div>
          <div><dt>{targetPct != null ? 'Of target' : 'Accuracy'}</dt><dd>{targetPct != null ? `${targetPct}%` : stats?.completed ? `${num(stats.avgAccuracy)}%` : '–'}</dd></div>
        </dl>}
      </section>

      <nav className="sd-tabs" role="tablist" aria-label="Dashboard sections">
        {tabs.map(([k, l]) => <button key={k} role="tab" id={`sd-t-${k}`} aria-selected={tab === k} aria-controls="sd-panel" className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
      </nav>

      <div id="sd-panel" role="tabpanel" aria-labelledby={`sd-t-${tab}`}>
        {tab === 'mocks' && (
          <section aria-label="Full-length mocks">
            <div className="sd-filters" role="group" aria-label="Filter mocks">
              {[['all', 'All'], ['not_attempted', 'New'], ['in_progress', 'In progress'], ['completed', 'Done'], ...(counts.live ? [['live', 'Live']] : []), ...(counts.pyq ? [['pyq', 'Past papers']] : [])].map(([k, l]) => <button key={k} className={filter === k ? 'on' : ''} aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}<span>{counts[k] ?? 0}</span></button>)}
            </div>
            {shown.length === 0 && <p className="sd-empty muted">{mocks.length === 0 ? `No ${examName} mocks have been published yet. Check back soon.` : 'Nothing in this view yet.'}</p>}
            <ul className="sd-list">
              {shown.map((m) => {
                const i = mocks.indexOf(m); const [label, cls] = STATUS[m.status]; const b = bestOf(m); const isNext = m.id === nextMock?.id;
                return (
                  <li key={m.id} className={`sd-row ${m.locked ? 'is-locked' : ''} ${isNext ? 'is-next' : ''}`}>
                    <span className="sd-num" aria-hidden="true">{i + 1}</span>
                    <div className="sd-row-main">
                      <h3>{m.name.replace('CGL Tier-II ', '')}{m.kind === 'pyq' && <span className="sd-tag">Past paper{m.paperYear ? ` ${m.paperYear}` : ''}</span>}{m.live && <span className="sd-tag live">Live</span>}{m.locked && <span className="sd-tag">Locked</span>}</h3>
                      <p className="sd-meta">{m.totalQuestions + (m.qualifying || []).reduce((x, y) => x + y.questions, 0)} Qs · {m.totalMarks} marks · {m.totalMinutes} min · {m.difficulty}{!m.complete ? ' · still being completed' : ''}</p>
                      {m.live && <p className="sd-live">{m.live.state === 'upcoming' ? `Opens ${fmtDateTime(m.live.opensAt)}` : m.live.state === 'open' ? `Open until ${fmtDateTime(m.live.closesAt)}. Your first finished attempt counts for rank.` : (m.live.rank ? `You ranked #${m.live.rank} of ${m.live.of}` : 'Window closed. Ranks are final.')}</p>}
                    </div>
                    <div className="sd-row-score">{b != null ? <><b>{m.best.score}<small>/{m.totalMarks}</small></b><i className="sd-bar" aria-hidden="true"><u style={{ width: `${Math.min(100, b)}%` }} /></i></> : <span className={`status ${cls}`}>{label}</span>}</div>
                    <div className="sd-row-act">
                      <button className={`sd-btn ${m.status === 'completed' ? '' : 'sd-btn-pri'}`} disabled={busy === m.id || m.upcoming} onClick={() => start(m)}>{mockAction(m)}</button>
                      {m.last && <Link className="sd-link" to={`/results/${m.last.attemptId}`}>Result</Link>}
                      {m.live && <Link className="sd-link" to={`/live/${m.id}`}>{m.live.state === 'closed' ? 'Leaderboard' : 'Details'}</Link>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {tab === 'progress' && (!primary
          ? <div className="card"><h3>Your progress in {examName}</h3><p className="muted">{mine.length ? 'Open any finished mock for its full section and topic analysis. Questions you got wrong are collected in your Notebook.' : 'Finish a mock to see your analysis here.'} <Link to="/notebook">Open notebook</Link></p></div>
          : stats?.completed > 0 ? (
            <div className="ix-grid">
              <ReadinessGauge r={readiness} />
              <SkillRadar sections={stats.sections} />
              <div className="ix-plan"><StudyPlanner stats={stats} nextMock={nextMock} mocksLeft={mocks.filter((m) => m.status === 'not_attempted').length} daysLeft={daysLeft} lastId={lastDone?.id} sectionName={config?.sections[stats.weakest]?.short} /></div>
              <Trajectory trend={stats.trend} target={user.targetScore} maxMarks={maxMarks} />
              <div className="ix-card ix-weak"><h3>Weakest topics</h3>
                {stats.weakTopics?.length ? <ul className="weak-list">{stats.weakTopics.slice(0, 6).map((t) => <li key={t.topic + t.section}><span>{t.topic}<small> · {config?.sections[t.section]?.short}</small></span><b>{t.accuracy}%</b></li>)}</ul> : <p className="muted small">Not enough data yet.</p>}
                {lastDone && <Link className="hm-more" to={`/review/${lastDone.id}?filter=incorrect`}>Review last mock’s mistakes →</Link>}
              </div>
              <div className="ix-full"><ActivityMap stamps={stats.activity} /></div>
              {examHist.length > 0 && (
                <div className="ix-full"><h3>Attempt history</h3>
                  <div className="tbl-wrap card nopad"><table className="dtable hist">
                    <thead><tr><th>Test</th><th>Date</th><th>Score</th><th>Accuracy</th><th>Computer</th><th>Time</th><th /></tr></thead>
                    <tbody>{examHist.map((h) => <tr key={h.id}><th scope="row">{h.mockName}</th><td>{fmtDate(h.submittedAt)}</td><td>{h.score}/{h.maxMarks}</td><td>{h.accuracy}%</td><td>{h.qualified === null || h.qualified === undefined ? '–' : <span className={`qchip ${h.qualified ? 'q-pass' : 'q-fail'}`}>{h.qualified ? 'Qualified' : 'Not qualified'}</span>}</td><td>{duration(h.timeTakenSec)}</td><td><Link to={`/results/${h.id}`}>Analysis</Link> · <Link to={`/review/${h.id}`}>Review</Link> · <PdfMenu id={h.id} compact /></td></tr>)}</tbody>
                  </table></div></div>
              )}
            </div>
          ) : <LockedInsights />)}

        {tab === 'practice' && (
          <div className="sd-stack"><PracticeCard />{stats?.completed ? <ToolTiles /> : null}</div>
        )}

        {tab === 'guide' && (
          <div className="sd-stack">
            <Blueprint config={bpConfig} examName={examName} />
            <section className="hm-tips" aria-label="Exam tips">
              <div className="hm-head"><h2>Exam-day playbook</h2></div>
              <div className="hm-tip-grid">
                {tips.map(([t, d], i) => <div className="hm-tip" key={t}><b aria-hidden="true">{['①', '②', '③', '④'][i]}</b><div><h4>{t}</h4><p>{d}</p></div></div>)}
                {stats?.completed > 0 && stats.weakest && <div className="hm-tip hm-focus"><b>!</b><div><h4>Focus next: {config?.sections[stats.weakest]?.short}</h4><p>Your lowest average section so far{stats.weakTopics?.[0] ? `, with ${stats.weakTopics[0].topic} the weakest topic` : ''}. Revise it before your next mock.</p></div></div>}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
