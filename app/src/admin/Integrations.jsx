import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Badge, Err, Loading, PageHead, toast, useLoad } from './ui.jsx';

export default function Integrations() {
  const { user } = useAuth(); const { data, err, loading } = useLoad('/admin/integrations'); const [to, setTo] = useState(user?.email || ''); const [busy, setBusy] = useState(false);
  if (loading && !data) return <Loading />; if (err) return <Err>{err}</Err>;
  const test = async () => { setBusy(true); try { const r = await api.post('/admin/integrations/test-email', { to }); toast(`Test email sent to ${r.to}`); } catch (e) { toast(e.message, 'bad'); } finally { setBusy(false); } };
  return (
    <>
      <PageHead title="Integrations" sub="What is connected to your server. Keys and passwords are never shown here." />
      <div className="ad-grid g2">
        {data.items.map((i) => (
          <section className="card" key={i.key}>
            <h3>{i.name} {i.on ? <Badge tone="good">Connected</Badge> : <Badge tone="mute">Not set up</Badge>}</h3>
            <p className="small">{i.detail}</p><p className="small muted">Used for: {i.used}</p>
            {i.key === 'email' && i.on && <div className="ad-toolbar"><input className="grow" type="email" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Send test to" placeholder="you@example.com" /><button className="btn btn-primary" disabled={busy} onClick={test}>Send test email</button></div>}
            {i.key === 'whatsapp' && <p className="small"><Link to="/admin/settings">Open settings</Link></p>}
          </section>))}
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>Connections are set once when the server is set up. See the setup guide for each service.</p>
    </>
  );
}
