import React, { useState, useMemo } from 'react';
import bookDataJson from '../assets/book_data.json';
import { type BookSection } from '../utils/search';
import { Calendar, ChevronRight } from 'lucide-react';

const bookData = bookDataJson as BookSection[];

interface TimelineProps {
  onNavigateToSection: (sectionId: string) => void;
  onNavigateTab: (tab: string) => void;
}

const STAGES = [
  { id: 'pregnancy', name: 'Pregnancy', range: 'Pregnancy' },
  { id: 'birth_prep', name: 'Birth Prep', range: 'Birth preparation' },
  { id: '0_3m', name: '0–3 Months', range: 'Birth to 3 months' },
  { id: '3_6m', name: '3–6 Months', range: '3 to 6 months' },
  { id: '6_12m', name: '6–12 Months', range: '6 to 12 months' },
  { id: '12_24m', name: '12–24 Months', range: '12 to 24 months' },
  { id: '24_36m', name: '24–36 Months', range: '24 to 36 months' }
];

// Highlight milestones/info for each stage
const STAGE_HIGHLIGHTS: { [key: string]: { milestones: string[]; vaccines: string[]; focus: string } } = {
  pregnancy: {
    focus: "Antenatal wellness, morning sickness, and early fetal growth.",
    milestones: ["First movements (quickening) around 18-20 weeks", "Baby's hearing develops around 24 weeks", "Rapid brain growth in 3rd trimester"],
    vaccines: ["Tetanus Toxoid (TT) / Tdap injections for mother", "Influenza vaccination recommended"]
  },
  birth_prep: {
    focus: "Labor preparation, hospital bag assembly, and immediate newborn choices.",
    milestones: ["Baby drops lower into pelvis (lightening)", "Understanding stages of labor", "Deciding on dry umbilical cord care"],
    vaccines: ["Newborn Screening (UNHS & Pulse Oximetry) plan", "Confirming hospital birth immunization access"]
  },
  '0_3m': {
    focus: "Establishing breastfeeding, settling home routines, and newborn sleep patterns.",
    milestones: ["Smiles socially (around 6-8 weeks)", "Follows moving objects with eyes", "Lifts head briefly during tummy time"],
    vaccines: ["Birth: BCG, OPV, Hep B-1 birth dose", "6 Weeks: DTaP/DTwP-1, IPV-1, Hib-1, Hep B-2, Rota-1, PCV-1", "10 Weeks: DTaP/DTwP-2, IPV-2, Hib-2, Hep B-3, Rota-2, PCV-2"]
  },
  '3_6m': {
    focus: "Circadian sleep rhythm adjustments, growth acceleration, and saliva development.",
    milestones: ["Rolls over from tummy to back", "Babbles and mimics sounds", "Reaches and grabs toys with hands"],
    vaccines: ["14 Weeks: DTaP/DTwP-3, IPV-3, Hib-3, Hep B-4, Rota-3, PCV-3", "6 Months: Influenza vaccine-1; typhoid if advised"]
  },
  '6_12m': {
    focus: "Introducing solids (weaning), sitting up, crawling, and safety hazard management.",
    milestones: ["Sits without support (6-7 months)", "Crawls (around 9 months)", "Pulls to stand and cruises furniture"],
    vaccines: ["7 Months: Influenza vaccine-2", "9 Months: MMR-1", "12 Months: Hep A, MCV-2, JE-1 / cholera only where indicated"]
  },
  '12_24m': {
    focus: "Independent walking, single-word vocabulary, table food diets, and vaccines booster.",
    milestones: ["Walks independently (12-15 months)", "Says 5-10 words, points to objects", "Mimics household chores and uses spoon"],
    vaccines: ["13 Months: JE-2 / cholera-2 where indicated", "15 Months: MMR-2, Varicella-1, PCV booster", "16-18 Months: DTaP/DTwP-B1, Hib-B1, IPV-B1"]
  },
  '24_36m': {
    focus: "Expressive language development (sentences), toilet training, and motor coordinates.",
    milestones: ["Runs, kicks a ball, jumps", "Builds tower of 4-6 blocks", "Says 2-4 word sentences"],
    vaccines: ["2 Years: Typhoid vaccine booster", "Hepatitis A booster (if inactive vaccine chosen)"]
  }
};

export const Timeline: React.FC<TimelineProps> = ({ onNavigateToSection, onNavigateTab }) => {
  const [selectedStageId, setSelectedStageId] = useState('0_3m');

  const selectedStage = useMemo(() => {
    return STAGES.find(s => s.id === selectedStageId) || STAGES[2];
  }, [selectedStageId]);

  // Filter book sections that belong to the active timeline stage
  const stageSections = useMemo(() => {
    return bookData.filter(sec => 
      sec.stages.includes(selectedStage.range)
    );
  }, [selectedStage]);

  const highlights = STAGE_HIGHLIGHTS[selectedStageId] || STAGE_HIGHLIGHTS['0_3m'];

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Horizontal Scroll Bar */}
      <div>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
          Select Development Stage
        </div>
        <div className="timeline-scroller">
          {STAGES.map(stage => (
            <button
              key={stage.id}
              className={`timeline-tab ${selectedStageId === stage.id ? 'active' : ''}`}
              onClick={() => setSelectedStageId(stage.id)}
            >
              {stage.name}
            </button>
          ))}
        </div>
      </div>

      {/* Stage Overview Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="card-title" style={{ fontSize: '17px' }}>
          <Calendar size={18} style={{ color: 'var(--primary)' }} />
          <span>Stage Overview</span>
        </div>
        <p style={{ fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.5 }}>
          {highlights.focus}
        </p>
      </div>

      {/* Milestones & Vaccines Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        <div className="card">
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            👶 Key Milestones
          </div>
          <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            {highlights.milestones.map((m, i) => (
              <li key={i} style={{ color: 'var(--text)' }}>{m}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-heading)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            💉 Vaccine schedule (IAP)
          </div>
          <ul style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
            {highlights.vaccines.map((v, i) => (
              <li key={i} style={{ color: 'var(--text)' }}>{v}</li>
            ))}
          </ul>
          <button 
            style={{ 
              alignSelf: 'flex-start', 
              border: 'none', 
              background: 'none', 
              color: 'var(--primary)', 
              fontWeight: '600', 
              fontSize: '12px', 
              cursor: 'pointer',
              textDecoration: 'underline',
              marginTop: '10px'
            }}
            onClick={() => onNavigateTab('checklists')}
          >
            Go to Vaccination Checklist
          </button>
        </div>
      </div>

      {/* Relevant Chapters Section List */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          📚 Relevant Book Sections ({stageSections.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
          {stageSections.map(sec => (
            <div
              key={sec.id}
              className="btn-secondary"
              style={{ 
                padding: '10px 12px', 
                borderRadius: '10px', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                cursor: 'pointer',
                textAlign: 'left'
              }}
              onClick={() => onNavigateToSection(sec.id)}
            >
              <div style={{ maxWidth: '80%' }}>
                <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-heading)' }}>
                  {sec.section_title}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {sec.chapter_title}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>Pg {sec.start_page}</span>
                <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
