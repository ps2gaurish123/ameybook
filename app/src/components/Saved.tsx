import React, { useState, useMemo } from 'react';
import bookDataJson from '../assets/book_data.json';
import { type BookSection } from '../utils/search';
import { Bookmark, Edit, Trash, MessageSquare, ChevronRight } from 'lucide-react';

const bookData = bookDataJson as BookSection[];

interface SavedProps {
  bookmarks: string[];
  onRemoveBookmark: (sectionId: string) => void;
  notes: { [sectionId: string]: string };
  onDeleteNote: (sectionId: string) => void;
  onEditNote: (sectionId: string) => void; // This can trigger opening that page
  savedAnswers: Array<{
    question: string;
    answer: string;
    chapter: string;
    section: string;
    page: number;
    sectionId: string;
  }>;
  onDeleteAnswer: (sectionId: string) => void;
  onNavigateToSection: (sectionId: string) => void;
}

export const Saved: React.FC<SavedProps> = ({
  bookmarks,
  onRemoveBookmark,
  notes,
  onDeleteNote,
  savedAnswers,
  onDeleteAnswer,
  onNavigateToSection
}) => {
  const [activeTab, setActiveTab] = useState<'bookmarks' | 'notes' | 'answers'>('bookmarks');

  // Filter bookmarked sections
  const bookmarkedSections = useMemo(() => {
    return bookData.filter(s => bookmarks.includes(s.id));
  }, [bookmarks]);

  // Filter sections that have notes
  const notesSections = useMemo(() => {
    return bookData.filter(s => !!notes[s.id]);
  }, [notes]);

  return (
    <div className="fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Sub-tab selection */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', paddingBottom: '2px' }}>
        <button
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            background: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            borderBottom: activeTab === 'bookmarks' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'bookmarks' ? 'var(--primary)' : 'var(--text-muted)'
          }}
          onClick={() => setActiveTab('bookmarks')}
        >
          🔖 Bookmarks ({bookmarks.length})
        </button>
        <button
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            background: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            borderBottom: activeTab === 'notes' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'notes' ? 'var(--primary)' : 'var(--text-muted)'
          }}
          onClick={() => setActiveTab('notes')}
        >
          📝 Notes ({notesSections.length})
        </button>
        <button
          style={{
            flex: 1,
            padding: '10px',
            border: 'none',
            background: 'none',
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer',
            borderBottom: activeTab === 'answers' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'answers' ? 'var(--primary)' : 'var(--text-muted)'
          }}
          onClick={() => setActiveTab('answers')}
        >
          💡 Saved Q&A ({savedAnswers.length})
        </button>
      </div>

      {/* Bookmarks List */}
      {activeTab === 'bookmarks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {bookmarkedSections.length > 0 ? (
            bookmarkedSections.map(sec => (
              <div 
                key={sec.id}
                className="card"
                style={{ 
                  padding: '14px', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer' 
                }}
                onClick={() => onNavigateToSection(sec.id)}
              >
                <div style={{ maxWidth: '80%', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <Bookmark size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--text-heading)' }}>
                      {sec.section_title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {sec.chapter_title} • Page {sec.start_page}
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                  <button 
                    style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    onClick={() => onRemoveBookmark(sec.id)}
                    title="Remove Bookmark"
                  >
                    <Trash size={16} />
                  </button>
                  <ChevronRight size={16} style={{ color: 'var(--border)' }} onClick={() => onNavigateToSection(sec.id)} />
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Bookmark size={40} style={{ color: 'var(--border)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600' }}>No Bookmarks Saved</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Tap the bookmark icon in the top right of the reader screen to save important sections.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes List */}
      {activeTab === 'notes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {notesSections.length > 0 ? (
            notesSections.map(sec => (
              <div 
                key={sec.id}
                className="card"
                style={{ 
                  padding: '14px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px', 
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onClick={() => onNavigateToSection(sec.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>
                    {sec.section_title}
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <button 
                      style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      onClick={() => onDeleteNote(sec.id)}
                      title="Delete Note"
                    >
                      <Trash size={15} />
                    </button>
                  </div>
                </div>

                <div style={{ fontSize: '13px', fontStyle: 'italic', padding: '8px', backgroundColor: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  "{notes[sec.id]}"
                </div>
                
                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                  {sec.chapter_title} • Page {sec.start_page}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <Edit size={40} style={{ color: 'var(--border)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600' }}>No Notes Added</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                You can write notes at the bottom of pages on the reader screen to record reminders or doctor questions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Saved Answers List */}
      {activeTab === 'answers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {savedAnswers.length > 0 ? (
            savedAnswers.map((qa, index) => (
              <div 
                key={index}
                className="card"
                style={{ 
                  padding: '14px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
                onClick={() => onNavigateToSection(qa.sectionId)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <MessageSquare size={14} style={{ color: 'var(--primary)' }} />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-heading)' }}>
                      Q: {qa.question}
                    </span>
                  </div>
                  <button 
                    style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    onClick={e => {
                      e.stopPropagation();
                      onDeleteAnswer(qa.sectionId);
                    }}
                    title="Delete Saved Answer"
                  >
                    <Trash size={15} />
                  </button>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>
                  "{qa.answer}"
                </div>

                <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '6px' }}>
                  Source: {qa.section} • Page {qa.page}
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
              <MessageSquare size={40} style={{ color: 'var(--border)', margin: '0 auto 12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600' }}>No Saved Answers</div>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Ask questions using the float button and hit "Save Answer" to store them here for quick lookup.
              </p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
