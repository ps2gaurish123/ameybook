import React, { useState } from 'react';

interface OnboardingProps {
  onComplete: (data: {
    completed: boolean;
    isPregnant: boolean;
    babyBirthDate: string;
    expectedDeliveryDate: string;
    language: string;
    dailySuggestions: boolean;
  }) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [isPregnant, setIsPregnant] = useState<boolean | null>(null);
  const [date, setDate] = useState<string>('');
  const [language, setLanguage] = useState<string>('English');
  const [dailySuggestions, setDailySuggestions] = useState<boolean>(true);
  const [step, setStep] = useState<number>(1);

  const handleNext = () => {
    if (step === 1 && isPregnant !== null) {
      setStep(2);
    } else if (step === 2 && date !== '') {
      setStep(3);
    } else if (step === 3) {
      onComplete({
        completed: true,
        isPregnant: isPregnant === true,
        babyBirthDate: isPregnant ? '' : date,
        expectedDeliveryDate: isPregnant ? date : '',
        language,
        dailySuggestions
      });
    }
  };

  return (
    <div className="onboarding-screen fade-in-up">
      <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '30px' }}>
        <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: '32px', fontWeight: '700', color: 'var(--primary)' }}>
          Thousand Days
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
          Your guide from pregnancy through the first 1000 days.
        </p>
      </div>

      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px' }}>
        {step === 1 && (
          <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '22px', marginBottom: '10px' }}>Welcome! Tell us about your journey</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              We will customize your reading path to show recommendations exactly relevant to your baby's stage.
            </p>
            
            <button 
              className={`btn-secondary ${isPregnant === true ? 'active' : ''}`}
              style={{ 
                padding: '20px', 
                borderRadius: '12px', 
                borderWidth: isPregnant === true ? '2px' : '1px',
                borderColor: isPregnant === true ? 'var(--primary)' : 'var(--border)',
                backgroundColor: isPregnant === true ? 'var(--primary-light)' : 'transparent',
                textAlign: 'left'
              }}
              onClick={() => setIsPregnant(true)}
            >
              <div style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text-heading)' }}>🤰 I am Pregnant</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Help me prepare for birth and newborn care</div>
            </button>

            <button 
              className={`btn-secondary ${isPregnant === false ? 'active' : ''}`}
              style={{ 
                padding: '20px', 
                borderRadius: '12px', 
                borderWidth: isPregnant === false ? '2px' : '1px',
                borderColor: isPregnant === false ? 'var(--primary)' : 'var(--border)',
                backgroundColor: isPregnant === false ? 'var(--primary-light)' : 'transparent',
                textAlign: 'left'
              }}
              onClick={() => setIsPregnant(false)}
            >
              <div style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text-heading)' }}>👶 I am a Parent</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Guide me through feeding, sleep, and development</div>
            </button>

            <button 
              className="btn-primary" 
              style={{ marginTop: '20px', padding: '14px', borderRadius: '12px' }}
              disabled={isPregnant === null}
              onClick={handleNext}
            >
              Continue
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '22px' }}>
              {isPregnant ? "Expected Delivery Date" : "Baby's Date of Birth"}
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '10px' }}>
              We use this date to show recommended sections like breastfeeding, sleep routines, milestones, and vaccines.
            </p>
            
            <input 
              type="date" 
              className="input-text" 
              style={{ padding: '14px', borderRadius: '12px', textAlign: 'center' }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={isPregnant ? undefined : new Date().toISOString().split('T')[0]} // Can't select future date for born baby
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, padding: '14px', borderRadius: '12px' }}
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1, padding: '14px', borderRadius: '12px' }}
                disabled={date === ''}
                onClick={handleNext}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '22px' }}>Preferences</h2>
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '10px' }}>
              Almost done! Select your reading preferences.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>PREFERRED LANGUAGE</label>
              <select 
                className="input-text" 
                style={{ padding: '12px', borderRadius: '12px' }}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिंदी)</option>
                <option value="Marathi">Marathi (मराठी)</option>
              </select>
            </div>

            <div className="switch-container" style={{ marginTop: '10px' }}>
              <div>
                <div style={{ fontWeight: '600', fontSize: '15px', color: 'var(--text-heading)' }}>Daily Recommended Readings</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Show a tailored reading list on your home screen daily</div>
              </div>
              <input 
                type="checkbox" 
                style={{ width: '22px', height: '22px', accentColor: 'var(--primary)' }}
                checked={dailySuggestions}
                onChange={(e) => setDailySuggestions(e.target.checked)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1, padding: '14px', borderRadius: '12px' }}
                onClick={() => setStep(2)}
              >
                Back
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1, padding: '14px', borderRadius: '12px' }}
                onClick={handleNext}
              >
                Enter App
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'var(--text-muted)' }}>
        This app uses the guidelines of the Indian Academy of Pediatrics (IAP). Always check with your pediatrician for personal medical advice.
      </div>
    </div>
  );
};
