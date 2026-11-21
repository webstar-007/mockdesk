// AI solution drafts. The model solves the question on its own, so a different answer from the key is a useful warning.
// Needs ANTHROPIC_API_KEY. Nothing is saved to a question until an editor approves it.
const LETTERS = 'ABCD';
export function makeDrafter(env = process.env) {
  if (!env.ANTHROPIC_API_KEY) return null;
  const model = env.MOCKDESK_AI_MODEL || 'claude-sonnet-5-5';
  return {
    model,
    async draft(q) {
      const prompt = `Question${q.passage ? ` (passage: ${q.passage})` : ''}: ${q.text}\n${q.options.map((o, i) => `${LETTERS[i]}) ${o}`).join('\n')}\n\nSolve this yourself first. Reply with JSON only, no other text:\n{"answer": <0-3 index of the option YOU find correct>, "explanation": "<clear solution for students, 2-5 sentences>", "steps": ["<short step>", ...], "shortcut": "<a faster method, or empty>", "trap": "<the common mistake, or empty>", "wrongReasons": ["<why option A is wrong, or null if it is your answer>", ...4 items]}`;
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model, max_tokens: 1200, system: 'You write clear, correct solutions for SSC CGL practice questions. Be concise. Never invent facts for General Awareness; if unsure, say so in the explanation.', messages: [{ role: 'user', content: prompt }] }) });
      if (!r.ok) throw new Error(`The AI service responded ${r.status}`);
      const j = await r.json(); return parseDraft(j?.content?.[0]?.text || '');
    },
  };
}
export function parseDraft(text) {
  const m = String(text).match(/\{[\s\S]*\}/); if (!m) throw new Error('The AI reply was not in the expected format');
  let o; try { o = JSON.parse(m[0]); } catch { throw new Error('The AI reply was not in the expected format'); }
  const s = (v, n) => String(v ?? '').trim().slice(0, n); const a = Number(o.answer);
  return { aiAnswer: Number.isInteger(a) && a >= 0 && a < 4 ? a : null, explanation: s(o.explanation, 3000), steps: Array.isArray(o.steps) ? o.steps.map((x) => s(x, 400)).filter(Boolean).slice(0, 8) : [], shortcut: s(o.shortcut, 800), trap: s(o.trap, 800), wrongReasons: Array.isArray(o.wrongReasons) ? o.wrongReasons.slice(0, 4).map((x) => (x ? s(x, 400) : null)) : [] };
}
