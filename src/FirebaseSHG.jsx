import React, { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import './FirebaseResources.css';

export default function FirebaseSHG() {
  const [shgs, setShgs] = useState([]);
  const [search, setSearch] = useState('');
  const [district, setDistrict] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSHGs() {
      try {
        const snap = await getDocs(collection(db, 'shgs'));
        setShgs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('SHG Firebase error:', err);
        setError(`${err.code || 'error'}: ${err.message || 'Unable to load SHGs.'}`);
      } finally {
        setLoading(false);
      }
    }
    loadSHGs();
  }, []);

  const districts = useMemo(() => [
    'All', ...Array.from(new Set(shgs.map(s => s.district).filter(Boolean))).sort()
  ], [shgs]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return shgs.filter(s => {
      const haystack = [s.id, s.taluka, s.district, s.division, s.institutional_hub, s.institution_type, s.address, s.key_services, s.products_produced]
        .map(v => String(v || '').toLowerCase()).join(' ');
      return (!q || haystack.includes(q)) && (district === 'All' || s.district === district);
    });
  }, [shgs, search, district]);

  return (
    <section className="firebase-page">
      <div className="firebase-hero">
        <span>UNNATI • CONNECT</span>
        <h1>SHG Finder</h1>
        <p>Find Self Help Group and women’s livelihood resources by district, taluka and activity.</p>
      </div>

      <div className="firebase-filters">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search SHG, taluka, activity..." />
        <select value={district} onChange={e => setDistrict(e.target.value)}>
          {districts.map(d => <option key={d}>{d}</option>)}
        </select>
        <button onClick={() => { setSearch(''); setDistrict('All'); }}>Clear</button>
      </div>

      <p className="firebase-count">Showing <b>{filtered.length}</b> SHG records</p>

      {loading && <div className="firebase-state">Loading SHGs...</div>}
      {error && !loading && <div className="firebase-error">Unable to load SHGs.<br />{error}</div>}
      {!loading && !error && filtered.length === 0 && <div className="firebase-state">No SHGs found. Try another search or district.</div>}

      {!loading && !error && filtered.length > 0 && (
        <div className="firebase-grid">
          {filtered.map(shg => (
            <article className="firebase-card" key={shg.id}>
              <span className="firebase-badge">{shg.district || 'Maharashtra'}</span>
              <h2>{shg.institutional_hub || shg.id}</h2>
              <p><b>Location:</b> {shg.taluka || '—'}, {shg.district || '—'}</p>
              <p><b>Type:</b> {shg.institution_type || '—'}</p>
              <p><b>Services:</b> {shg.key_services || '—'}</p>
              <p><b>Products:</b> {shg.products_produced || '—'}</p>
              <p><b>Contact:</b> {shg.contact_person || 'Local mission/federation contact'} {shg.phone ? `• ${shg.phone}` : ''}</p>
              <p className="firebase-note">Please verify SHG contact information with the relevant local authority before contacting an SHG.</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
