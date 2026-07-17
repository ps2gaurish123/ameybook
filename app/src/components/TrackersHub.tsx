import React, { useState, useEffect } from 'react';
import { FileText, Trash2, Printer, ArrowLeft, Activity } from 'lucide-react';
import { VaccinationGrowthTracker } from './VaccinationGrowthTracker';

interface TrackersHubProps {
  onBackToHome: () => void;
  // Deep-linking helper states (optionally pre-selected tool)
  initialToolId?: string;
  babyBirthDate?: string;
}

// 1. Types for In-App logs
interface FeedDiaperLog {
  id: string;
  timestamp: string;
  type: 'breast' | 'bottle' | 'diaper';
  details: string;
}

interface FeverLog {
  id: string;
  timestamp: string;
  temp: string;
  dose: string;
  symptoms: string;
}

interface AllergenLog {
  id: string;
  date: string;
  food: string;
  reaction: 'None' | 'Mild' | 'Severe';
  notes: string;
}

interface KmcLog {
  id: string;
  date: string;
  hours: string;
}

export const TrackersHub: React.FC<TrackersHubProps> = ({ 
  onBackToHome, 
  initialToolId = 'menu',
  babyBirthDate = ''
}) => {
  const [activeTool, setActiveTool] = useState<string>(initialToolId);
  
  // 2. States for Log entries (synchronized with LocalStorage)
  const [feedLogs, setFeedLogs] = useState<FeedDiaperLog[]>(() => {
    const saved = localStorage.getItem('hub_feed_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [feverLogs, setFeverLogs] = useState<FeverLog[]>(() => {
    const saved = localStorage.getItem('hub_fever_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [allergenLogs, setAllergenLogs] = useState<AllergenLog[]>(() => {
    const saved = localStorage.getItem('hub_allergen_logs');
    return saved ? JSON.parse(saved) : [];
  });
  const [kmcLogs, setKmcLogs] = useState<KmcLog[]>(() => {
    const saved = localStorage.getItem('hub_kmc_logs');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. Save logs to LocalStorage
  useEffect(() => {
    localStorage.setItem('hub_feed_logs', JSON.stringify(feedLogs));
  }, [feedLogs]);
  useEffect(() => {
    localStorage.setItem('hub_fever_logs', JSON.stringify(feverLogs));
  }, [feverLogs]);
  useEffect(() => {
    localStorage.setItem('hub_allergen_logs', JSON.stringify(allergenLogs));
  }, [allergenLogs]);
  useEffect(() => {
    localStorage.setItem('hub_kmc_logs', JSON.stringify(kmcLogs));
  }, [kmcLogs]);

  // Feed Log Input States
  const [feedType, setFeedType] = useState<'breast' | 'bottle' | 'diaper'>('breast');
  const [breastDetails, setBreastDetails] = useState({ leftMin: '', rightMin: '' });
  const [bottleMl, setBottleMl] = useState('');
  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'both'>('wet');

  // Fever Log Input States
  const [tempVal, setTempVal] = useState('');
  const [doseVal, setDoseVal] = useState('');
  const [symptomText, setSymptomText] = useState('');

  // Allergen Log Input States
  const [foodName, setFoodName] = useState('');
  const [allergyReaction, setAllergyReaction] = useState<'None' | 'Mild' | 'Severe'>('None');
  const [allergyNotes, setAllergyNotes] = useState('');

  // KMC Log Input States
  const [kmcDate, setKmcDate] = useState('');
  const [kmcHours, setKmcHours] = useState('');

  // Fillable Printable States (Emergency Card)
  const [fillPediatrician, setFillPediatrician] = useState('');
  const [fillPedPhone, setFillPedPhone] = useState('');
  const [fillHosp, setFillHosp] = useState('');
  const [fillHospPhone, setFillHospPhone] = useState('');
  const [fillBabyName, setFillBabyName] = useState('');
  const [fillBloodType, setFillBloodType] = useState('');

  // Handle Print Action
  const handlePrint = () => {
    window.print();
  };

  // Add Log Handlers
  const handleAddFeedLog = () => {
    let details = '';
    if (feedType === 'breast') {
      details = `Breast: Left ${breastDetails.leftMin || 0}m, Right ${breastDetails.rightMin || 0}m`;
    } else if (feedType === 'bottle') {
      details = `Bottle Feed: ${bottleMl || 0} ml`;
    } else {
      details = `Diaper Change: ${diaperType.toUpperCase()}`;
    }

    const newLog: FeedDiaperLog = {
      id: String(Date.now()),
      timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      type: feedType,
      details
    };

    setFeedLogs([newLog, ...feedLogs]);
    setBreastDetails({ leftMin: '', rightMin: '' });
    setBottleMl('');
  };

  const handleAddFeverLog = () => {
    if (!tempVal) return;
    const newLog: FeverLog = {
      id: String(Date.now()),
      timestamp: new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      temp: tempVal,
      dose: doseVal || 'None',
      symptoms: symptomText || 'None recorded'
    };
    setFeverLogs([newLog, ...feverLogs]);
    setTempVal('');
    setDoseVal('');
    setSymptomText('');
  };

  const handleAddAllergenLog = () => {
    if (!foodName) return;
    const newLog: AllergenLog = {
      id: String(Date.now()),
      date: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      food: foodName,
      reaction: allergyReaction,
      notes: allergyNotes || 'None'
    };
    setAllergenLogs([newLog, ...allergenLogs]);
    setFoodName('');
    setAllergyReaction('None');
    setAllergyNotes('');
  };

  const handleAddKmcLog = () => {
    if (!kmcDate || !kmcHours) return;
    const newLog: KmcLog = {
      id: String(Date.now()),
      date: kmcDate,
      hours: kmcHours
    };
    setKmcLogs([newLog, ...kmcLogs]);
    setKmcDate('');
    setKmcHours('');
  };

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Header Controls */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        <button 
          className="btn-secondary" 
          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', borderRadius: '8px' }}
          onClick={activeTool === 'menu' ? onBackToHome : () => setActiveTool('menu')}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-heading)' }}>
          {activeTool === 'menu' ? 'Printables & Trackers Hub' : 'Printable Template & Log'}
        </span>
      </div>

      {/* MENU HUB */}
      {activeTool === 'menu' && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="card alert-note" style={{ display: 'flex', gap: '12px' }}>
            <FileText size={22} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div style={{ fontSize: '13px', lineHeight: 1.4 }}>
              <strong>Log in-app or Print physical copies:</strong> Here are interactive tracking tools and beautifully formatted checklists mentioned in *Your Baby's First 1000 Days*. Tap a card to use the tool or print a physical sheet for your nursery.
            </div>

          </div>

          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📊 In-App Logging Tools
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div className="card btn-secondary" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px' }} onClick={() => setActiveTool('feed_tracker')}>
              <div style={{ fontSize: '24px' }}>🍼</div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)' }}>Daily Diaper & Feeding Log</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Track nursing duration, bottle ml, and wet/dirty diaper frequencies.</p>
              </div>
            </div>

            <div className="card btn-secondary" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px' }} onClick={() => setActiveTool('fever_tracker')}>
              <div style={{ fontSize: '24px' }}>🌡️</div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)' }}>Fever & Paracetamol Dose Log</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Track temperature and paracetamol logs with weight dosage charts.</p>
              </div>
            </div>

            <div className="card btn-secondary" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px' }} onClick={() => setActiveTool('allergen_tracker')}>
              <div style={{ fontSize: '24px' }}>🍎</div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)' }}>First Foods & Allergen Log</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Solid food intro tracker with 3-day reaction diaries.</p>
              </div>
            </div>

            <div className="card btn-secondary" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px' }} onClick={() => setActiveTool('kmc_tracker')}>
              <div style={{ fontSize: '24px' }}>🤱</div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)' }}>Preterm KMC Tracker</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Log Kangaroo Mother Care skin-to-skin hours for preterm babies.</p>
              </div>
            </div>
          </div>

          <div className="card btn-secondary" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px' }} onClick={() => setActiveTool('vaccine_growth_tracker')}>
            <Activity size={24} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)' }}>Vaccination, Reminder & Growth Chart</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>ACVIP-style vaccine checklist with due dates, given entries, and baby weight/height chart.</p>
            </div>
          </div>

          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '10px' }}>
            🖨️ Printable PDF Templates
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
            <div className="card btn-secondary" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px' }} onClick={() => setActiveTool('print_emergency')}>
              <div style={{ fontSize: '24px' }}>🧲</div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)' }}>Emergency Fridge Magnet Card</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Fillable card with pediatrician, emergency, and hospital contact lines.</p>
              </div>
            </div>

            <div className="card btn-secondary" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px' }} onClick={() => setActiveTool('print_sleep')}>
              <div style={{ fontSize: '24px' }}>🛏️</div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)' }}>Grandparent\'s Safe-Sleep Poster</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Printable warning sign for crib safety parameters to share with caretakers.</p>
              </div>
            </div>

            <div className="card btn-secondary" style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: '12px' }} onClick={() => setActiveTool('print_poop')}>
              <div style={{ fontSize: '24px' }}>🎨</div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)' }}>Infant Stool Color Health Index</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Color-coded chart comparing healthy stool shades with medical warning alerts.</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* VACCINATION + GROWTH TRACKER */}
      {activeTool === 'vaccine_growth_tracker' && (
        <VaccinationGrowthTracker babyBirthDate={babyBirthDate} />
      )}

      {/* FEEDING & DIAPER LOG */}
      {activeTool === 'feed_tracker' && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Add Feeding or Diaper Entry</h3>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button className={`font-size-btn ${feedType === 'breast' ? 'active' : ''}`} onClick={() => setFeedType('breast')}>Breastfeed</button>
              <button className={`font-size-btn ${feedType === 'bottle' ? 'active' : ''}`} onClick={() => setFeedType('bottle')}>Bottle (ml)</button>
              <button className={`font-size-btn ${feedType === 'diaper' ? 'active' : ''}`} onClick={() => setFeedType('diaper')}>Diaper Change</button>
            </div>

            {feedType === 'breast' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>LEFT BREAST (MINUTES)</label>
                    <input type="number" className="input-text" placeholder="Min" value={breastDetails.leftMin} onChange={e => setBreastDetails({ ...breastDetails, leftMin: e.target.value })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RIGHT BREAST (MINUTES)</label>
                    <input type="number" className="input-text" placeholder="Min" value={breastDetails.rightMin} onChange={e => setBreastDetails({ ...breastDetails, rightMin: e.target.value })} />
                  </div>
                </div>
              </div>
            )}

            {feedType === 'bottle' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FORMULA OR EXPRESSED MILK (ML)</label>
                <input type="number" className="input-text" placeholder="e.g. 60" value={bottleMl} onChange={e => setBottleMl(e.target.value)} />
              </div>
            )}

            {feedType === 'diaper' && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button className={`font-size-btn ${diaperType === 'wet' ? 'active' : ''}`} onClick={() => setDiaperType('wet')}>💦 Wet</button>
                <button className={`font-size-btn ${diaperType === 'dirty' ? 'active' : ''}`} onClick={() => setDiaperType('dirty')}>💩 Dirty</button>
                <button className={`font-size-btn ${diaperType === 'both' ? 'active' : ''}`} onClick={() => setDiaperType('both')}>💦💩 Both</button>
              </div>
            )}

            <button className="btn-primary" style={{ width: '100%', padding: '10px', borderRadius: '8px' }} onClick={handleAddFeedLog}>
              Log Entry
            </button>
          </div>

          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-heading)' }}>Recent Entries ({feedLogs.length})</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {feedLogs.length > 0 ? (
              feedLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--card-bg)' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-heading)' }}>
                      {log.type === 'breast' ? '🤱 Breast' : log.type === 'bottle' ? '🍼 Bottle' : '🧷 Diaper'}
                    </span>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{log.details}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                    <button style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setFeedLogs(feedLogs.filter(l => l.id !== log.id))}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>No logs recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {/* FEVER & PARACETAMOL LOG */}
      {activeTool === 'fever_tracker' && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card alert-caution" style={{ fontSize: '12px', borderLeft: '4px solid #d32f2f' }}>
            <strong>💡 Dosage Warning:</strong> Paracetamol dosage is always calculated based on your baby's weight, not age. Standard dose is 15 mg per kg body weight, every 4-6 hours. Always double-check with your pediatrician before giving medicine.
          </div>

          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Add Fever / Medicine Entry</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>TEMPERATURE (°F or °C)</label>
                <input type="text" className="input-text" placeholder="e.g. 100.8°F" value={tempVal} onChange={e => setTempVal(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>PARACETAMOL DOSE</label>
                <input type="text" className="input-text" placeholder="e.g. 1.5 ml" value={doseVal} onChange={e => setDoseVal(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>SYMPTOMS & REMARKS</label>
              <input type="text" className="input-text" placeholder="e.g. slight cough, lethargic" value={symptomText} onChange={e => setSymptomText(e.target.value)} />
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '10px', borderRadius: '8px' }} onClick={handleAddFeverLog}>
              Log Temperature
            </button>
          </div>

          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-heading)' }}>Fever History ({feverLogs.length})</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {feverLogs.map(log => (
              <div key={log.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--card-bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: '#d32f2f' }}>🌡️ {log.temp}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{log.timestamp}</span>
                    <button style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setFeverLogs(feverLogs.filter(l => l.id !== log.id))}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text)' }}>
                  <strong>Medication:</strong> {log.dose} | <strong>Symptoms:</strong> {log.symptoms}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ALLERGENS LOG */}
      {activeTool === 'allergen_tracker' && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Log New Food Trial</h3>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FOOD ITEM NAME</label>
              <input type="text" className="input-text" placeholder="e.g. Mashed Ragi Porridge" value={foodName} onChange={e => setFoodName(e.target.value)} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>REACTION SEVERITY (OVER 3 DAYS)</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button className={`font-size-btn ${allergyReaction === 'None' ? 'active' : ''}`} onClick={() => setAllergyReaction('None')}>🟢 None</button>
                <button className={`font-size-btn ${allergyReaction === 'Mild' ? 'active' : ''}`} onClick={() => setAllergyReaction('Mild')}>🟡 Mild Rash</button>
                <button className={`font-size-btn ${allergyReaction === 'Severe' ? 'active' : ''}`} onClick={() => setAllergyReaction('Severe')}>🔴 Severe / Spit-up</button>
              </div>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DIGESTION / SKIN REMARKS</label>
              <input type="text" className="input-text" placeholder="e.g. regular stools, no rash" value={allergyNotes} onChange={e => setAllergyNotes(e.target.value)} />
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '10px', borderRadius: '8px' }} onClick={handleAddAllergenLog}>
              Log Trial
            </button>
          </div>

          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-heading)' }}>Foods Logged ({allergenLogs.length})</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {allergenLogs.map(log => (
              <div key={log.id} style={{ padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--card-bg)', textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-heading)' }}>🍎 {log.food}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ 
                      fontSize: '10px', 
                      fontWeight: '700',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      color: '#fff',
                      backgroundColor: log.reaction === 'None' ? '#2e7d32' : log.reaction === 'Mild' ? '#f57c00' : '#d32f2f'
                    }}>
                      {log.reaction}
                    </span>
                    <button style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setAllergenLogs(allergenLogs.filter(l => l.id !== log.id))}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Date: {log.date} • Notes: {log.notes}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KMC TRACKER */}
      {activeTool === 'kmc_tracker' && (
        <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Add Kangaroo Mother Care (KMC) Hours</h3>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DATE</label>
                <input type="date" className="input-text" value={kmcDate} onChange={e => setKmcDate(e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>DURATION (HOURS)</label>
                <input type="number" step="0.5" className="input-text" placeholder="e.g. 2.5" value={kmcHours} onChange={e => setKmcHours(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '10px', borderRadius: '8px' }} onClick={handleAddKmcLog}>
              Log Hours
            </button>
          </div>

          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-heading)' }}>KMC Logs ({kmcLogs.length})</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
            {kmcLogs.map(log => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: '10px', backgroundColor: 'var(--card-bg)' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-heading)' }}>🤱 KMC Skin-to-Skin</span>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{log.hours} Hours completed</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-heading)' }}>{log.date}</span>
                  <button style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setKmcLogs(kmcLogs.filter(l => l.id !== log.id))}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRINTABLE: EMERGENCY CARD */}
      {activeTool === 'print_emergency' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="no-print card alert-note">
            Fill out this emergency card with your details, then tap **Print Template** below. It is formatted to fit on a refrigerator magnet or wallet card.
          </div>
          
          {/* Inputs (Hidden during printing) */}
          <div className="no-print card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h3 style={{ fontSize: '15px' }}>Fill Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input type="text" className="input-text" placeholder="Baby's Name" value={fillBabyName} onChange={e => setFillBabyName(e.target.value)} />
              <input type="text" className="input-text" placeholder="Blood Type" value={fillBloodType} onChange={e => setFillBloodType(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input type="text" className="input-text" placeholder="Pediatrician" value={fillPediatrician} onChange={e => setFillPediatrician(e.target.value)} />
              <input type="text" className="input-text" placeholder="Pediatrician Phone" value={fillPedPhone} onChange={e => setFillPedPhone(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input type="text" className="input-text" placeholder="Preferred ER Hospital" value={fillHosp} onChange={e => setFillHosp(e.target.value)} />
              <input type="text" className="input-text" placeholder="Hospital ER Phone" value={fillHospPhone} onChange={e => setFillHospPhone(e.target.value)} />
            </div>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '6px' }} onClick={handlePrint}>
              <Printer size={16} /> Print Template (PDF)
            </button>
          </div>

          {/* Printable Layout Target */}
          <div className="printable-card-to-print" style={{ 
            border: '2px dashed #d32f2f', 
            borderRadius: '12px', 
            padding: '20px', 
            backgroundColor: '#ffffff',
            color: '#111613',
            fontFamily: 'sans-serif',
            boxShadow: 'none'
          }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #d32f2f', paddingBottom: '10px', marginBottom: '14px' }}>
              <h2 style={{ color: '#d32f2f', fontSize: '20px', margin: 0 }}>🚨 EMERGENCY MEDICAL CARD</h2>
              <span style={{ fontSize: '11px', color: '#666' }}>Thousand Days of Your Baby Parenting Companion</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px', fontSize: '13px' }}>
              <div>
                <strong>Baby\'s Name:</strong>
                <div style={{ padding: '4px', borderBottom: '1px solid #ccc', minHeight: '20px' }}>{fillBabyName || '__________________'}</div>
              </div>
              <div>
                <strong>Blood Group:</strong>
                <div style={{ padding: '4px', borderBottom: '1px solid #ccc', minHeight: '20px' }}>{fillBloodType || '_______'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '16px' }}>
              <div>
                <strong>Paediatrician Clinic:</strong>
                <div style={{ padding: '4px', borderBottom: '1px solid #ccc', minHeight: '20px' }}>
                  {fillPediatrician ? `${fillPediatrician} (Phone: ${fillPedPhone})` : '____________________________________'}
                </div>
              </div>
              <div>
                <strong>Preferred Hospital / Pediatric ER:</strong>
                <div style={{ padding: '4px', borderBottom: '1px solid #ccc', minHeight: '20px' }}>
                  {fillHosp ? `${fillHosp} (Phone: ${fillHospPhone})` : '____________________________________'}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '8px', border: '1px solid #ffcdd2', fontSize: '11px' }}>
              <strong style={{ color: '#d32f2f' }}>⚠️ Red Flag Emergencies: Call Pediatrician or 112/108</strong>
              <ul style={{ paddingLeft: '14px', marginTop: '4px', color: '#333' }}>
                <li>Fever in newborn under 3 months (rectal temp &gt;= 100.4°F / 38°C)</li>
                <li>Breathing distress: chest retractions, flaring nostrils, grunting</li>
                <li>Dehydration: no wet nappy for 6-8 hours, sunken eyes, dry mouth</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE: SAFE SLEEP POSTER */}
      {activeTool === 'print_sleep' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="no-print card alert-note">
            Tape this safe-sleep checklist poster near your baby's crib or cot to keep grandparents, nannies, and babysitters informed of the latest safety rules.
          </div>
          <button className="no-print btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handlePrint}>
            <Printer size={16} /> Print Poster (PDF)
          </button>

          {/* Printable Poster Layout */}
          <div className="printable-card-to-print" style={{ 
            border: '3px double #4a7463', 
            borderRadius: '16px', 
            padding: '30px', 
            backgroundColor: '#ffffff',
            color: '#222',
            fontFamily: 'sans-serif'
          }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #4a7463', paddingBottom: '15px', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px' }}>💤</span>
              <h2 style={{ color: '#4a7463', fontSize: '24px', margin: '6px 0 0 0', fontWeight: 'bold' }}>SAFE INFANT SLEEP ZONE</h2>
              <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase' }}>Caretaker\'s Essential Safety Guidelines</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>👉</span>
                <div>
                  <strong>ALWAYS PLACE BABY ON THEIR BACK:</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#555' }}>Place baby flat on their back for every sleep (naps and night). Never put them to sleep on their stomach or side.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>👉</span>
                <div>
                  <strong>KEEP THE CRIB ENTIRELY BARE:</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#555' }}>Use a firm, flat mattress with a tight-fitting sheet. Keep pillows, heavy blankets, quilts, bolsters, bumpers, and toys out of the crib.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>👉</span>
                <div>
                  <strong>NO WEIGHTED SLEEP ITEMS OR HATS:</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#555' }}>Do not use weighted swaddles or weighted sleep sacks (chest compression danger). Remove hats inside the house to prevent overheating.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '20px' }}>👉</span>
                <div>
                  <strong>ROOM-SHARE, DO NOT BED-SHARE:</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#555' }}>Keep baby\'s cot close to your bed for the first 6-12 months. Do not let baby sleep on a sofa, armchair, or adult bed with you.</p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '30px', borderTop: '1px solid #ccc', paddingTop: '15px', textAlign: 'center', fontSize: '11px', color: '#666' }}>
              *Safe sleep guidelines endorsed by the AAP and IAP.*
            </div>
          </div>
        </div>
      )}

      {/* PRINTABLE: POOP CHART */}
      {activeTool === 'print_poop' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="no-print card alert-note">
            Print this stool color card to hang near your changing table. Infant stools change colors rapidly; this helps you monitor gut health and spot issues.
          </div>
          <button className="no-print btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }} onClick={handlePrint}>
            <Printer size={16} /> Print Chart (PDF)
          </button>

          <img
            className="no-print"
            src="/new-chapters/stool-card-dr-amey-gauns.png"
            alt="Stool card by Dr. Amey Gauns showing common baby stool colours and warning colours"
            style={{ width: '100%', borderRadius: '12px', border: '1px solid var(--border)' }}
          />

          {/* Printable Poop Chart Layout */}
          <div className="printable-card-to-print" style={{ 
            border: '2px solid #333', 
            borderRadius: '12px', 
            padding: '24px', 
            backgroundColor: '#ffffff',
            color: '#111',
            fontFamily: 'sans-serif'
          }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #ccc', paddingBottom: '10px', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '20px', margin: 0 }}>🎨 INFANT STOOL COLOR HEALTH CARD</h2>
              <span style={{ fontSize: '11px', color: '#555' }}>Quick reference poop color guide for new parents</span>
            </div>

            {/* Colors Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* Healthy */}
              <div style={{ border: '1px solid #e0e0e0', padding: '10px', borderRadius: '8px', backgroundColor: '#fcfcfc' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#2e7d32', marginBottom: '8px' }}>🟢 SAFE COLORS (NORMAL)</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#ffd54f', border: '1px solid #d3a100' }} title="Yellow" />
                  <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#8d6e63', border: '1px solid #5d4037' }} title="Brown" />
                  <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#a1887f', border: '1px solid #70574e' }} title="Tan" />
                  <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#558b2f', border: '1px solid #33691e' }} title="Green" />
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#555' }}>
                  Breastfed babies stool is mustard-yellow/seedy. Formula-fed is tan/brown. Green is common and normal (due to bile or iron supplements).
                </p>
              </div>

              {/* Warning */}
              <div style={{ border: '1px solid #ffccbc', padding: '10px', borderRadius: '8px', backgroundColor: '#fffbe0' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#d84315', marginBottom: '8px' }}>🔴 WARNING COLORS (SEEK DOCTOR ADVICE)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#f5f5f5', border: '2px solid #ccc' }} />
                    <span style={{ fontSize: '11px' }}><strong>White / Pale Grey (Acholic Stool):</strong> Can indicate a rare liver/bile duct issue. Call doctor immediately.</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#212121', border: '2px solid #000' }} />
                    <span style={{ fontSize: '11px' }}><strong>Black (Tar-like):</strong> Normal in the first 2-3 days (meconium). Abnormal after day 5 (can mean blood).</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#d32f2f', border: '2px solid #9a0007' }} />
                    <span style={{ fontSize: '11px' }}><strong>Red (Blood streaks):</strong> Can indicate milk allergy, severe diaper rash cuts, or gut infections.</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
