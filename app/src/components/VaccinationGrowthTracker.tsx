import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CalendarClock, CheckCircle2, Printer, Ruler, Syringe, Trash2 } from 'lucide-react';

interface VaccinationGrowthTrackerProps {
  babyBirthDate: string;
}

type VaccineRecord = {
  id: string;
  dueDate: string;
  givenOn: string;
  brand: string;
  batch: string;
  signature: string;
};

type GrowthRecord = {
  id: string;
  date: string;
  weightKg: string;
  heightCm: string;
  headCm: string;
};

type ChildProfile = {
  childName: string;
  sex: 'boy' | 'girl';
  fatherHeightCm: string;
  motherHeightCm: string;
};

type ScheduleItem = {
  id: string;
  age: string;
  offsetDays: number;
  vaccine: string;
  optional?: boolean;
};

const VACCINE_SCHEDULE: ScheduleItem[] = [
  { id: 'birth-bcg', age: 'Birth', offsetDays: 0, vaccine: 'BCG' },
  { id: 'birth-opv', age: 'Birth', offsetDays: 0, vaccine: 'OPV' },
  { id: 'birth-hepb1', age: 'Birth', offsetDays: 0, vaccine: 'Hep B-1 (birth dose)' },
  { id: '6w-dpt1', age: '6 weeks', offsetDays: 42, vaccine: 'DTaP/DTwP-1' },
  { id: '6w-ipv1', age: '6 weeks', offsetDays: 42, vaccine: 'IPV-1' },
  { id: '6w-hib1', age: '6 weeks', offsetDays: 42, vaccine: 'Hib-1' },
  { id: '6w-hepb2', age: '6 weeks', offsetDays: 42, vaccine: 'Hep B-2' },
  { id: '6w-rota1', age: '6 weeks', offsetDays: 42, vaccine: 'Rota-1' },
  { id: '6w-pcv1', age: '6 weeks', offsetDays: 42, vaccine: 'PCV-1' },
  { id: '10w-dpt2', age: '10 weeks', offsetDays: 70, vaccine: 'DTaP/DTwP-2' },
  { id: '10w-ipv2', age: '10 weeks', offsetDays: 70, vaccine: 'IPV-2' },
  { id: '10w-hib2', age: '10 weeks', offsetDays: 70, vaccine: 'Hib-2' },
  { id: '10w-hepb3', age: '10 weeks', offsetDays: 70, vaccine: 'Hep B-3' },
  { id: '10w-rota2', age: '10 weeks', offsetDays: 70, vaccine: 'Rota-2' },
  { id: '10w-pcv2', age: '10 weeks', offsetDays: 70, vaccine: 'PCV-2' },
  { id: '14w-dpt3', age: '14 weeks', offsetDays: 98, vaccine: 'DTaP/DTwP-3' },
  { id: '14w-ipv3', age: '14 weeks', offsetDays: 98, vaccine: 'IPV-3' },
  { id: '14w-hib3', age: '14 weeks', offsetDays: 98, vaccine: 'Hib-3' },
  { id: '14w-hepb4', age: '14 weeks', offsetDays: 98, vaccine: 'Hep B-4' },
  { id: '14w-rota3', age: '14 weeks', offsetDays: 98, vaccine: 'Rota-3' },
  { id: '14w-pcv3', age: '14 weeks', offsetDays: 98, vaccine: 'PCV-3' },
  { id: '6m-flu1', age: '6 months', offsetDays: 183, vaccine: 'Influenza vaccine-1' },
  { id: '6m-typhoid', age: '6 months', offsetDays: 183, vaccine: 'Typhoid conjugate vaccine', optional: true },
  { id: '7m-flu2', age: '7 months', offsetDays: 213, vaccine: 'Influenza vaccine-2' },
  { id: '9m-mmr1', age: '9 months', offsetDays: 274, vaccine: 'MMR-1' },
  { id: '12m-hepa', age: '12 months', offsetDays: 365, vaccine: 'Hep A' },
  { id: '12m-mcv2', age: '12 months', offsetDays: 365, vaccine: 'MCV-2' },
  { id: '12m-je1', age: '12 months', offsetDays: 365, vaccine: 'JE-1', optional: true },
  { id: '12m-cholera1', age: '12 months', offsetDays: 365, vaccine: 'Cholera vaccine-1', optional: true },
  { id: '13m-je2', age: '13 months', offsetDays: 395, vaccine: 'JE-2', optional: true },
  { id: '13m-cholera2', age: '13 months', offsetDays: 395, vaccine: 'Cholera vaccine-2', optional: true },
  { id: '15m-mmr2', age: '15 months', offsetDays: 456, vaccine: 'MMR-2' },
  { id: '15m-varicella1', age: '15 months', offsetDays: 456, vaccine: 'Varicella-1' },
  { id: '15m-pcvb', age: '15 months', offsetDays: 456, vaccine: 'PCV booster' },
  { id: '16m-dptb1', age: '16-18 months', offsetDays: 487, vaccine: 'DTaP/DTwP-B1' },
  { id: '16m-hibb1', age: '16-18 months', offsetDays: 487, vaccine: 'Hib-B1' },
  { id: '16m-ipvb1', age: '16-18 months', offsetDays: 487, vaccine: 'IPV-B1' },
];

