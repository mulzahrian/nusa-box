import './PhoneUI.css';
import socialPosts from '../../config/socialPosts.json';
import PixelButton from '../elements/PixelButton';
import { useCharacterStore } from '../../store/characterStore';
import { useGameStore } from '../../store/gameStore';
import { usePersonalStore } from '../../store/personalStore';
import { useUIStore } from '../../store/uiStore';

const tabs = [
  ['contacts', '📱 Contacts'],
  ['email', '📧 Email'],
  ['social', '📲 Social Media'],
  ['calendar', '📅 Calendar'],
];

const emails = [
  {
    id: 'mail-1',
    sender: 'Kementerian Dalam Negeri',
    subject: 'Program Rumah Baru',
    preview: 'Bangun 5 rumah kayu sebelum Jumat untuk bonus dana Rp150.000.',
  },
  {
    id: 'mail-2',
    sender: 'Komunitas Nelayan',
    subject: 'Akses Pelabuhan',
    preview: 'Warga pantai meminta akses pelabuhan kecil agar hasil tangkap meningkat.',
  },
];

const calendarEvents = [
  {
    id: 'event-1',
    date: 'Rabu, 9 Agustus',
    title: 'Pasar Malam Kampung',
    note: 'Naikkan happiness dengan dekorasi.',
  },
  {
    id: 'event-2',
    date: 'Jumat, 11 Agustus',
    title: 'Inspeksi Presiden',
    note: 'Jaga pollution di bawah 20.',
  },
];

export default function PhoneUI() {
  const showPhone = useUIStore((state) => state.showPhone);
  const phoneTab = useUIStore((state) => state.phoneTab);
  const togglePhone = useUIStore((state) => state.togglePhone);
  const setPhoneTab = useUIStore((state) => state.setPhoneTab);
  const currentMap = useGameStore((state) => state.currentMap);
  const currentLevel = useGameStore((state) => state.currentLevel);
  const getCharactersByMap = useCharacterStore((state) => state.getCharactersByMap);
  const { personalHealth, personalMoney, corruption } = usePersonalStore();
  const completedLevels = Object.values(currentLevel).reduce(
    (total, level) => total + Math.max(0, level - 1),
    0,
  );
  const contacts = getCharactersByMap(currentMap);

  const content = {
    contacts: contacts.map((contact) => (
      <li key={contact.id} className="phone-card">
        <div>
          <strong>{contact.name}</strong>
          <span>{contact.location}</span>
        </div>
        <div className="phone-card__bar">
          <span style={{ width: `${contact.relationship}%` }} />
        </div>
      </li>
    )),
    email: emails.map((mail) => (
      <li key={mail.id} className="phone-card">
        <strong>{mail.subject}</strong>
        <span>{mail.sender}</span>
        <p>{mail.preview}</p>
      </li>
    )),
    social: socialPosts.map((post) => (
      <li key={post.id} className="phone-card" data-mood={post.mood}>
        <strong>{post.author}</strong>
        <p>{post.text}</p>
      </li>
    )),
    calendar: calendarEvents.map((event) => (
      <li key={event.id} className="phone-card">
        <strong>{event.date}</strong>
        <span>{event.title}</span>
        <p>{event.note}</p>
      </li>
    )),
  };

  return (
    <div className={`phone-ui ${showPhone ? 'is-open' : ''}`}>
      {showPhone ? (
        <section className="pixel-panel phone-ui__panel">
          <div className="phone-ui__header">
            <strong>Wali Kota Phone</strong>
            <span>Signal: 4G Nusantara</span>
          </div>

          <div className="phone-ui__stats pixel-card">
            <span>❤️ Health: {personalHealth}%</span>
            <span>💰 Money: Rp{personalMoney.toLocaleString('id-ID')}</span>
            <span>🕵️ Corruption: {corruption}%</span>
            <span>🏁 Completed Levels: {completedLevels}</span>
          </div>

          <div className="phone-ui__tabs">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`phone-ui__tab ${phoneTab === key ? 'is-active' : ''}`}
                onClick={() => setPhoneTab(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <ul className="phone-ui__content">{content[phoneTab]}</ul>
        </section>
      ) : null}

      <PixelButton className="phone-ui__trigger" icon="📱" variant="secondary" onClick={togglePhone}>
        {showPhone ? 'Close Phone' : 'Open Phone'}
      </PixelButton>
    </div>
  );
}
