/**
 * PhoneUI - in-game phone with tabs (contacts, email, social, calendar, stats)
 */
import React, { useState } from 'react';
import useUIStore from '@stores/useUIStore';
import useRelationshipStore from '@stores/useRelationshipStore';
import useGameStore from '@stores/useGameStore';
import usePersonalStore from '@stores/usePersonalStore';
import useCalendarStore from '@stores/useCalendarStore';

const TABS = ['📞 Kontak', '📧 Email', '📱 Sosmed', '📅 Kalender', '📊 Stats'];

export default function PhoneUI() {
  const [activeTab, setActiveTab] = useState(0);
  const togglePhone = useUIStore(s => s.togglePhone);
  const mapId = useGameStore(s => s.mapId);
  
  return (
    <div className="modal-overlay" onClick={togglePhone}>
      <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <h2>📱 Phone</h2>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
          {TABS.map((tab, i) => (
            <button
              key={i}
              className={activeTab === i ? 'active' : ''}
              style={{ fontSize: 7, padding: '4px 8px' }}
              onClick={() => setActiveTab(i)}
            >
              {tab}
            </button>
          ))}
        </div>
        
        {activeTab === 0 && <ContactsTab mapId={mapId} />}
        {activeTab === 1 && <EmailTab />}
        {activeTab === 2 && <SocialTab />}
        {activeTab === 3 && <CalendarTab />}
        {activeTab === 4 && <StatsTab />}
        
        <div className="close-row">
          <button onClick={togglePhone}>✕ Tutup</button>
        </div>
      </div>
    </div>
  );
}

function ContactsTab({ mapId }) {
  const chars = useRelationshipStore(s => s.getCharactersForMap(mapId));
  return (
    <div className="grid">
      {Object.entries(chars).map(([id, char]) => (
        <div key={id} className="card">
          <div className="label">{char.role}</div>
          <div className="big" style={{ fontSize: 11 }}>{char.name}</div>
          <div className="delta">❤️ {char.relation}/100</div>
          <div className="bar"><div style={{ width: `${char.relation}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

function EmailTab() {
  const emails = useRelationshipStore(s => s.emails);
  if (emails.length === 0) return <p style={{ color: '#5544aa', fontSize: 7 }}>Tidak ada email.</p>;
  return (
    <div>
      {emails.slice(0, 10).map(e => (
        <div key={e.id} className="card" style={{ marginBottom: 6 }}>
          <div className="label">From: {e.from}</div>
          <div style={{ fontSize: 8, color: '#ccc' }}>{e.subject}</div>
          <div className="delta">{e.body}</div>
        </div>
      ))}
    </div>
  );
}

function SocialTab() {
  const posts = useRelationshipStore(s => s.socialMedia);
  if (posts.length === 0) return <p style={{ color: '#5544aa', fontSize: 7 }}>Belum ada postingan.</p>;
  return (
    <div>
      {posts.slice(0, 10).map(p => (
        <div key={p.id} className="card" style={{ marginBottom: 6 }}>
          <div className="label">@{p.author}</div>
          <div style={{ fontSize: 7, color: '#ccc' }}>{p.content}</div>
        </div>
      ))}
    </div>
  );
}

function CalendarTab() {
  const events = useCalendarStore(s => s.calendarEvents);
  const day = useGameStore(s => s.day);
  const month = useGameStore(s => s.month);
  
  return (
    <div>
      <p style={{ fontSize: 8, color: '#00ffff' }}>Hari {day}/{month}</p>
      {events.length === 0
        ? <p style={{ color: '#5544aa', fontSize: 7 }}>Tidak ada event.</p>
        : events.map(e => (
          <div key={e.id} className="card" style={{ marginBottom: 4 }}>
            <div className="label">{e.day}/{e.month} - {e.title}</div>
          </div>
        ))
      }
    </div>
  );
}

function StatsTab() {
  const personal = usePersonalStore();
  const level = useGameStore(s => s.level);
  const mapId = useGameStore(s => s.mapId);
  
  return (
    <div className="grid">
      <div className="card">
        <div className="label">Map</div>
        <div className="big" style={{ fontSize: 12 }}>{mapId}</div>
      </div>
      <div className="card">
        <div className="label">Level</div>
        <div className="big">{level}</div>
      </div>
      <div className="card">
        <div className="label">Kesehatan</div>
        <div className="big" style={{ fontSize: 12 }}>{personal.health}%</div>
      </div>
      <div className="card">
        <div className="label">Korupsi</div>
        <div className="big" style={{ fontSize: 12, color: personal.corruption > 50 ? '#ff2244' : '#00ff66' }}>
          {personal.corruption}%
        </div>
      </div>
      <div className="card">
        <div className="label">Uang Pribadi</div>
        <div className="big" style={{ fontSize: 12 }}>${personal.personalMoney.toLocaleString()}</div>
      </div>
    </div>
  );
}
