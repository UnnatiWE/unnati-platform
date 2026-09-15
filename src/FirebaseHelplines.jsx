import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './FirebaseResources.css';

export default function FirebaseHelplines() {
  const [helplines, setHelplines] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadHelplines() {
      try {
        const snap = await getDocs(collection(db, 'helplines'));
        setHelplines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Helpline Firebase error:', err);
        setError(`${err.code || 'error'}: ${err.message || 'Unable to load helplines.'}`);
      } finally {
        setLoading(false);
      }
    }
    loadHelplines();
  }, []);

  const categories = useMemo(() => [
    'All', ...Array.from(new Set(helplines.map(h => h.category).filter(Boolean))).sort()
  ], [helplines]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return helplines.filter(h => {
      const haystack = [h.category, h.helpline_name, h.helpline_number, h.purpose]
        .map(v => String(v || '').toLowerCase()).join(' ');
      return (!q || haystack.includes(q)) && (category === 'All' || h.category === category);
    });
  }, [helplines, search, category]);

  return (
    <section className="firebase-page">
      <div className="firebase-hero">
        <span>UNNATI • SUPPORT</span>
        <h1>Help & Helplines</h1>
        <p>Quick access to women-focused, emergency and citizen support numbers stored in Firebase.</p>
      </div>

      <div className="firebase-filters">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search help resources..." />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setCategory('All'); }}>Clear</button>
      </div>

      <p className="firebase-count">Showing <b>{filtered.length}</b> helplines</p>

      {loading && <div className="firebase-state">Loading helplines...</div>}
      {error && !loading && <div className="firebase-error">Unable to load helplines.<br />{error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="firebase-state">No helplines found.</div>}

      {!loading && !error && filtered.length > 0 && (
        <div className="firebase-grid">
          {filtered.map(h => (
            <article className="firebase-card" key={h.id}>
              <span className="firebase-badge">{h.category}</span>
              <h2>{h.helpline_name}</h2>
              <p>{h.purpose}</p>
              <div className="firebase-number">{h.helpline_number}</div>
              <a className="firebase-btn" href={`tel:${String(h.helpline_number).replace(/[^0-9+]/g, '')}`}>
                Call Now
              </a>
            </article>
          ))}
        </div>
      )}

      <p className="firebase-disclaimer">UNNATI provides information for awareness and guidance. In an emergency, contact the appropriate official service directly. Verify important helpline information before production use.</p>
    </section>
  );
}
