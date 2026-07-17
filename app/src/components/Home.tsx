import React, { useMemo } from 'react';
import bookDataJson from '../assets/book_data.json';
import { type BookSection, getStagesByAge } from '../utils/search';
import { BookOpen, AlertTriangle, CheckSquare, Bookmark, Calendar, HeartHandshake } from 'lucide-react';

const bookData = bookDataJson as BookSection[];

interface HomeProps {
  onboarding: {
    isPregnant: boolean;
    babyBirthDate: string;
    expectedDeliveryDate: string;
  };
  lastReadSectionId: string | null;
  onNavigateToSection: (sectionId: string) => void;
  onNavigateTab: (tab: string) => void;
  checklistTally: { checked: number; total: number };
}

export const Home: React.FC<HomeProps> = ({
  onboarding,
  lastReadSectionId,
  onNavigateToSection,
  onNavigateTab,
  checklistTally
}) => {
  const { isPregnant, babyBirthDate, expectedDeliveryDate } = onboarding;

  // Calculate age stats
  const ageStats = useMemo(() => {
    const today = new Date();
    if (isPregnant) {
      const edd = expectedDeliveryDate ? new Date(expectedDeliveryDate) : new Date();
      // Estimate pregnancy progress (pregnancy is roughly 40 weeks = 280 days)
      const diffTime = edd.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const gestationalAgeDays = 280 - diffDays;
      const weeks = Math.max(0, Math.min(40, Math.floor(gestationalAgeDays / 7)));
      const days = Math.max(0, gestationalAgeDays % 7);
      
      return {
        display: `Pregnancy: ${weeks} Weeks, ${days} Days`,
        months: null,
        daysPassed: gestationalAgeDays,
        totalDays: 280,
        pct: Math.max(0, Math.min(100, (gestationalAgeDays / 280) * 100)),
        stageName: "Pregnancy Preparation"
      };
    } else {
      const dob = babyBirthDate ? new Date(babyBirthDate) : new Date();
      const diffTime = today.getTime() - dob.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      const totalMonths = Math.floor(diffDays / 30.4);
      const remainingDays = Math.floor(diffDays % 30.4);
      
      const display = totalMonths > 0 
        ? `${totalMonths} Month${totalMonths > 1 ? 's' : ''}, ${remainingDays} Day${remainingDays > 1 ? 's' : ''}`
        : `${diffDays} Day${diffDays > 1 ? 's' : ''}`;

      // 1000 days milestones progress
      return {
        display: `Baby's Age: ${display}`,
        months: totalMonths,
        daysPassed: diffDays,
        totalDays: 1000,
        pct: Math.max(0, Math.min(100, (diffDays / 1000) * 100)),
        stageName: `Day ${diffDays} of 1000`
      };
    }
  }, [isPregnant, babyBirthDate, expectedDeliveryDate]);

  // Find the last read section or fallback to introduction
  const lastReadSection = useMemo(() => {
    if (lastReadSectionId) {
      return bookData.find(s => s.id === lastReadSectionId) || null;
    }
    return null;
  }, [lastReadSectionId]);

  // Determine user stages and select recommended readings
  const recommendations = useMemo(() => {
    const userStages = getStagesByAge(ageStats.months, isPregnant);
    // Find sections that have overlapping stages
    const matched = bookData.filter(section => 
      section.section_title !== "Overview" && 
      section.stages.some(st => userStages.includes(st))
    );

    // Pick 3 semi-randomized / representative sections based on stages
    // We can seed it with the day of the year so it changes every day
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000);
    const result: BookSection[] = [];
    
    if (matched.length > 0) {
      for (let i = 0; i < Math.min(3, matched.length); i++) {
        const index = (dayOfYear + i * 7) % matched.length;
        // Avoid duplicate recommendations
        const sec = matched[index];
        if (!result.some(r => r.id === sec.id)) {
          result.push(sec);
        }
      }
    }
    
    // Fallback if empty
    if (result.length === 0) {
      return bookData.slice(2, 5);
    }
    return result;
  }, [ageStats.months, isPregnant]);

  // Dynamic daily card tip based on baby's stage
  const dailyTip = useMemo(() => {
    if (isPregnant) {
      return {
        title: "Third Trimester Focus",
        tip: "Pack your hospital bag early! Keep medical cards, prenatal reports, and front-opening clothes at the top of the bag."
      };
    }
    
    const months = ageStats.months ?? 0;
    if (months < 1) {
      return {
        title: "Newborn Comfort Tip",
        tip: "Keep the baby's umbilical cord dry and bare. Do not apply oils, turmeric, or powders; it will fall off naturally in 7-14 days."
      };
    } else if (months < 3) {
      return {
        title: "Safe Sleep Tip",
        tip: "Always put your baby to sleep flat on their back in a bare cot. No pillows, bumper pads, or blankets are needed; they are suffocation hazards."
      };
    } else if (months < 6) {
      return {
        title: "Feeding Milestones",
        tip: "Around 4-5 months, watch for hunger cues like smack-lips, rooting, or fingers in mouth. Crying is a late sign of hunger."
      };
    } else if (months < 12) {
      return {
        title: "Weaning and Solids",
        tip: "Introduce single-ingredient pureed/mashed foods like ragi or banana khichdi. Don't add sugar or salt in the first year."
      };
    } else {
      return {
        title: "Toddler Safety Tip",
        tip: "As babies crawl and walk, secure heavy furniture, guard electrical sockets, and store cleaning liquids locked away."
      };
    }
  }, [isPregnant, ageStats.months]);

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* 1000 Days Timeline Progress Card */}
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)', 
        color: '#ffffff',
        border: 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isPregnant ? "Pregnancy Progress" : "First 1000 Days Journey"}
          </span>
          <span style={{ fontSize: '13px', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px' }}>
            {ageStats.stageName}
          </span>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', fontFamily: 'var(--font-sans)', marginTop: '4px' }}>
          {ageStats.display}
        </h2>
        <div>
          <div className="progress-bar-container" style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', height: '8px' }}>
            <div className="progress-bar-fill" style={{ backgroundColor: '#ffffff', width: `${ageStats.pct}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.8, marginTop: '6px' }}>
            <span>{isPregnant ? "Conception" : "Birth"}</span>
            <span>{isPregnant ? "40 Weeks" : "1000 Days (Age 2)"}</span>
          </div>
        </div>
      </div>

      {/* Continue Reading Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="card-title">
          <BookOpen size={18} style={{ color: 'var(--primary)' }} />
          <span>Continue Reading</span>
        </div>
        {lastReadSection ? (
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)' }}>
              {lastReadSection.section_title}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              {lastReadSection.chapter_title} • Page {lastReadSection.start_page}
            </div>
            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '12px', padding: '10px 16px', fontSize: '14px', borderRadius: '10px' }}
              onClick={() => onNavigateToSection(lastReadSection.id)}
            >
              Resume Reading
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              You haven't started reading yet. Begin your parenting journey with the introduction.
            </div>
            <button 
              className="btn-primary" 
              style={{ width: '100%', marginTop: '12px', padding: '10px 16px', fontSize: '14px', borderRadius: '10px' }}
              onClick={() => onNavigateToSection('ch_00_intro')}
            >
              Start Reading
            </button>
          </div>
        )}
      </div>

      {/* Daily Card */}
      <div className="card" style={{ borderLeft: '4px solid var(--accent)', backgroundColor: 'var(--card-bg)' }}>
        <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Daily Parenting Tip
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-heading)', marginTop: '4px', marginBottom: '4px' }}>
          {dailyTip.title}
        </h3>
        <p style={{ fontSize: '13.5px', color: 'var(--text)', lineHeight: 1.5 }}>
          {dailyTip.tip}
        </p>
      </div>

      {/* Recommended Readings Path */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="card-title">
          <Calendar size={18} style={{ color: 'var(--primary)' }} />
          <span>Recommended For This Stage</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {recommendations.map(section => (
            <div 
              key={section.id} 
              style={{ 
                padding: '12px', 
                border: '1px solid var(--border)', 
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'var(--transition)'
              }}
              onClick={() => onNavigateToSection(section.id)}
              className="btn-secondary"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-heading)', textAlign: 'left' }}>
                  {section.section_title}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', backgroundColor: 'var(--primary-light)', padding: '2px 6px', borderRadius: '6px' }}>
                  Pg {section.start_page}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'left' }}>
                {section.chapter_title.replace(/^Chapter \d+:\s*/, '')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Access Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', textAlign: 'center' }} onClick={() => onNavigateTab('care-guides')}>
          <HeartHandshake size={20} style={{ color: 'var(--primary)' }} />
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-heading)' }}>Quick Care Guides</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Feeding, lactation & bites</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', textAlign: 'center' }} onClick={() => onNavigateTab('checklists')}>
          <CheckSquare size={20} style={{ color: 'var(--primary)' }} />
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-heading)' }}>Checklists</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {checklistTally.checked} / {checklistTally.total} completed
          </div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', textAlign: 'center' }} onClick={() => onNavigateTab('saved')}>
          <Bookmark size={20} style={{ color: 'var(--accent)' }} />
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-heading)' }}>Saved Items</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Bookmarks & notes</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', textAlign: 'center' }} onClick={() => onNavigateTab('trackers')}>
          <span style={{ fontSize: '20px' }}>🍼</span>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-heading)' }}>Trackers & Printables</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Interactive logs & PDFs</div>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', textAlign: 'center' }} onClick={() => onNavigateTab('emergency')}>
          <AlertTriangle size={20} style={{ color: '#d32f2f' }} />
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#d32f2f' }}>Emergency Guide</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Red flag warning signs</div>
        </div>
      </div>

      {/* Important Safety Box */}
      <div className="card alert-caution" style={{ borderLeft: '4px solid #d32f2f', backgroundColor: '#fff5f5', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <AlertTriangle size={24} style={{ color: '#d32f2f', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#c62828' }}>
            Medical Warning & Emergencies
          </div>
          <p style={{ fontSize: '12px', color: '#c62828', lineHeight: 1.4 }}>
            Learn the signs of infant respiratory distress, high fever, and dehydration. 
            Remember: this app supports educational reading only and **does not replace a pediatrician**.
          </p>
          <button 
            style={{ 
              alignSelf: 'flex-start', 
              border: 'none', 
              background: 'none', 
              color: '#d32f2f', 
              fontWeight: '600', 
              fontSize: '12px', 
              cursor: 'pointer',
              textDecoration: 'underline',
              marginTop: '4px'
            }}
            onClick={() => onNavigateTab('emergency')}
          >
            Show Emergency Guide
          </button>
        </div>
      </div>
      
    </div>
  );
};
