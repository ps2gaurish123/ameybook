import React from 'react';
import { ArrowLeft, Baby, Dog, ExternalLink, HeartHandshake, ShieldAlert, Stethoscope } from 'lucide-react';

interface CareGuidesProps {
  onBackToHome: () => void;
  onNavigateToSection: (sectionId: string) => void;
}

const actionButtonStyle: React.CSSProperties = {
  border: 'none',
  background: 'none',
  color: 'var(--primary)',
  fontWeight: 700,
  fontSize: '13px',
  cursor: 'pointer',
  padding: 0,
  textAlign: 'left',
};

export const CareGuides: React.FC<CareGuidesProps> = ({ onBackToHome, onNavigateToSection }) => (
  <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <button className="nav-item" onClick={onBackToHome} style={{ alignSelf: 'flex-start', height: 'auto', padding: '4px 0', gap: '6px' }}>
      <ArrowLeft size={16} /> Back to home
    </button>

    <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
      <div className="card-title"><HeartHandshake size={19} style={{ color: 'var(--primary)' }} /> Feeding & lactation support</div>
      <p style={{ fontSize: '13px', lineHeight: 1.55, marginTop: '8px' }}>
        Feeding should not be painful or exhausting. If feeds hurt, baby is sleepy at the breast, wet nappies are fewer than expected, or weight gain is a concern, arrange an observed feed with a paediatrician or lactation professional promptly.
      </p>
      <h3 style={{ fontSize: '14px', marginTop: '12px' }}>Useful aids — with the right support</h3>
      <ul className="care-guide-list">
        <li><strong>Hand expression or a pump:</strong> useful when baby cannot latch, you are separated, returning to work, or building supply. A correctly fitted flange matters; pain, rubbing, or whitening of the nipple means stop and get the fit checked.</li>
        <li><strong>Breastfeeding pillow and foot support:</strong> bring baby up to the breast instead of leaning down. Baby’s head, shoulders, and hips should stay aligned.</li>
        <li><strong>Nipple shields:</strong> can help in selected situations, but use them only after a latch and milk-transfer review; they are not a fix for persistent pain or poor weight gain.</li>
        <li><strong>Breast pads and a clean container:</strong> help with leakage and expressed milk. Change damp pads often and label stored milk with the date and time.</li>
      </ul>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
        Galactagogues, herbal products, and medicines are not first-line tools. Check the cause of low supply first and use medicines only when prescribed.
      </p>
      <button style={{ ...actionButtonStyle, marginTop: '12px' }} onClick={() => onNavigateToSection('ch_06_sec_4')}>
        Open latch & positioning in the reader
      </button>
    </div>

    <div className="card" style={{ borderLeft: '4px solid #e65100' }}>
      <div className="card-title"><Baby size={19} style={{ color: '#e65100' }} /> Feeding in special situations</div>
      <ul className="care-guide-list" style={{ marginTop: '10px' }}>
        <li><strong>Vomiting or diarrhoea:</strong> continue breastfeeding more often. For children already on solids, offer small, frequent amounts of soft familiar food and follow a clinician’s advice about oral rehydration solution. Seek urgent care for poor drinking, repeated vomiting, blood in stool/vomit, unusual sleepiness, or markedly fewer wet nappies.</li>
        <li><strong>Premature or unwell baby:</strong> expressed mother’s milk and skin-to-skin care are often central to the plan, but the NICU/paediatric team should decide volume, fortifiers, and the feeding method.</li>
        <li><strong>Maternal illness or medicines:</strong> most common illnesses do not automatically mean stopping breastfeeding. Check every new medicine with the prescribing doctor or pharmacist; do not stop essential treatment without advice.</li>
        <li><strong>Starting solids:</strong> begin around 6 months when developmentally ready, continue breast milk or formula, offer varied textures gradually, and use responsive feeding: encourage patiently but never force.</li>
      </ul>
      <button style={{ ...actionButtonStyle, marginTop: '12px' }} onClick={() => onNavigateToSection('ch_06_sec_10')}>
        Open special-circumstances feeding in the reader
      </button>
    </div>

    <div className="card" style={{ borderLeft: '4px solid #d32f2f' }}>
      <div className="card-title" style={{ color: '#b71c1c' }}><Dog size={19} /> Dog, cat, monkey, or bat bite / scratch</div>
      <p style={{ fontSize: '13px', lineHeight: 1.55, marginTop: '8px' }}>
        Treat any bite, scratch, or saliva on broken skin as urgent. A scratch can be enough to need rabies assessment.
      </p>
      <ol className="care-guide-list" style={{ marginTop: '10px' }}>
        <li><strong>Wash immediately:</strong> flush the wound with running water and soap for a full 15 minutes. If soap is unavailable, keep flushing with clean water.</li>
        <li><strong>Do not delay care:</strong> go to a hospital or anti-rabies clinic the same day. The clinician will assess rabies post-exposure treatment, tetanus protection, and whether antibiotics are needed.</li>
        <li><strong>Do not use home remedies:</strong> do not apply chilli, turmeric, oil, toothpaste, or a tight bandage; do not try to make the wound bleed.</li>
        <li><strong>Keep useful details:</strong> note the animal, time, place, vaccination/owner details if known, and whether the skin was broken. Do not chase or handle an unfamiliar animal.</li>
      </ol>
      <div className="card alert-caution" style={{ marginTop: '12px', padding: '10px', background: '#fff5f5', border: '1px solid #ffcdd2' }}>
        <ShieldAlert size={17} style={{ color: '#d32f2f', flexShrink: 0 }} />
        <span style={{ fontSize: '12px', lineHeight: 1.45 }}>For bites to the face, head, neck, hands, genitals, deep wounds, bleeding that will not stop, or a child who is unwell: seek emergency care now.</span>
      </div>
      <button style={{ ...actionButtonStyle, marginTop: '12px' }} onClick={() => onNavigateToSection('ch_12_sec_7')}>
        Open first aid chapter in the reader
      </button>
    </div>

    <div className="card" style={{ background: 'var(--primary-light)' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 700, color: 'var(--text-heading)', fontSize: '13px' }}>
        <Stethoscope size={17} /> Evidence used in these guides
      </div>
      <p style={{ fontSize: '12px', lineHeight: 1.5, marginTop: '6px' }}>
        These quick guides support—not replace—your child’s clinician. They are based on WHO infant-feeding and rabies first-aid guidance.
      </p>
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '8px' }}>
        <a href="https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding" target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>WHO feeding guidance <ExternalLink size={12} /></a>
        <a href="https://www.who.int/news-room/fact-sheets/detail/rabies" target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>WHO rabies guidance <ExternalLink size={12} /></a>
      </div>
    </div>
  </div>
);