const addDays = (dateText: string, days: number) => {
  if (!dateText) return '';
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return '';
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const daysUntil = (dateText: string) => {
  if (!dateText) return null;
  const today = new Date();
  const target = new Date(dateText);
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
};

const numberOrNull = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

export const VaccinationGrowthTracker: React.FC<VaccinationGrowthTrackerProps> = ({ babyBirthDate }) => {
  const [vaccineRecords, setVaccineRecords] = useState<Record<string, VaccineRecord>>(() => {
    const saved = localStorage.getItem('hub_vaccine_records');
    return saved ? JSON.parse(saved) : {};
  });
  const [growthRecords, setGrowthRecords] = useState<GrowthRecord[]>(() => {
    const saved = localStorage.getItem('hub_growth_records');
    return saved ? JSON.parse(saved) : [];
  });
  const [profile, setProfile] = useState<ChildProfile>(() => {
    const saved = localStorage.getItem('hub_child_growth_profile');
    return saved ? JSON.parse(saved) : { childName: '', sex: 'boy', fatherHeightCm: '', motherHeightCm: '' };
  });
  const [growthDraft, setGrowthDraft] = useState({ date: new Date().toISOString().slice(0, 10), weightKg: '', heightCm: '', headCm: '' });

  useEffect(() => {
    localStorage.setItem('hub_vaccine_records', JSON.stringify(vaccineRecords));
  }, [vaccineRecords]);

  useEffect(() => {
    localStorage.setItem('hub_growth_records', JSON.stringify(growthRecords));
  }, [growthRecords]);

  useEffect(() => {
    localStorage.setItem('hub_child_growth_profile', JSON.stringify(profile));
  }, [profile]);

  const schedule = useMemo(() => {
    return VACCINE_SCHEDULE.map(item => {
      const dueDate = addDays(babyBirthDate, item.offsetDays);
      return { ...item, dueDate, statusDays: daysUntil(dueDate) };
    });
  }, [babyBirthDate]);

  const nextDue = useMemo(() => {
    return schedule
      .filter(item => !vaccineRecords[item.id]?.givenOn)
      .sort((a, b) => (a.statusDays ?? 99999) - (b.statusDays ?? 99999))[0];
  }, [schedule, vaccineRecords]);

  const completedCount = schedule.filter(item => vaccineRecords[item.id]?.givenOn).length;

  const targetHeight = useMemo(() => {
    const father = numberOrNull(profile.fatherHeightCm);
    const mother = numberOrNull(profile.motherHeightCm);
    if (!father || !mother) return null;
    const estimate = profile.sex === 'boy' ? (father + mother + 13) / 2 : (father + mother - 13) / 2;
    return {
      estimate: estimate.toFixed(1),
      low: (estimate - 8.5).toFixed(1),
      high: (estimate + 8.5).toFixed(1),
    };
  }, [profile]);

  const sortedGrowthRecords = useMemo(() => {
    return [...growthRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [growthRecords]);

  const chartPoints = useMemo(() => {
    if (sortedGrowthRecords.length === 0) return { weight: '', height: '' };
    const maxWeight = Math.max(...sortedGrowthRecords.map(row => Number(row.weightKg) || 0), 10);
    const maxHeight = Math.max(...sortedGrowthRecords.map(row => Number(row.heightCm) || 0), 80);
    const toPoints = (key: 'weightKg' | 'heightCm', max: number) => sortedGrowthRecords
      .map((row, index) => {
        const x = sortedGrowthRecords.length === 1 ? 20 : 20 + (index * 260) / (sortedGrowthRecords.length - 1);
        const y = 150 - ((Number(row[key]) || 0) / max) * 120;
        return `${x},${Math.max(20, Math.min(150, y))}`;
      })
      .join(' ');
    return { weight: toPoints('weightKg', maxWeight), height: toPoints('heightCm', maxHeight) };
  }, [sortedGrowthRecords]);

  const updateRecord = (id: string, patch: Partial<VaccineRecord>) => {
    setVaccineRecords(prev => {
      const existing = prev[id];
      const nextRecord: VaccineRecord = {
        id,
        dueDate: patch.dueDate ?? existing?.dueDate ?? '',
        givenOn: patch.givenOn ?? existing?.givenOn ?? '',
        brand: patch.brand ?? existing?.brand ?? '',
        batch: patch.batch ?? existing?.batch ?? '',
        signature: patch.signature ?? existing?.signature ?? '',
      };
      return {
        ...prev,
        [id]: nextRecord,
      };
    });
  };

  const addGrowthRecord = () => {
    if (!growthDraft.date || (!growthDraft.weightKg && !growthDraft.heightCm && !growthDraft.headCm)) return;
    setGrowthRecords(prev => [{ id: String(Date.now()), ...growthDraft }, ...prev]);
    setGrowthDraft({ date: new Date().toISOString().slice(0, 10), weightKg: '', heightCm: '', headCm: '' });
  };

  return (
    <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="card-title">
          <Bell size={18} style={{ color: 'var(--primary)' }} />
          <span>Vaccination Reminder</span>
        </div>
        {nextDue ? (
          <div className={nextDue.statusDays !== null && nextDue.statusDays < 0 ? 'alert-caution' : 'alert-note'} style={{ padding: '12px', borderRadius: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: 700 }}>
              Next due: {nextDue.vaccine} at {nextDue.age}
            </div>
            <div style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-muted)' }}>
              Due date: {nextDue.dueDate || 'Add baby date of birth in onboarding'}
              {nextDue.statusDays !== null && nextDue.statusDays >= 0 ? ` (${nextDue.statusDays} day${nextDue.statusDays === 1 ? '' : 's'} left)` : ''}
              {nextDue.statusDays !== null && nextDue.statusDays < 0 ? ` (${Math.abs(nextDue.statusDays)} day${Math.abs(nextDue.statusDays) === 1 ? '' : 's'} overdue)` : ''}
            </div>
          </div>
        ) : (
          <div className="alert-note" style={{ padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
            All visible chart vaccines are marked as given.
          </div>
        )}
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Progress: {completedCount}/{schedule.length} entries marked given. This follows the ACVIP-style chart you shared; optional/regional vaccines should be confirmed with the pediatrician.
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="card-title" style={{ marginBottom: '10px' }}>
          <Syringe size={18} style={{ color: 'var(--primary)' }} />
          <span>Vaccination Checklist</span>
        </div>
        <table className="tracker-table">
          <thead>
            <tr>
              <th>Done</th>
              <th>Age</th>
              <th>Vaccine</th>
              <th>Due date</th>
              <th>Given on</th>
              <th>Brand</th>
              <th>Batch / expiry</th>
              <th>Signature</th>
            </tr>
          </thead>
          <tbody>
            {schedule.map(item => {
              const record = vaccineRecords[item.id];
              const isDone = Boolean(record?.givenOn);
              return (
                <tr key={item.id} className={isDone ? 'tracker-row-done' : ''}>
                  <td>
                    <button
                      className="icon-btn"
                      title={isDone ? 'Marked given' : 'Mark given today'}
                      onClick={() => updateRecord(item.id, { givenOn: isDone ? '' : new Date().toISOString().slice(0, 10), dueDate: item.dueDate })}
                    >
                      <CheckCircle2 size={18} />
                    </button>
                  </td>
                  <td>{item.age}</td>
                  <td>{item.vaccine}{item.optional ? ' *' : ''}</td>
                  <td>{item.dueDate || '-'}</td>
                  <td><input type="date" className="table-input" value={record?.givenOn || ''} onChange={e => updateRecord(item.id, { givenOn: e.target.value, dueDate: item.dueDate })} /></td>
                  <td><input className="table-input" value={record?.brand || ''} onChange={e => updateRecord(item.id, { brand: e.target.value, dueDate: item.dueDate })} /></td>
                  <td><input className="table-input" value={record?.batch || ''} onChange={e => updateRecord(item.id, { batch: e.target.value, dueDate: item.dueDate })} /></td>
                  <td><input className="table-input" value={record?.signature || ''} onChange={e => updateRecord(item.id, { signature: e.target.value, dueDate: item.dueDate })} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
          * JE and cholera are regional/risk-based in many practices. Use the table as a charting aid, not a replacement for the clinic prescription.
        </div>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="card-title">
          <Ruler size={18} style={{ color: 'var(--primary)' }} />
          <span>Baby Weight & Height Entry</span>
        </div>
        <div className="tracker-form-grid">
          <input className="input-text" placeholder="Child name" value={profile.childName} onChange={e => setProfile({ ...profile, childName: e.target.value })} />
          <select className="input-text" value={profile.sex} onChange={e => setProfile({ ...profile, sex: e.target.value as ChildProfile['sex'] })}>
            <option value="boy">Boy</option>
            <option value="girl">Girl</option>
          </select>
          <input className="input-text" type="number" placeholder="Father height cm" value={profile.fatherHeightCm} onChange={e => setProfile({ ...profile, fatherHeightCm: e.target.value })} />
          <input className="input-text" type="number" placeholder="Mother height cm" value={profile.motherHeightCm} onChange={e => setProfile({ ...profile, motherHeightCm: e.target.value })} />
        </div>
        {targetHeight && (
          <div className="alert-note" style={{ padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
            Mid-parental target height: {targetHeight.estimate} cm. Usual target range: {targetHeight.low}-{targetHeight.high} cm.
          </div>
        )}
        <div className="tracker-form-grid">
          <input className="input-text" type="date" value={growthDraft.date} onChange={e => setGrowthDraft({ ...growthDraft, date: e.target.value })} />
          <input className="input-text" type="number" step="0.01" placeholder="Weight kg" value={growthDraft.weightKg} onChange={e => setGrowthDraft({ ...growthDraft, weightKg: e.target.value })} />
          <input className="input-text" type="number" step="0.1" placeholder="Length/height cm" value={growthDraft.heightCm} onChange={e => setGrowthDraft({ ...growthDraft, heightCm: e.target.value })} />
          <input className="input-text" type="number" step="0.1" placeholder="Head cm" value={growthDraft.headCm} onChange={e => setGrowthDraft({ ...growthDraft, headCm: e.target.value })} />
        </div>
        <button className="btn-primary" style={{ padding: '10px', borderRadius: '8px' }} onClick={addGrowthRecord}>
          Add Growth Entry
        </button>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: '10px' }}>
          <CalendarClock size={18} style={{ color: 'var(--primary)' }} />
          <span>Growth Chart</span>
        </div>
        <svg viewBox="0 0 320 180" className="growth-chart" role="img" aria-label="Baby growth chart">
          <line x1="20" y1="155" x2="290" y2="155" />
          <line x1="20" y1="20" x2="20" y2="155" />
          <polyline points={chartPoints.weight} className="growth-line-weight" />
          <polyline points={chartPoints.height} className="growth-line-height" />
          {sortedGrowthRecords.map((row, index) => {
            const x = sortedGrowthRecords.length === 1 ? 20 : 20 + (index * 260) / (sortedGrowthRecords.length - 1);
            return <text key={row.id} x={x} y="172" textAnchor="middle">{new Date(row.date).toLocaleDateString([], { month: 'short' })}</text>;
          })}
        </svg>
        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
          <span><span className="legend-dot weight-dot" /> Weight</span>
          <span><span className="legend-dot height-dot" /> Height</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {growthRecords.map(row => (
          <div key={row.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--card-bg)' }}>
            <div style={{ fontSize: '12px' }}>
              <strong>{row.date}</strong> | Weight {row.weightKg || '-'} kg | Height {row.heightCm || '-'} cm | Head {row.headCm || '-'} cm
            </div>
            <button style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setGrowthRecords(growthRecords.filter(item => item.id !== row.id))}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }} onClick={() => window.print()}>
        <Printer size={16} /> Print vaccine and growth record
      </button>
    </div>
  );
};
