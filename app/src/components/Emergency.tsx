import React from 'react';
import { Phone, Info } from 'lucide-react';

interface EmergencyProps {
  onJumpToSection: (sectionId: string) => void;
}

export const Emergency: React.FC<EmergencyProps> = ({ onJumpToSection }) => {
  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Disclaimer Card */}
      <div className="card alert-caution" style={{ borderLeft: '4px solid #d32f2f', backgroundColor: '#fff5f5', display: 'flex', gap: '12px' }}>
        <Info size={24} style={{ color: '#d32f2f', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            CRITICAL MEDICAL DISCLAIMER
          </div>
          <p style={{ fontSize: '12px', lineHeight: 1.4 }}>
            This application is an educational reading companion based on the book *Your Baby's First 1000 Days*. 
            **It does not replace medical advice, diagnosis, or treatment.** 
            If your baby is sick or you suspect a health emergency, immediately contact your pediatrician or go to the nearest emergency room.
          </p>
        </div>
      </div>

      {/* Emergency Call Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: 'var(--card-bg)' }}>
        <div className="card-title" style={{ color: '#d32f2f' }}>
          <Phone size={18} />
          <span>Quick Contact Hotlines</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <a 
            href="tel:112" 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px', 
              backgroundColor: '#fff5f5', 
              border: '1px solid #ffcdd2',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              color: '#d32f2f'
            }}
          >
            <span>🚨 General Emergency (India)</span>
            <span>Call 112 / 108</span>
          </a>

          <a 
            href="tel:1800116117" 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '12px', 
              backgroundColor: '#fff9c4', 
              border: '1px solid #fff59d',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              color: '#f57f17'
            }}
          >
            <span>🐍 Poison Control (AIIMS New Delhi)</span>
            <span>1800-116-117</span>
          </a>
        </div>
      </div>

      {/* Red Flags Sections */}
      <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '10px', paddingLeft: '4px' }}>
        🚨 Danger Signs (When to call the doctor)
      </div>

      {/* Fever Warning */}
      <div className="card" style={{ borderLeft: '4px solid #d32f2f' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🌡️ High Fever Warnings
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '6px', lineHeight: 1.4 }}>
          * **Newborns (Under 3 Months):** A temperature of **100.4°F (38°C) or higher** is a medical emergency. Do not administer paracetamol yourself; seek pediatric care immediately.
          <br />* **Infants 3-6 Months:** Contact doctor for fever above **101°F (38.3°C)**.
          <br />* **Toddlers Over 6 Months:** Call pediatrician if fever exceeds **103°F (39.4°C)** or persists for more than 3 days.
        </p>
        <button 
          style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: '600', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px' }}
          onClick={() => onJumpToSection('ch_10_sec_1')} // Fever section
        >
          Read detailed Fever Chapter (Page 142)
        </button>
      </div>

      {/* Breathing Warning */}
      <div className="card" style={{ borderLeft: '4px solid #d32f2f' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🫁 Breathing Difficulty Signs
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '6px', lineHeight: 1.4 }}>
          Seek immediate help if you notice:
          <br />* **Fast Breathing:** More than 60 breaths per minute in newborns, or 50 in older infants.
          <br />* **Chest Retractions:** Skin sucking in deeply between or below the ribs during breathing.
          <br />* **Grunting or Nostril Flaring:** Audible grunts or wide nostril movement on inhalation.
          <br />* **Cyanosis:** Blue or pale tint to the lips, tongue, face, or nails.
        </p>
        <button 
          style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: '600', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px' }}
          onClick={() => onJumpToSection('ch_04_sec_4')} // SIDS/Sleep environment breathing
        >
          Read breathing safety guidelines
        </button>
      </div>

      {/* Dehydration Warning */}
      <div className="card" style={{ borderLeft: '4px solid #e65100' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          💧 Severe Dehydration Signs
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '6px', lineHeight: 1.4 }}>
          Dehydration happens quickly in babies with diarrhea or vomiting:
          <br />* **Dry Diaper:** No wet nappy for **6 to 8 hours**.
          <br />* **Sunken Fontanelle:** The soft spot on top of baby's head looks noticeably hollow or sunken.
          <br />* **Dry Mouth:** Lack of saliva or tears when crying.
          <br />* **Extreme Lethargy:** Baby is unusually sleepy, difficult to wake, or does not react.
        </p>
        <button 
          style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: '600', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px' }}
          onClick={() => onJumpToSection('ch_07_sec_3')} // Dehydration/Vomiting
        >
          Read spit-up & dehydration sections
        </button>
      </div>

      {/* Choking Emergency First Aid */}
      <div className="card" style={{ borderLeft: '4px solid #d32f2f' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🍼 Choking First Aid (Under 1 Year)
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text)', marginTop: '6px', lineHeight: 1.4 }}>
          If baby is choking and cannot cry, cough, or breathe:
          <br />1. **Give 5 Back Blows:** Lay baby face down on your forearm, supporting the chin, and give 5 firm blows between the shoulder blades with the heel of your hand.
          <br />2. **Give 5 Chest Thrusts:** Turn baby face up on your forearm, support the head, and use two fingers to press down 5 times on the center of the chest (lower half of breastbone).
          <br />3. Repeat until the object is expelled or baby becomes unresponsive. Start infant CPR immediately if baby becomes unresponsive.
        </p>
        <button 
          style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: '600', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline', marginTop: '10px' }}
          onClick={() => onJumpToSection('ch_12_sec_3')} // Safety & Choking emergency
        >
          View choking illustration and detailed guide (Page 184)
        </button>
      </div>

    </div>
  );
};
