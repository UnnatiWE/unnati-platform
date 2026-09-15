import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './FirebaseResources.css';

export default function FirebaseSkills() {
  const [skills, setSkills] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSkills() {
      try {
        const snap = await getDocs(collection(db, 'skills'));
        setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Skills Firebase error:', err);
        setError(`${err.code || 'error'}: ${err.message || 'Unable to load skills.'}`);
      } finally {
        setLoading(false);
      }
    }
    loadSkills();
  }, []);

  const categories = useMemo(() => [
    'All',
    ...Array.from(new Set(skills.map(s => s.category).filter(Boolean))).sort()
  ], [skills]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return skills.filter(s => {
      const matchesSearch = !q || [s.skill_name, s.category, s.description]
        .some(v => String(v || '').toLowerCase().includes(q));
      const matchesCategory = category === 'All' || s.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [skills, search, category]);

  return (
    <section className="firebase-page">
      <div className="firebase-hero">
        <span>UNNATI • LEARN</span>
        <h1>Skill Development</h1>
        <p>Explore practical skills, creative skills, beauty, food, agriculture, business and employability resources.</p>
      </div>

      <div className="firebase-filters">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search skills..." />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setCategory('All'); }}>Clear</button>
      </div>

      <p className="firebase-count">Showing <b>{filtered.length}</b> skills</p>

      {loading && <div className="firebase-state">Loading skills...</div>}
      {error && !loading && <div className="firebase-error">Unable to load skills.<br />{error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="firebase-state">No skills found. Try another search.</div>}

      {!loading && !error && filtered.length > 0 && (
        <div className="firebase-grid">
          {filtered.map(skill => (
            <article className="firebase-card" key={skill.id}>
              <span className="firebase-badge">{skill.category}</span>
              <h2>{skill.skill_name}</h2>
              <p>{skill.description}</p>
              <a className="firebase-btn" href={skill.learning_link} target="_blank" rel="noopener noreferrer">
                Start Learning ↗
              </a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
