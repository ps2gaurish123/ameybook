import { useState, useEffect, useMemo } from 'react';
import { Onboarding } from './components/Onboarding';
import { Home } from './components/Home';
import { Reader } from './components/Reader';
import { AskAssistant } from './components/AskAssistant';
import { Timeline } from './components/Timeline';
import { Checklists } from './components/Checklists';
import { Emergency } from './components/Emergency';
import { CareGuides } from './components/CareGuides';
import { Saved } from './components/Saved';
import { TrackersHub } from './components/TrackersHub';

import { 
  Home as HomeIcon, BookOpen, Calendar, CheckSquare, Bookmark, AlertTriangle, MessageSquare 
} from 'lucide-react';

interface OnboardingData {
  completed: boolean;
  isPregnant: boolean;
  babyBirthDate: string;
  expectedDeliveryDate: string;
  language: string;
  dailySuggestions: boolean;
}

function App() {
  // 1. Core States loaded from LocalStorage
  const [onboarding, setOnboarding] = useState<OnboardingData>(() => {
    const saved = localStorage.getItem('parenting_app_onboarding');
    return saved ? JSON.parse(saved) : {
      completed: false,
      isPregnant: false,
      babyBirthDate: '',
      expectedDeliveryDate: '',
      language: 'English',
      dailySuggestions: true
    };
  });

  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('parenting_app_active_tab') || 'home';
  });

  const [activeSectionId, setActiveSectionId] = useState<string>(() => {
    return localStorage.getItem('parenting_app_active_section_id') || 'ch_00_intro';
  });

  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('parenting_app_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  const [notes, setNotes] = useState<{ [secId: string]: string }>(() => {
    const saved = localStorage.getItem('parenting_app_notes');
    return saved ? JSON.parse(saved) : {};
  });

  const [highlights, setHighlights] = useState<{ [secId: string]: string[] }>(() => {
    const saved = localStorage.getItem('parenting_app_highlights');
    return saved ? JSON.parse(saved) : {};
  });

  const [savedAnswers, setSavedAnswers] = useState<Array<{
    question: string;
    answer: string;
    chapter: string;
    section: string;
    page: number;
    sectionId: string;
  }>>(() => {
    const saved = localStorage.getItem('parenting_app_saved_answers');
    return saved ? JSON.parse(saved) : [];
  });

  const [checklistProgress, setChecklistProgress] = useState<{ [listId: string]: string[] }>(() => {
    const saved = localStorage.getItem('parenting_app_checklist_progress');
    return saved ? JSON.parse(saved) : {};
  });

  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem('parenting_app_theme') || 'sage';
  });

  const [fontSize, setFontSize] = useState<string>(() => {
    return localStorage.getItem('parenting_app_font_size') || 'medium';
  });


  const [isAskOpen, setIsAskOpen] = useState<boolean>(false);
  const [isPrivacyShieldVisible, setIsPrivacyShieldVisible] = useState<boolean>(false);

  // 2. Sync States to LocalStorage
  useEffect(() => {
    localStorage.setItem('parenting_app_onboarding', JSON.stringify(onboarding));
  }, [onboarding]);

  useEffect(() => {
    localStorage.setItem('parenting_app_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('parenting_app_active_section_id', activeSectionId);
  }, [activeSectionId]);

  useEffect(() => {
    localStorage.setItem('parenting_app_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('parenting_app_notes', JSON.stringify(notes));
  }, [notes]);

  useEffect(() => {
    localStorage.setItem('parenting_app_highlights', JSON.stringify(highlights));
  }, [highlights]);

  useEffect(() => {
    localStorage.setItem('parenting_app_saved_answers', JSON.stringify(savedAnswers));
  }, [savedAnswers]);

  useEffect(() => {
    localStorage.setItem('parenting_app_checklist_progress', JSON.stringify(checklistProgress));
  }, [checklistProgress]);

  useEffect(() => {
    localStorage.setItem('parenting_app_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('parenting_app_font_size', fontSize);
  }, [fontSize]);

  // 3. Bind theme, font size, privacy shield, and the desktop reader layout.
  useEffect(() => {
    document.body.className = [
      `theme-${theme}`,
      `font-${fontSize}`,
      activeTab === 'reader' ? 'reader-wide-layout' : '',
      isPrivacyShieldVisible ? 'privacy-shield-active' : ''
    ].filter(Boolean).join(' ');
  }, [theme, fontSize, activeTab, isPrivacyShieldVisible]);

  // 3a. Screenshot/privacy deterrence.
  // Web browsers cannot truly block OS-level screenshots, especially on iPad/iOS,
  // but these measures hide sensitive content during print, tab switching,
  // app switching, drag/copy attempts, and common keyboard capture shortcuts.
  useEffect(() => {
    let shieldTimer: number | undefined;

    const showShieldBriefly = () => {
      setIsPrivacyShieldVisible(true);
      window.clearTimeout(shieldTimer);
      shieldTimer = window.setTimeout(() => {
        if (!document.hidden && document.hasFocus()) {
          setIsPrivacyShieldVisible(false);
        }
      }, 1500);
    };

    const handleVisibilityChange = () => {
      setIsPrivacyShieldVisible(document.hidden);
    };

    const handleBlur = () => setIsPrivacyShieldVisible(true);
    const handleFocus = () => {
      window.clearTimeout(shieldTimer);
      shieldTimer = window.setTimeout(() => setIsPrivacyShieldVisible(false), 250);
    };

    const preventDefault = (event: Event) => {
      event.preventDefault();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isPrintScreen = key === 'printscreen';
      const isPrint = (event.ctrlKey || event.metaKey) && key === 'p';
      const isSave = (event.ctrlKey || event.metaKey) && key === 's';
      const isCopyOrCut = (event.ctrlKey || event.metaKey) && (key === 'c' || key === 'x');
      const isCommonSnipShortcut = event.metaKey && event.shiftKey && (key === 's' || key === '4' || key === '5');

      if (isPrintScreen || isPrint || isSave || isCopyOrCut || isCommonSnipShortcut) {
        event.preventDefault();
        showShieldBriefly();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('dragstart', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(shieldTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // 4. Callbacks
  const handleOnboardingComplete = (data: OnboardingData) => {
    setOnboarding(data);
  };

  const handleNavigateToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setActiveTab('reader');
  };

  const handleToggleBookmark = (sectionId: string) => {
    setBookmarks(prev => 
      prev.includes(sectionId) ? prev.filter(id => id !== sectionId) : [...prev, sectionId]
    );
  };

  const handleSaveNote = (sectionId: string, noteText: string) => {
    setNotes(prev => {
      const updated = { ...prev };
      if (noteText.trim()) {
        updated[sectionId] = noteText;
      } else {
        delete updated[sectionId];
      }
      return updated;
    });
  };

  const handleDeleteNote = (sectionId: string) => {
    setNotes(prev => {
      const updated = { ...prev };
      delete updated[sectionId];
      return updated;
    });
  };

  const handleToggleHighlight = (sectionId: string, paraIndex: number) => {
    setHighlights(prev => {
      const updated = { ...prev };
      const list = updated[sectionId] ? [...updated[sectionId]] : [];
      const paraStr = String(paraIndex);
      
      if (list.includes(paraStr)) {
        updated[sectionId] = list.filter(p => p !== paraStr);
      } else {
        updated[sectionId] = [...list, paraStr];
      }
      
      if (updated[sectionId].length === 0) {
        delete updated[sectionId];
      }
      return updated;
    });
  };

  const handleSaveAnswer = (qa: { question: string; answer: string; chapter: string; section: string; page: number; sectionId: string }) => {
    setSavedAnswers(prev => {
      if (prev.some(a => a.sectionId === qa.sectionId)) return prev;
      return [...prev, qa];
    });
  };

  const handleDeleteAnswer = (sectionId: string) => {
    setSavedAnswers(prev => prev.filter(ans => ans.sectionId !== sectionId));
  };

  const handleToggleChecklistItem = (listId: string, itemId: string) => {
    setChecklistProgress(prev => {
      const updated = { ...prev };
      const list = updated[listId] ? [...updated[listId]] : [];
      
      if (list.includes(itemId)) {
        updated[listId] = list.filter(id => id !== itemId);
      } else {
        updated[listId] = [...list, itemId];
      }
      return updated;
    });
  };


  // Calculate overall checklist totals
  const checklistTally = useMemo(() => {
    let checked = 0;
    Object.keys(checklistProgress).forEach(key => {
      checked += checklistProgress[key]?.length || 0;
    });
    return { checked, total: 68 }; // Total matching all checklists combined
  }, [checklistProgress]);

  // Compute Baby Age in Months for search context
  const babyAgeMonths = useMemo(() => {
    if (onboarding.isPregnant) return null;
    if (!onboarding.babyBirthDate) return null;
    const today = new Date();
    const dob = new Date(onboarding.babyBirthDate);
    const diffTime = today.getTime() - dob.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 30.4);
  }, [onboarding]);

  // 5. Render Screen View
  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <Home 
            onboarding={onboarding}
            lastReadSectionId={activeSectionId}
            onNavigateToSection={handleNavigateToSection}
            onNavigateTab={setActiveTab}
            checklistTally={checklistTally}
          />
        );
      case 'reader':
        return (
          <Reader 
            activeSectionId={activeSectionId}
            onNavigateToSection={setActiveSectionId}
            bookmarks={bookmarks}
            onToggleBookmark={handleToggleBookmark}
            notes={notes}
            onSaveNote={handleSaveNote}
            highlights={highlights}
            onToggleHighlight={handleToggleHighlight}
            theme={theme}
            onChangeTheme={setTheme}
            fontSize={fontSize}
            onChangeFontSize={setFontSize}
          />
        );
      case 'trackers':
        return (
          <TrackersHub 
            onBackToHome={() => setActiveTab('home')}
            initialToolId="menu"
            babyBirthDate={onboarding.babyBirthDate}
          />
        );
      case 'timeline':
        return (
          <Timeline 
            onNavigateToSection={handleNavigateToSection}
            onNavigateTab={setActiveTab}
          />
        );
      case 'checklists':
        return (
          <Checklists 
            checklistProgress={checklistProgress}
            onToggleItem={handleToggleChecklistItem}
          />
        );
      case 'saved':
        return (
          <Saved 
            bookmarks={bookmarks}
            onRemoveBookmark={handleToggleBookmark}
            notes={notes}
            onDeleteNote={handleDeleteNote}
            onEditNote={handleNavigateToSection}
            savedAnswers={savedAnswers}
            onDeleteAnswer={handleDeleteAnswer}
            onNavigateToSection={handleNavigateToSection}
          />
        );
      case 'emergency':
        return (
          <Emergency 
            onJumpToSection={handleNavigateToSection}
          />
        );
      case 'care-guides':
        return (
          <CareGuides
            onBackToHome={() => setActiveTab('home')}
            onNavigateToSection={handleNavigateToSection}
          />
        );
      default:
        return <div>Screen not found</div>;
    }
  };

  // Render Onboarding Screen if not completed
  if (!onboarding.completed) {
    return (
      <div className="app-container">
        <div className="app-protected-content">
          <Onboarding onComplete={handleOnboardingComplete} />
        </div>
        <div className="privacy-shield" aria-hidden={!isPrivacyShieldVisible}>
          <div className="privacy-shield-card">
            <BookOpen size={28} />
            <h2>Protected reading mode</h2>
            <p>Content is hidden when the app is not active.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="app-protected-content">
        {/* Sticky Header (except on Reader which has its own toolbar) */}
        {activeTab !== 'reader' && (
          <div className="header-bar">
            <div className="header-title" style={{ color: 'var(--primary)', cursor: 'pointer' }} onClick={() => setActiveTab('home')}>
              Thousand Days
            </div>
            <button 
              className="nav-item" 
              style={{ 
                height: 'auto', 
                flex: 'none', 
                padding: '6px 12px', 
                borderRadius: '8px', 
                backgroundColor: 'rgba(211,47,47,0.1)', 
                color: '#d32f2f',
                display: 'flex',
                flexDirection: 'row',
                gap: '4px',
                fontWeight: '600'
              }}
              onClick={() => setActiveTab('emergency')}
            >
              <AlertTriangle size={15} /> Emergency
            </button>
          </div>
        )}

        {/* Main Page Area */}
        <div className={`main-content${activeTab === 'reader' ? ' reader-main-content' : ''}`}>
          {renderScreen()}
        </div>

        {/* Floating Ask Button (renders on all non-reader, non-emergency screens) */}
        {activeTab !== 'emergency' && (
          <button 
            className="floating-ask-btn" 
            onClick={() => setIsAskOpen(true)}
            title="Ask parenting book finder"
          >
            <MessageSquare />
          </button>
        )}

        {/* Floating Ask Assistant Modal */}
        <AskAssistant 
          isOpen={isAskOpen}
          onClose={() => setIsAskOpen(false)}
          babyAgeMonths={babyAgeMonths}
          isPregnant={onboarding.isPregnant}
          onJumpToSection={handleNavigateToSection}
          onNavigateTab={setActiveTab}
          onSaveAnswer={handleSaveAnswer}
          savedAnswers={savedAnswers}
        />

        {/* Bottom Navigation Bar */}
        <div className="bottom-nav">
          <button className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <HomeIcon /> Home
          </button>
          <button className={`nav-item ${activeTab === 'reader' ? 'active' : ''}`} onClick={() => setActiveTab('reader')}>
            <BookOpen /> Reader
          </button>
          <button className={`nav-item ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
            <Calendar /> Timeline
          </button>
          <button className={`nav-item ${activeTab === 'checklists' ? 'active' : ''}`} onClick={() => setActiveTab('checklists')}>
            <CheckSquare /> Checklists
          </button>
          <button className={`nav-item ${activeTab === 'saved' ? 'active' : ''}`} onClick={() => setActiveTab('saved')}>
            <Bookmark /> Saved
          </button>
        </div>
      </div>

      <div className="privacy-shield" aria-hidden={!isPrivacyShieldVisible}>
        <div className="privacy-shield-card">
          <BookOpen size={28} />
          <h2>Protected reading mode</h2>
          <p>Content is hidden when the app is not active.</p>
        </div>
      </div>
    </div>
  );
}

export default App;
