import React, { useState, useEffect } from 'react';
import { searchBook, type SearchResult } from '../utils/search';
import { MessageSquare, Send, Mic, HelpCircle, X, Bookmark } from 'lucide-react';

interface AskAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  babyAgeMonths: number | null;
  isPregnant: boolean;
  onJumpToSection: (sectionId: string) => void;
  onNavigateTab: (tab: string) => void;
  onSaveAnswer: (qa: { question: string; answer: string; chapter: string; section: string; page: number; sectionId: string }) => void;
  savedAnswers: Array<{ question: string; answer: string; sectionId: string }>;
}

export const AskAssistant: React.FC<AskAssistantProps> = ({
  isOpen,
  onClose,
  babyAgeMonths,
  isPregnant,
  onJumpToSection,
  onNavigateTab,
  onSaveAnswer,
  savedAnswers
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSearch = (searchVal: string) => {
    if (!searchVal.trim()) return;
    const searchResults = searchBook(searchVal, babyAgeMonths, isPregnant);
    // Limit to top result + 3 related
    setResults(searchResults);
    setHasSearched(true);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  // Simulate Speech to Text (or use Web Speech Recognition API if available)
  const handleStartListening = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const speechResult = event.results[0][0].transcript;
        setQuery(speechResult);
        handleSearch(speechResult);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      // Fallback: Simulate voice recognition for demonstration
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const prompts = [
          "My baby is 3 months old and not sleeping properly",
          "What vaccines are due at 6 weeks?",
          "Breastfeeding basics and latch issues",
          "What should I pack in my hospital bag?",
          "Fever warning signs"
        ];
        const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];
        setQuery(randomPrompt);
        handleSearch(randomPrompt);
      }, 1500);
    }
  };

  const extractFirstImage = (contentMd: string) => {
    // 1. Check standard HTML img tags
    const imgHtmlRegex = /<img\s+[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']+)["']/i;
    let match = contentMd.match(imgHtmlRegex);
    if (match) {
      return { src: match[1], alt: match[2] };
    }

    // 2. Check HTML img tags where alt comes first
    const imgHtmlAltRegex = /<img\s+[^>]*alt=["']([^"']+)["'][^>]*src=["']([^"']+)["']/i;
    match = contentMd.match(imgHtmlAltRegex);
    if (match) {
      return { src: match[2], alt: match[1] };
    }

    // 3. Check Markdown image tags
    const imgMdRegex = /!\[(.*?)\]\((.*?)\)/;
    match = contentMd.match(imgMdRegex);
    if (match) {
      return { src: match[2], alt: match[1] };
    }

    return null;
  };

  const bestMatch = results[0];
  const relatedMatches = results.slice(1, 4);

  // Check if answer is already saved
  const isAnswerSaved = bestMatch && savedAnswers.some(ans => ans.sectionId === bestMatch.section.id);
  
  // Extract relevant image asset if present
  const imageAsset = bestMatch ? extractFirstImage(bestMatch.section.content_md) : null;

  // Highlight keywords helper
  const highlightWords = (text: string, words: string[]) => {
    if (words.length === 0) return text;
    
    // Create regex matching keywords
    const escapedWords = words.map(w => w.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    const pattern = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');
    
    const parts = text.split(pattern);
    return parts.map((part, i) => {
      const isKeyword = pattern.test(part) || words.some(w => w.toLowerCase() === part.toLowerCase());
      return isKeyword ? (
        <mark key={i} className="highlight-text" style={{ padding: '0 2px' }}>{part}</mark>
      ) : part;
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content fade-in-up" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          height: '85%', 
          display: 'flex', 
          flexDirection: 'column', 
          borderTopLeftRadius: '24px', 
          borderTopRightRadius: '24px' 
        }}
      >
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-heading)', fontFamily: 'var(--font-sans)', margin: 0 }}>
              Smart Answer Finder
            </h2>
          </div>
          <button 
            style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Input Bar */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', position: 'relative' }}>
          <input 
            type="text" 
            className="input-text" 
            placeholder={isListening ? "Listening..." : "Ask: '3 month baby not sleeping'..."} 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            style={{ paddingRight: '76px', borderRadius: '12px' }}
            disabled={isListening}
          />
          <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '4px' }}>
            <button 
              style={{ 
                border: 'none', 
                background: 'none', 
                color: isListening ? 'var(--accent)' : 'var(--text-muted)', 
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                backgroundColor: isListening ? 'var(--accent-light)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onClick={handleStartListening}
              title="Speak question"
            >
              <Mic size={18} />
            </button>
            <button 
              style={{ 
                border: 'none', 
                background: 'none', 
                color: 'var(--primary)', 
                cursor: 'pointer',
                padding: '6px'
              }}
              onClick={() => handleSearch(query)}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingBottom: '10px' }}>
          {isListening && (
            <div style={{ textAlign: 'center', padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                <span className="dot" style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: 'var(--primary)', animation: 'pulse 1.2s infinite' }}></span>
                <span className="dot" style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: 'var(--primary)', animation: 'pulse 1.2s infinite 0.2s' }}></span>
                <span className="dot" style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: 'var(--primary)', animation: 'pulse 1.2s infinite 0.4s' }}></span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Listening to your voice...</div>
            </div>
          )}

          {!hasSearched && !isListening && (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
              <HelpCircle size={48} style={{ color: 'var(--border)', margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-heading)' }}>Have a question?</h3>
              <p style={{ fontSize: '13px', marginTop: '6px', lineHeight: 1.4 }}>
                Ask anything about breastfeeding, sleep cycles, weaning, safety warnings, or vaccines. 
                The finder will scan the book and point you directly to the source.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px', textAlign: 'left' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Suggested Queries:</div>
                <button 
                  onClick={() => { setQuery("Baby not sleeping"); handleSearch("Baby not sleeping"); }}
                  className="btn-secondary" style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', textAlign: 'left' }}
                >
                  "My baby is 3 months old and not sleeping properly"
                </button>
                <button 
                  onClick={() => { setQuery("Breastfeeding latch"); handleSearch("Breastfeeding latch"); }}
                  className="btn-secondary" style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', textAlign: 'left' }}
                >
                  "How to get a deep breastfeeding latch?"
                </button>
                <button 
                  onClick={() => { setQuery("Fever warning signs"); handleSearch("Fever warning signs"); }}
                  className="btn-secondary" style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '8px', textAlign: 'left' }}
                >
                  "When should I call a doctor for fever?"
                </button>
              </div>
            </div>
          )}

          {hasSearched && !isListening && (
            bestMatch ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                
                {/* Main Answer Card */}
                <div className="card" style={{ borderLeft: '4px solid var(--primary)', backgroundColor: 'var(--primary-light)', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Based on the book
                    </span>
                    <button 
                      style={{ 
                        border: 'none', 
                        background: 'none', 
                        color: isAnswerSaved ? 'var(--accent)' : 'var(--text-muted)', 
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: '500'
                      }}
                      onClick={() => onSaveAnswer({
                        question: query,
                        answer: bestMatch.snippet,
                        chapter: bestMatch.section.chapter_title,
                        section: bestMatch.section.section_title,
                        page: bestMatch.section.start_page,
                        sectionId: bestMatch.section.id
                      })}
                      disabled={isAnswerSaved}
                    >
                      <Bookmark size={12} fill={isAnswerSaved ? "var(--accent)" : "none"} />
                      {isAnswerSaved ? "Saved" : "Save Answer"}
                    </button>
                  </div>
                  
                  <p style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text)', marginBottom: '12px' }}>
                    "{highlightWords(bestMatch.snippet, bestMatch.matchedWords)}"
                  </p>

                  {imageAsset && (
                    <div style={{ margin: '10px 0 14px 0', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                      <img 
                        src={imageAsset.src} 
                        alt={imageAsset.alt} 
                        style={{ width: '100%', maxHeight: '180px', objectFit: 'contain', display: 'block', backgroundColor: '#f9fbf9' }} 
                      />
                      {imageAsset.alt && (
                        <div style={{ fontSize: '11px', padding: '6px 10px', color: 'var(--text-muted)', backgroundColor: 'var(--card-bg)', borderTop: '1px solid var(--border)', fontStyle: 'italic', lineHeight: 1.3 }}>
                          {imageAsset.alt}
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                    Source: <strong style={{ color: 'var(--text-heading)' }}>{bestMatch.section.chapter_title}</strong> 
                    <br />Section: {bestMatch.section.section_title} • Page {bestMatch.section.start_page}
                  </div>

                  <button 
                    className="btn-primary" 
                    style={{ width: '100%', marginTop: '12px', padding: '10px', fontSize: '13px', borderRadius: '8px' }}
                    onClick={() => {
                      onJumpToSection(bestMatch.section.id);
                      onClose();
                    }}
                  >
                    Go to this Section (Page {bestMatch.section.start_page})
                  </button>
                </div>

                {/* Related sections */}
                {relatedMatches.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', paddingLeft: '4px' }}>
                      Related Readings:
                    </div>
                    {relatedMatches.map(match => (
                      <div 
                        key={match.section.id}
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
                        onClick={() => {
                          onJumpToSection(match.section.id);
                          onClose();
                        }}
                      >
                        <div style={{ maxWidth: '80%' }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-heading)' }}>
                            {match.section.section_title}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {match.section.chapter_title.replace(/^Chapter \d+:\s*/, '')}
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Pg {match.section.start_page}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Fallback / No match found
              <div className="card" style={{ borderLeft: '4px solid #d32f2f', backgroundColor: '#fff5f5', padding: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#c62828', marginBottom: '8px' }}>
                  Not found in the book
                </h3>
                <p style={{ fontSize: '13.5px', color: '#c62828', lineHeight: 1.5, marginBottom: '14px' }}>
                  “I could not find this clearly in the book. Please check with a qualified doctor for medical advice.”
                </p>
                <div style={{ borderTop: '1px solid rgba(211,47,47,0.15)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    className="btn-secondary"
                    style={{ 
                      color: '#d32f2f', 
                      borderColor: 'rgba(211,47,47,0.3)', 
                      fontSize: '12px', 
                      padding: '8px 12px', 
                      borderRadius: '8px',
                      backgroundColor: 'transparent'
                    }}
                    onClick={() => {
                      onNavigateTab('emergency');
                      onClose();
                    }}
                  >
                    Open Emergency & Warning Signs
                  </button>
                </div>
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};
