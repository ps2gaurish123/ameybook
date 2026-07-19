import React, { useState, useEffect, useRef, useMemo } from 'react';
import bookDataJson from '../assets/book_data.json';
import { recipeOverrides } from '../assets/recipeOverrides';
import { bookContentOverrides } from '../assets/bookContentOverrides';
import { additionalBookSections } from '../assets/additionalBookSections';
import { sanitizeBookContent } from '../assets/bookContentSanitizer';
import { type BookSection } from '../utils/search';
import { 
  Search, Bookmark, BookmarkCheck, Type, 
  Square, Volume2, Edit, List, Headphones, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import PdfReader from './PdfReader';

const baseBookData = (bookDataJson as BookSection[]).map(section => ({
  ...section,
  ...recipeOverrides[section.id],
  ...bookContentOverrides[section.id],
}));

const poopGuideInsertIndex = baseBookData.findIndex(section => section.id === 'ch_08_sec_14') + 1;
const bookData = [
  ...baseBookData.slice(0, poopGuideInsertIndex),
  ...additionalBookSections,
  ...baseBookData.slice(poopGuideInsertIndex),
].map(section => ({
  ...section,
  content_md: sanitizeBookContent(section.content_md),
}));

interface ReaderProps {
  activeSectionId: string;
  onNavigateToSection: (sectionId: string) => void;
  bookmarks: string[];
  onToggleBookmark: (sectionId: string) => void;
  notes: { [sectionId: string]: string };
  onSaveNote: (sectionId: string, note: string) => void;
  highlights: { [sectionId: string]: string[] }; // Paragraph indices highlighted
  onToggleHighlight: (sectionId: string, paraIndex: number) => void;
  theme: string;
  onChangeTheme: (theme: string) => void;
  fontSize: string;
  onChangeFontSize: (size: string) => void;
}

export const Reader: React.FC<ReaderProps> = ({
  activeSectionId,
  onNavigateToSection,
  bookmarks,
  onToggleBookmark,
  notes,
  onSaveNote,
  highlights,
  onToggleHighlight,
  theme,
  onChangeTheme,
  fontSize,
  onChangeFontSize
}) => {
  const [showChapters, setShowChapters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Reading Mode State (Paginated Kindle vs continuous scroll vs Original PDF)
  const [readingMode, setReadingMode] = useState<'paginated' | 'scroll' | 'pdf'>(() => {
    return (localStorage.getItem('parenting_app_reading_mode') as 'paginated' | 'scroll' | 'pdf') || 'paginated';
  });

  // Helper to find the first paragraph index visible on a given page in paginated mode
  const findFirstParaOnPage = (pageIdx: number): number => {
    if (!columnsRef.current) return 0;
    const clientWidth = columnsRef.current.clientWidth;
    if (clientWidth <= 0) return 0;
    const targetLeft = pageIdx * (clientWidth + 32);
    
    let bestIdx = 0;
    let minDiff = Infinity;
    
    for (let idx = 0; idx < paragraphs.length; idx++) {
      const el = document.getElementById(`reader-para-${idx}`);
      if (el) {
        const diff = Math.abs(el.offsetLeft - targetLeft);
        if (diff < minDiff) {
          minDiff = diff;
          bestIdx = idx;
        }
      }
    }
    return bestIdx;
  };

  // Helper to find the first paragraph index visible at the top of the scroll container
  const findFirstVisibleParaInScroll = (): number => {
    const container = readerScrollRef.current;
    if (!container) return 0;
    const scrollContainer = (container.scrollHeight > container.clientHeight)
      ? container
      : (document.querySelector('.main-content') as HTMLDivElement | null) || container;
      
    const containerRect = scrollContainer.getBoundingClientRect();
    let bestIdx = 0;
    let minTopDiff = Infinity;
    
    for (let idx = 0; idx < paragraphs.length; idx++) {
      const el = document.getElementById(`reader-para-${idx}`);
      if (el) {
        const elRect = el.getBoundingClientRect();
        // Measure offset from top of container viewport
        const diff = Math.abs(elRect.top - containerRect.top);
        if (diff < minTopDiff) {
          minTopDiff = diff;
          bestIdx = idx;
        }
      }
    }
    return bestIdx;
  };

  const handleReadingModeChange = (mode: 'paginated' | 'scroll' | 'pdf') => {
    const oldMode = readingMode;
    setReadingMode(mode);
    localStorage.setItem('parenting_app_reading_mode', mode);
    
    // Smoothly preserve location when switching between text modes
    if (mode === 'scroll' && oldMode === 'paginated') {
      const activeIdx = findFirstParaOnPage(currentPageIndex);
      setTimeout(() => {
        const el = document.getElementById(`reader-para-${activeIdx}`);
        const container = readerScrollRef.current;
        if (el && container) {
          const scrollContainer = (container.scrollHeight > container.clientHeight)
            ? container
            : (document.querySelector('.main-content') as HTMLDivElement | null) || container;
          
          const containerRect = scrollContainer.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const elementTop = elRect.top - containerRect.top + scrollContainer.scrollTop;
          
          scrollContainer.scrollTo({
            top: Math.max(0, elementTop - 30), // align near the top with 30px padding
            behavior: 'auto'
          });
        }
      }, 50);
    } else if (mode === 'paginated' && oldMode === 'scroll') {
      const activeIdx = findFirstVisibleParaInScroll();
      setTimeout(() => {
        const el = document.getElementById(`reader-para-${activeIdx}`);
        const columnsEl = columnsRef.current;
        if (el && columnsEl) {
          const clientWidth = columnsEl.clientWidth;
          if (clientWidth > 0) {
            const pageIndex = Math.floor((el.offsetLeft + 16) / (clientWidth + 32));
            const clampedPage = Math.max(0, Math.min(totalPages - 1, pageIndex));
            setCurrentPageIndex(clampedPage);
          }
        }
      }, 200);
    }
  };

  // PDF mode state
  const [pdfPage, setPdfPage] = useState<number>(() => {
    const saved = localStorage.getItem('parenting_app_pdf_page');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [pdfTotalPages, setPdfTotalPages] = useState<number | null>(null);

  const [zoomImageSrc, setZoomImageSrc] = useState<string | null>(null);
  
  // Kindle Pagination States
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [barsVisible, setBarsVisible] = useState(true);
  
  // Drawer sheets
  const [showAudioDrawer, setShowAudioDrawer] = useState(false);
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    return localStorage.getItem('parenting_app_tts_voice') || '';
  });
  
  // Active reading paragraph index for highlight tracking
  const [currentReadingParaIndex, setCurrentReadingParaIndex] = useState<number | null>(null);
  const [selectedParaMenuIndex, setSelectedParaMenuIndex] = useState<number | null>(null);

  // Note edit state
  const [noteInput, setNoteInput] = useState('');
  
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const columnsRef = useRef<HTMLDivElement | null>(null);
  const readerScrollRef = useRef<HTMLDivElement | null>(null);
  
  // Track last scrolled paragraph to avoid duplicate scrolls
  const lastScrolledParaRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<any>(null);

  // Touch Swiping Coordinates
  const touchStartX = useRef<number | null>(null);

  // Initialize Web Speech Synthesis & Dynamic Voice List Loading
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const allVoices = window.speechSynthesis.getVoices();
        // Filter for English languages
        const enVoices = allVoices.filter(v => v.lang.startsWith('en'));
        setAvailableVoices(enVoices);
        
        setSelectedVoiceName(prev => {
          if (prev && enVoices.some(v => v.name === prev)) return prev;
          const defaultVoice = enVoices.find(v => v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('zira') || v.name.toLowerCase().includes('google')) || enVoices[0];
          return defaultVoice ? defaultVoice.name : '';
        });
      };

      loadVoices();
      
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
      }
    };
  }, []);

  const activeIndex = useMemo(() => {
    const idx = bookData.findIndex(s => s.id === activeSectionId);
    return idx === -1 ? 0 : idx;
  }, [activeSectionId]);

  const currentSection = bookData[activeIndex];

  // Recalculate e-book pagination columns
  const recalculatePagination = () => {
    if (columnsRef.current) {
      const el = columnsRef.current;
      const scrollWidth = el.scrollWidth;
      const clientWidth = el.clientWidth;
      if (clientWidth > 0) {
        const pages = Math.max(1, Math.ceil(scrollWidth / clientWidth));
        setTotalPages(pages);
        // Make sure index is in bounds
        setCurrentPageIndex(prev => Math.min(prev, pages - 1));
      }
    }
  };

  // Re-run pagination when section, font size, or theme changes
  useEffect(() => {
    // Wait a brief tick for text to reflow in DOM before measuring
    const timer = setTimeout(() => {
      recalculatePagination();
    }, 150);

    // Setup ResizeObserver to watch dimensions changes
    let resizeObserver: ResizeObserver | null = null;
    if (columnsRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        recalculatePagination();
      });
      resizeObserver.observe(columnsRef.current);
    }

    window.addEventListener('resize', recalculatePagination);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', recalculatePagination);
      if (resizeObserver && columnsRef.current) {
        resizeObserver.unobserve(columnsRef.current);
      }
    };
  }, [activeSectionId, fontSize, theme]);

  // Sync state when page/section transitions
  useEffect(() => {
    setNoteInput(notes[activeSectionId] || '');
    setCurrentPageIndex(0);
    
    // Stop audio when page changes
    if (synthRef.current && isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
    }
    setCurrentReadingParaIndex(null);
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setSelectedParaMenuIndex(null);
    
    // Sync PDF page to the section's start_page
    if (readingMode === 'pdf' && currentSection) {
      setPdfPage(currentSection.start_page);
    }
    
    // Close drawers
    setShowAudioDrawer(false);
    setShowNotesDrawer(false);
  }, [activeSectionId, notes]);

  // Navigate back/forward across columns and chapters
  const handlePrevColumn = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    } else if (activeIndex > 0) {
      // Go to previous chapter, and set to its LAST page column (handled by reflow on load)
      // Actually, since we set index to 0 on load, we can set index temporarily to a large number so it clamps to the end
      onNavigateToSection(bookData[activeIndex - 1].id);
      // Timeout forces page load to finish before setting index to last column
      setTimeout(() => {
        if (columnsRef.current) {
          const el = columnsRef.current;
          const pages = Math.max(1, Math.ceil(el.scrollWidth / el.clientWidth));
          setCurrentPageIndex(pages - 1);
        }
      }, 200);
    }
  };

  const handleNextColumn = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    } else if (activeIndex < bookData.length - 1) {
      onNavigateToSection(bookData[activeIndex + 1].id);
    }
  };

  const isBookmarked = bookmarks.includes(activeSectionId);

  // Helper to play section content using a specific TTS voice from a given paragraph index
  const playWithVoice = (voiceName: string, startIndex: number = 0) => {
    if (!synthRef.current) return;
    
    synthRef.current.cancel();
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    setCurrentReadingParaIndex(startIndex);
    
    // Concatenate text starting from selected paragraph index onwards
    const textToSpeak = paragraphs.slice(startIndex).join('\n\n');
    const speechText = textToSpeak
      .replace(/^#+\s+/gm, '') 
      .replace(/>\s*\[!.*?\]/g, '') 
      .replace(/>/g, '') 
      .replace(/!\[.*?\]\(.*?\)/g, '') 
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') 
      .replace(/[*_#`]/g, '');

    // Recompute character ranges specifically relative to this sub-text starting offset
    let cumulative = 0;
    const subRanges = paragraphs.slice(startIndex).map((p, offsetIdx) => {
      const start = cumulative;
      const cleanP = p
        .replace(/^#+\s+/gm, '') 
        .replace(/>\s*\[!.*?\]/g, '') 
        .replace(/>/g, '') 
        .replace(/!\[.*?\]\(.*?\)/g, '') 
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') 
        .replace(/[*_#`]/g, '')
        .trim();
      const len = cleanP.length + 2; // +2 for paragraph spacing
      cumulative += len;
      return { start, end: cumulative, actualIndex: startIndex + offsetIdx };
    });

    // Time-based boundaries for fallback when onboundary doesn't fire
    let cumulativeTimeMs = 0;
    const timeBoundaries = paragraphs.slice(startIndex).map((p, offsetIdx) => {
      const cleanP = p.replace(/[#*_>]/g, '').trim();
      const words = cleanP.split(/\s+/).filter(w => w.length > 0).length;
      // Estimate ~380ms per word + 650ms paragraph pause
      const duration = (words * 380) + 650;
      const start = cumulativeTimeMs;
      cumulativeTimeMs += duration;
      return { start, end: cumulativeTimeMs, actualIndex: startIndex + offsetIdx };
    });

    const utterance = new SpeechSynthesisUtterance(speechText);
    const voices = synthRef.current.getVoices();
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.lang = voice ? voice.lang : 'en-US'; 
    utterance.rate = 0.95; 

    const startTime = Date.now();
    let hasReceivedBoundary = false;

    utterance.onboundary = (event) => {
      hasReceivedBoundary = true;
      if (event.name === 'word') {
        const charIndex = event.charIndex;
        const match = subRanges.find(range => charIndex >= range.start && charIndex < range.end);
        if (match) {
          setCurrentReadingParaIndex(match.actualIndex);
        }
      }
    };

    const cleanupTts = () => {
      setIsPlaying(false);
      setCurrentReadingParaIndex(null);
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };

    utterance.onend = cleanupTts;
    utterance.onerror = cleanupTts;

    // Fallback timer: advances highlights if browser doesn't trigger boundary events
    const fallbackTimer = setInterval(() => {
      if (hasReceivedBoundary) return;
      const elapsed = Date.now() - startTime;
      const match = timeBoundaries.find(b => elapsed >= b.start && elapsed < b.end);
      if (match) {
        setCurrentReadingParaIndex(match.actualIndex);
      }
    }, 250);

    fallbackTimerRef.current = fallbackTimer;

    utteranceRef.current = utterance;
    synthRef.current.speak(utterance);
    setIsPlaying(true);
  };

  // Toggle play/stop Audio
  const handleToggleAudio = () => {
    if (!synthRef.current) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
      setCurrentReadingParaIndex(null);
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    } else {
      const startIdx = currentReadingParaIndex !== null ? currentReadingParaIndex : 0;
      playWithVoice(selectedVoiceName, startIdx);
      setShowAudioDrawer(false);
    }
  };

  // Handle selected voice change in settings dropdown
  const handleVoiceChange = (voiceName: string) => {
    setSelectedVoiceName(voiceName);
    localStorage.setItem('parenting_app_tts_voice', voiceName);
    setShowAudioDrawer(false);
    
    if (synthRef.current && isPlaying) {
      synthRef.current.cancel();
      setIsPlaying(false);
      if (fallbackTimerRef.current) {
        clearInterval(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      const startIdx = currentReadingParaIndex !== null ? currentReadingParaIndex : 0;
      setTimeout(() => {
        playWithVoice(voiceName, startIdx);
      }, 250);
    }
  };

  const filteredChapters = useMemo(() => {
    if (!searchQuery) return bookData;
    return bookData.filter(s => 
      s.section_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content_md.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const paragraphs = useMemo(() => {
    const rawBlocks = currentSection.content_md.split('\n\n').filter(p => p.trim().length > 0);
    const finalBlocks: string[] = [];
    
    rawBlocks.forEach(block => {
      const lines = block.split('\n');
      let currentAcc = '';
      
      lines.forEach(line => {
        const trimmed = line.trim();
        // Split if line starts with markdown list characters (*, -, 1.) or sub-headings
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('### ') || trimmed.startsWith('## ') || /^\d+\.\s+/.test(trimmed)) {
          if (currentAcc.trim()) {
            finalBlocks.push(currentAcc.trim());
            currentAcc = '';
          }
          finalBlocks.push(line);
        } else {
          currentAcc += (currentAcc ? '\n' : '') + line;
        }
      });
      
      if (currentAcc.trim()) {
        finalBlocks.push(currentAcc.trim());
      }
    });
    
    return finalBlocks;
  }, [currentSection]);

  const activeHighlights = highlights[activeSectionId] || [];

  // Auto-scroll to the active paragraph when the reading index changes
  useEffect(() => {
    if (currentReadingParaIndex === null || !isPlaying) return;
    if (lastScrolledParaRef.current === currentReadingParaIndex) return;
    lastScrolledParaRef.current = currentReadingParaIndex;

    // Throttle audio highlight scroll positioning with requestAnimationFrame to prevent layout thrashing
    requestAnimationFrame(() => {
      const paraEl = document.getElementById(`reader-para-${currentReadingParaIndex}`);
      if (!paraEl) return;

      if (readingMode === 'scroll') {
        const getScrollContainer = (el: HTMLElement | null): HTMLElement | null => {
          if (!el) return null;
          const style = window.getComputedStyle(el);
          const hasOverflow = style.overflowY === 'auto' || style.overflowY === 'scroll';
          if (hasOverflow && el.scrollHeight > el.clientHeight) {
            return el;
          }
          return getScrollContainer(el.parentElement);
        };

        const scrollContainer = getScrollContainer(paraEl);
        if (scrollContainer) {
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = paraEl.getBoundingClientRect();
          
          const currentOffset = elementRect.top - containerRect.top;
          const targetOffset = scrollContainer.clientHeight * 0.25;

          // Do not scroll if the active highlight is already visible near the target zone (between 18% and 35% of the viewport)
          const alreadyGood =
            currentOffset > scrollContainer.clientHeight * 0.18 &&
            currentOffset < scrollContainer.clientHeight * 0.35;

          if (alreadyGood) return;

          const nextTop = scrollContainer.scrollTop + currentOffset - targetOffset;
          
          scrollContainer.scrollTo({
            top: Math.max(0, nextTop),
            behavior: 'smooth'
          });
        }
      } else if (readingMode !== 'pdf') {
        // Paginated mode: flip to the page containing this paragraph
        const columnsEl = columnsRef.current;
        if (columnsEl) {
          const clientWidth = columnsEl.clientWidth;
          if (clientWidth > 0) {
            const columnsRect = columnsEl.getBoundingClientRect();
            
            // Query all client rects for paragraph column splits (essential for multi-column spanning elements)
            const rects = paraEl.getClientRects();
            const spannedPages: number[] = [];
            
            for (let i = 0; i < rects.length; i++) {
              // Calculate page index from relative coordinate difference
              const relativeLeft = rects[i].left - columnsRect.left;
              const pageIdx = Math.floor((relativeLeft + 16) / (clientWidth + 32));
              if (!spannedPages.includes(pageIdx)) {
                spannedPages.push(pageIdx);
              }
            }
            
            // If the paragraph is already visible on the current page, do not flip!
            if (spannedPages.includes(currentPageIndex)) {
              return;
            }
            
            // Otherwise, flip to the first page where this paragraph appears
            if (spannedPages.length > 0) {
              const targetPage = spannedPages[0];
              const clampedPage = Math.max(0, Math.min(totalPages - 1, targetPage));
              setCurrentPageIndex(clampedPage);
            }
          }
        }
      }
    });
  }, [currentReadingParaIndex, isPlaying, readingMode, totalPages, currentPageIndex]);

  // Auto-scroll PDF page in PDF reading mode when audio is playing
  useEffect(() => {
    if (readingMode === 'pdf' && currentReadingParaIndex !== null && isPlaying) {
      const totalParas = paragraphs.length;
      if (totalParas > 0) {
        const start = currentSection.start_page;
        const end = currentSection.end_page || start;
        const pct = currentReadingParaIndex / totalParas;
        // Interpolate the PDF page based on paragraph reading progress
        const targetPage = Math.min(end, Math.max(start, Math.floor(start + pct * (end - start + 1))));
        if (targetPage !== pdfPage) {
          setPdfPage(targetPage);
          localStorage.setItem('parenting_app_pdf_page', String(targetPage));
        }
      }
    }
  }, [currentReadingParaIndex, isPlaying, readingMode, paragraphs.length, currentSection, pdfPage]);


  // Helper to format inline markdown bold (**text**)
  const formatBoldText = (text: string) => {
    if (!text) return '';
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return <strong key={i} style={{ color: 'var(--text-heading)', fontWeight: '700' }}>{part}</strong>;
      }
      return part;
    });
  };

  // Render paragraph or block
  const renderParagraph = (para: string, idx: number) => {
    const isHighlighted = activeHighlights.includes(String(idx));
    const isReading = currentReadingParaIndex === idx;
    
    let element: React.ReactNode = null;
    
    if (para.startsWith('## ')) {
      element = (
        <h2 className={isReading ? 'reading-highlight' : ''} style={{ margin: 0, width: '100%' }}>
          {para.replace('## ', '')}
        </h2>
      );
    } else if (para.startsWith('### ')) {
      element = (
        <h3 className={isReading ? 'reading-highlight' : ''} style={{ margin: 0, width: '100%' }}>
          {para.replace('### ', '')}
        </h3>
      );
    } else if (para.startsWith('> [!IMPORTANT]') || para.startsWith('> [!WARNING]') || para.startsWith('> [!NOTE]') || para.startsWith('> [!CAUTION]')) {
      const isImportant = para.startsWith('> [!IMPORTANT]') || para.startsWith('> [!WARNING]');
      const isCaution = para.startsWith('> [!CAUTION]');
      const typeClass = isImportant ? 'alert-important' : isCaution ? 'alert-caution' : 'alert-note';
      
      const cleaned = para.replace(/^>\s*\[!.*?\]\s*/, '').replace(/^>\s*/gm, '');
      const lines = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      
      const contentNodes: React.ReactNode[] = [];
      let currentList: React.ReactNode[] = [];
      let listKey = 0;
      
      lines.forEach((line, lineIdx) => {
        if (line.startsWith('* ') || line.startsWith('- ')) {
          const text = line.replace(/^[\*\-]\s+/, '');
          currentList.push(
            <li key={`li-${lineIdx}`} style={{ margin: '4px 0 4px 20px', listStyleType: 'disc', textIndent: 0 }}>
              {formatBoldText(text)}
            </li>
          );
        } else {
          if (currentList.length > 0) {
            contentNodes.push(<ul key={`ul-${listKey++}`} style={{ margin: '8px 0', paddingLeft: 0 }}>{currentList}</ul>);
            currentList = [];
          }
          contentNodes.push(
            <p key={`p-${lineIdx}`} style={{ margin: '6px 0', textIndent: 0 }}>
              {formatBoldText(line)}
            </p>
          );
        }
      });
      
      if (currentList.length > 0) {
        contentNodes.push(<ul key={`ul-${listKey++}`} style={{ margin: '8px 0', paddingLeft: 0 }}>{currentList}</ul>);
      }
      
      element = (
        <div 
          className={`${typeClass} ${isReading ? 'reading-highlight' : ''}`} 
          style={{ margin: '16px 0', width: '100%' }}
        >
          {contentNodes}
        </div>
      );
    } else if (para.includes('<img src=')) {
      const srcMatch = para.match(/src="([^"]+)"/);
      const altMatch = para.match(/alt="([^"]+)"/);
      if (srcMatch) {
        const imgSrc = srcMatch[1];
        element = (
          <div style={{ textAlign: 'center', margin: '15px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }} className={isReading ? 'reading-highlight' : ''}>
            <img 
              src={imgSrc} 
              alt={altMatch ? altMatch[1] : 'Illustration'} 
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation(); // prevent bars toggle
                setZoomImageSrc(imgSrc);
              }}
            />
            {altMatch && <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', fontStyle: 'italic', fontFamily: 'var(--font-sans)' }}>{altMatch[1]}</div>}
          </div>
        );
      }
    } else if (para.startsWith('* ') || para.startsWith('- ')) {
      const cleanText = para.replace(/^[\*\-]\s+/, '');
      element = (
        <p 
          className={`${isHighlighted ? 'highlight-text' : ''} ${isReading ? 'reading-highlight' : ''}`}
          style={{ margin: 0, width: '100%', paddingLeft: '20px', textIndent: '-14px' }}
        >
          • {formatBoldText(cleanText)}
        </p>
      );
    } else {
      const numberedMatch = para.match(/^(\d+\.\s+)(.*)/);
      if (numberedMatch) {
        const marker = numberedMatch[1];
        const cleanText = numberedMatch[2];
        element = (
          <p 
            className={`${isHighlighted ? 'highlight-text' : ''} ${isReading ? 'reading-highlight' : ''}`}
            style={{ margin: 0, width: '100%', paddingLeft: '24px', textIndent: '-18px' }}
          >
            <span style={{ fontWeight: '600', marginRight: '4px' }}>{marker}</span>{formatBoldText(cleanText)}
          </p>
        );
      } else {
        element = (
          <p 
            className={`${isHighlighted ? 'highlight-text' : ''} ${isReading ? 'reading-highlight' : ''}`}
            style={{ margin: 0, width: '100%' }}
          >
            {formatBoldText(para)}
          </p>
        );
      }
    }

    if (!element) return null;

    return (
      <div 
        key={idx} 
        id={`reader-para-${idx}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedParaMenuIndex(selectedParaMenuIndex === idx ? null : idx);
        }}
        style={{ 
          display: 'block', 
          width: '100%', 
          cursor: 'pointer',
          marginBottom: '14px',
          position: 'relative'
        }}
      >
        {element}
        {selectedParaMenuIndex === idx && (
          <div 
            onClick={(e) => e.stopPropagation()} 
            style={{ 
              display: 'inline-flex', 
              gap: '10px', 
              backgroundColor: 'var(--primary-light)', 
              padding: '5px 10px', 
              borderRadius: '16px', 
              marginTop: '6px', 
              fontSize: '11px', 
              border: '1px solid var(--border)',
              alignItems: 'center',
              boxShadow: 'var(--shadow-sm)',
              zIndex: 30
            }}
          >
            <button 
              style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              onClick={() => {
                onToggleHighlight(activeSectionId, idx);
                setSelectedParaMenuIndex(null);
              }}
            >
              🖍️ {isHighlighted ? 'Unhighlight' : 'Highlight'}
            </button>
            <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border)' }} />
            <button 
              style={{ border: 'none', background: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              onClick={() => {
                playWithVoice(selectedVoiceName, idx);
                setSelectedParaMenuIndex(null);
              }}
            >
              🔊 Read Here
            </button>
            <div style={{ width: '1px', height: '12px', backgroundColor: 'var(--border)' }} />
            <button 
              style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0 2px' }}
              onClick={() => setSelectedParaMenuIndex(null)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    );
  };

  // Touch handlers for swipes
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    
    // Swipe left (next page) or right (previous page)
    if (diffX < -50) {
      handleNextColumn();
    } else if (diffX > 50) {
      handlePrevColumn();
    }
    touchStartX.current = null;
  };

  // Toggle bars visibility when tapping the middle 70% of screen
  const handleMiddleTap = () => {
    setBarsVisible(!barsVisible);
  };

  const globalPageNumber = currentSection.start_page + currentPageIndex;
  const totalBookPages = bookData[bookData.length - 1].end_page;
  const globalProgressPct = ((globalPageNumber / totalBookPages) * 100).toFixed(0);

  return (
    <div className="reader-shell" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, position: 'relative', overflow: 'hidden' }}>
      
      {/* 1. Header Toolbar (Toggleable) */}
      {barsVisible && (
        <div className="header-bar fade-in-up" style={{ padding: '8px 16px', height: '48px', flexShrink: 0, position: 'absolute', top: 0, left: 0, width: '100%', zIndex: 100 }}>
          <button className="nav-item" style={{ height: 'auto', flex: 'none' }} onClick={() => setShowChapters(!showChapters)}>
            <List size={20} />
          </button>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentSection.chapter_title.replace(/^Chapter \d+:\s*/, '')}
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button className="nav-item" style={{ height: 'auto', flex: 'none' }} onClick={() => setShowSearch(!showSearch)}>
              <Search size={20} />
            </button>
            <button className="nav-item" style={{ height: 'auto', flex: 'none' }} onClick={() => setShowSettings(!showSettings)}>
              <Type size={20} />
            </button>
            <button className="nav-item" style={{ height: 'auto', flex: 'none' }} onClick={() => onToggleBookmark(activeSectionId)}>
              {isBookmarked ? <BookmarkCheck size={20} style={{ color: 'var(--accent)' }} /> : <Bookmark size={20} />}
            </button>
          </div>
        </div>
      )}

      {/* 2. Reading Content Area */}
      {readingMode === 'pdf' ? (
        /* Original PDF Mode */
        <div 
          style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: 0,
            marginTop: barsVisible ? '48px' : '0px',
            transition: 'margin-top 0.3s'
          }}
        >
          {/* PDF chapter header */}
          <div className="kindle-header">
            {currentSection.chapter_title.replace(/^Chapter \d+:\s*/, '')}
          </div>

          <PdfReader
            pdfUrl={`/book.pdf?v=${import.meta.env.VITE_BOOK_PDF_VERSION}`}
            currentPage={pdfPage}
            onPageChange={(page) => {
              setPdfPage(page);
              localStorage.setItem('parenting_app_pdf_page', String(page));
            }}
            onDocumentLoad={(numPages) => setPdfTotalPages(numPages)}
            onToggleBars={() => setBarsVisible(!barsVisible)}
          />

          {/* PDF Footer with audio and notes */}
          <div className="kindle-footer">
            <button 
              style={{ border: 'none', background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}
              onClick={() => setShowAudioDrawer(true)}
            >
              <Headphones size={13} /> Audio
            </button>
            
            <div style={{ fontWeight: '500' }}>
              Pg {pdfPage} of {pdfTotalPages || '...'}
            </div>

            <button 
              style={{ border: 'none', background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}
              onClick={() => setShowNotesDrawer(true)}
            >
              <Edit size={13} /> Notes
            </button>
          </div>
        </div>
      ) : readingMode === 'scroll' ? (
        /* PDF Continuous Scroll Style */
        <div 
          ref={readerScrollRef}
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollBehavior: 'smooth',
            padding: '24px 20px 100px 20px', 
            marginTop: barsVisible ? '48px' : '0px', 
            transition: 'margin-top 0.3s',
            backgroundColor: 'var(--card-bg)',
            marginLeft: '16px',
            marginRight: '16px',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: 'var(--shadow-md)'
          }}
          onClick={handleMiddleTap}
        >
          <div className="reader-content">
            <h2 style={{ borderBottom: 'none', marginBottom: '20px', textAlign: 'center' }}>
              {currentSection.section_title}
            </h2>
            {paragraphs.map((p, idx) => renderParagraph(p, idx))}
          </div>

          {/* Section Navigation Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '30px', justifyContent: 'space-between' }}>
            <button 
              className="btn-secondary" 
              style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px' }}
              onClick={(e) => {
                e.stopPropagation();
                if (activeIndex > 0) {
                  onNavigateToSection(bookData[activeIndex - 1].id);
                }
              }}
              disabled={activeIndex === 0}
            >
              ⬅️ Prev Chapter
            </button>
            <button 
              className="btn-primary" 
              style={{ flex: 1, padding: '10px', borderRadius: '8px', fontSize: '12px' }}
              onClick={(e) => {
                e.stopPropagation();
                if (activeIndex < bookData.length - 1) {
                  onNavigateToSection(bookData[activeIndex + 1].id);
                }
              }}
              disabled={activeIndex === bookData.length - 1}
            >
              Next Chapter ➡️
            </button>
          </div>
          
          {/* Quick Info bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '12px', borderTop: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-muted)' }}>
            <button 
              style={{ border: 'none', background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setShowAudioDrawer(true); }}
            >
              <Headphones size={13} /> Audio
            </button>
            <div style={{ fontWeight: '500' }}>
              Pg {currentSection.start_page} of {totalBookPages}
            </div>
            <button 
              style={{ border: 'none', background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
              onClick={(e) => { e.stopPropagation(); setShowNotesDrawer(true); }}
            >
              <Edit size={13} /> Notes
            </button>
          </div>
        </div>
      ) : (
        /* Paginated Book Page Frame Style (Kindle) */
        <div 
          className="kindle-frame" 
          style={{ 
            marginTop: barsVisible ? '56px' : '16px', 
            height: barsVisible ? 'calc(100vh - 192px)' : 'calc(100vh - 128px)',
            transition: 'margin-top 0.3s, height 0.3s'
          }}
        >
          {/* Book Header */}
          <div className="kindle-header">
            {currentSection.chapter_title.replace(/^Chapter \d+:\s*/, '')}
          </div>

          {/* Reading Body with Grid: [prev-btn] [content] [next-btn] */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: '40px minmax(0, 1fr) 40px',
              gap: '0px',
              flex: 1,
              minHeight: 0,
              alignItems: 'stretch',
              position: 'relative'
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Left page nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!(currentPageIndex === 0 && activeIndex === 0) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handlePrevColumn(); }}
                  title="Previous Page"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
              )}
            </div>

            {/* Center: reading content */}
            <div 
              className="kindle-body"
              onClick={handleMiddleTap}
              style={{ position: 'relative', overflow: 'hidden', minHeight: 0 }}
            >
              <div className="kindle-columns-container">
                <div 
                  ref={columnsRef}
                  className="kindle-columns reader-content"
                  style={{
                    transform: `translateX(calc(-${currentPageIndex} * (100% + 32px)))`
                  }}
                >
                  {paragraphs.map((p, idx) => renderParagraph(p, idx))}
                </div>
              </div>
            </div>

            {/* Right page nav */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!(currentPageIndex === totalPages - 1 && activeIndex === bookData.length - 1) && (
                <button 
                  onClick={(e) => { e.stopPropagation(); handleNextColumn(); }}
                  title="Next Page"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    border: '1px solid var(--border)',
                    background: 'var(--card-bg)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    flexShrink: 0
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Book Footer */}
          <div className="kindle-footer">
            <button 
              style={{ border: 'none', background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}
              onClick={() => setShowAudioDrawer(true)}
            >
              <Headphones size={13} /> Audio
            </button>
            
            <div style={{ fontWeight: '500' }}>
              Pg {globalPageNumber} of {totalBookPages} ({globalProgressPct}%)
            </div>

            <button 
              style={{ border: 'none', background: 'none', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '11px' }}
              onClick={() => setShowNotesDrawer(true)}
            >
              <Edit size={13} /> Notes
            </button>
          </div>
        </div>
      )}

      {/* 3. Sliding Drawer Overlay: Audio TTS Controls */}
      {showAudioDrawer && (
        <div className="modal-overlay" onClick={() => setShowAudioDrawer(false)} style={{ zIndex: 150 }}>
          <div className="modal-content fade-in-up" onClick={e => e.stopPropagation()} style={{ height: 'auto', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>🔊 Audio Reading Mode</h3>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setShowAudioDrawer(false)}>
                <X size={18} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>
                Select Reader Voice:
              </label>
              <select 
                className="input-text" 
                value={selectedVoiceName}
                onChange={e => handleVoiceChange(e.target.value)}
                style={{ 
                  borderRadius: '8px', 
                  fontSize: '12.5px', 
                  padding: '8px',
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--card-bg)',
                  color: 'var(--text)',
                  outline: 'none'
                }}
              >
                {availableVoices.length > 0 ? (
                  availableVoices.map(v => (
                    <option key={v.name} value={v.name}>
                      {v.name} ({v.lang})
                    </option>
                  ))
                ) : (
                  <option value="">No English voices detected</option>
                )}
              </select>
            </div>

            <button 
              className="btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '10px', backgroundColor: isPlaying ? 'var(--accent)' : 'var(--primary)' }}
              onClick={handleToggleAudio}
            >
              {isPlaying ? (
                <>
                  <Square size={16} fill="white" /> Stop Audio
                </>
              ) : (
                <>
                  <Volume2 size={16} /> Listen to Chapter
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {isPlaying && !showAudioDrawer && (
        <button
          type="button"
          className="audio-stop-fab"
          onClick={handleToggleAudio}
          aria-label="Stop audio reading"
        >
          <Square size={12} fill="currentColor" />
          Stop audio
        </button>
      )}

      {/* 4. Sliding Drawer Overlay: Page Notes */}
      {showNotesDrawer && (
        <div className="modal-overlay" onClick={() => setShowNotesDrawer(false)} style={{ zIndex: 150 }}>
          <div className="modal-content fade-in-up" onClick={e => e.stopPropagation()} style={{ height: 'auto', borderTopLeftRadius: '20px', borderTopRightRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '700' }}>📝 Personal Page Notes</h3>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer' }} onClick={() => setShowNotesDrawer(false)}>
                <X size={18} />
              </button>
            </div>

            <textarea 
              className="input-text" 
              rows={4} 
              placeholder="Record baby milestones, diaper count reminders, or questions to ask your pediatrician..." 
              value={noteInput}
              onChange={e => setNoteInput(e.target.value)}
              style={{ borderRadius: '8px', fontSize: '13px', marginBottom: '12px' }}
            />
            
            <button 
              className="btn-primary" 
              style={{ width: '100%', padding: '10px', borderRadius: '8px' }}
              onClick={() => {
                onSaveNote(activeSectionId, noteInput);
                setShowNotesDrawer(false);
              }}
            >
              Save Page Note
            </button>
          </div>
        </div>
      )}

      {/* Table of Contents Overlay */}
      {showChapters && (
        <div className="modal-overlay" onClick={() => setShowChapters(false)} style={{ zIndex: 150 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ height: '70%', paddingBottom: '0' }}>
            <h2 style={{ fontSize: '18px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>Table of Contents</h2>
            <div style={{ overflowY: 'auto', flex: 1, paddingBottom: '20px' }}>
              {bookData.map((sec) => {
                const isCurrent = sec.id === activeSectionId;
                const isChapterHeader = sec.section_title === "Overview";
                
                return (
                  <div 
                    key={sec.id}
                    className={`btn-secondary ${isCurrent ? 'active' : ''}`}
                    style={{ 
                      padding: '12px 8px',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      borderRadius: '0',
                      textAlign: 'left',
                      fontWeight: isCurrent ? '700' : (isChapterHeader ? '600' : '400'),
                      color: isCurrent ? 'var(--primary)' : (isChapterHeader ? 'var(--text-heading)' : 'var(--text)'),
                      paddingLeft: isChapterHeader ? '8px' : '24px',
                      backgroundColor: isCurrent ? 'var(--primary-light)' : 'transparent',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      onNavigateToSection(sec.id);
                      setShowChapters(false);
                    }}
                  >
                    {isChapterHeader ? sec.chapter_title : sec.section_title}
                    <span style={{ float: 'right', fontSize: '11px', color: 'var(--text-muted)' }}>Pg {sec.start_page}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Settings Overlay */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)} style={{ zIndex: 150 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ height: 'auto' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '16px' }}>Reading Display Settings</h2>
            
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>THEME</div>
              <div className="theme-panel">
                <button className={`theme-opt opt-light ${theme === 'light' ? 'active' : ''}`} onClick={() => onChangeTheme('light')} title="Light Mode" />
                <button className={`theme-opt opt-sepia ${theme === 'sepia' ? 'active' : ''}`} onClick={() => onChangeTheme('sepia')} title="Sepia Mode (Kindle)" />
                <button className={`theme-opt opt-sage ${theme === 'sage' ? 'active' : ''}`} onClick={() => onChangeTheme('sage')} title="Calm Sage Mode" />
                <button className={`theme-opt opt-dark ${theme === 'dark' ? 'active' : ''}`} onClick={() => onChangeTheme('dark')} title="Dark Mode" />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>FONT SIZE</div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                <button className={`font-size-btn ${fontSize === 'small' ? 'active' : ''}`} onClick={() => onChangeFontSize('small')}>A-</button>
                <button className={`font-size-btn ${fontSize === 'medium' ? 'active' : ''}`} onClick={() => onChangeFontSize('medium')}>Default</button>
                <button className={`font-size-btn ${fontSize === 'large' ? 'active' : ''}`} onClick={() => onChangeFontSize('large')}>A+</button>
                <button className={`font-size-btn ${fontSize === 'xlarge' ? 'active' : ''}`} onClick={() => onChangeFontSize('xlarge')}>A++</button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>READING MODE</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button 
                  className={`font-size-btn ${readingMode === 'paginated' ? 'active' : ''}`} 
                  onClick={() => handleReadingModeChange('paginated')}
                  style={{ flex: 1, padding: '8px', fontSize: '11px', minWidth: '90px' }}
                >
                  📖 Book Pages
                </button>
                <button 
                  className={`font-size-btn ${readingMode === 'scroll' ? 'active' : ''}`} 
                  onClick={() => handleReadingModeChange('scroll')}
                  style={{ flex: 1, padding: '8px', fontSize: '11px', minWidth: '90px' }}
                >
                  📜 Scroll
                </button>
                <button 
                  className={`font-size-btn ${readingMode === 'pdf' ? 'active' : ''}`} 
                  onClick={() => {
                    handleReadingModeChange('pdf');
                    // Jump PDF to current section's start page
                    setPdfPage(currentSection.start_page);
                  }}
                  style={{ flex: 1, padding: '8px', fontSize: '11px', minWidth: '90px' }}
                >
                  📄 Original PDF
                </button>
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', borderRadius: '12px' }} onClick={() => setShowSettings(false)}>
              Done
            </button>
          </div>
        </div>
      )}

      {/* Book Search overlay */}
      {showSearch && (
        <div className="modal-overlay" onClick={() => setShowSearch(false)} style={{ zIndex: 150 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ height: '80%' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Search Inside Book</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="text" 
                className="input-text" 
                placeholder="Search word or topic..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ borderRadius: '12px' }}
              />
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {searchQuery ? (
                filteredChapters.length > 0 ? (
                  filteredChapters.map(sec => (
                    <div 
                      key={sec.id}
                      className="btn-secondary"
                      style={{ padding: '12px', borderRadius: '12px', marginBottom: '10px', textAlign: 'left' }}
                      onClick={() => {
                        onNavigateToSection(sec.id);
                        setShowSearch(false);
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '14px', color: 'var(--text-heading)' }}>{sec.section_title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sec.chapter_title} • Page {sec.start_page}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>No matches found inside the book.</div>
                )
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>Type above to search across all chapters.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Fullscreen Zoom Image Modal */}
      {zoomImageSrc && (
        <div 
          className="modal-overlay" 
          onClick={() => setZoomImageSrc(null)} 
          style={{ 
            zIndex: 300, 
            backgroundColor: 'rgba(0, 0, 0, 0.95)', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: '20px'
          }}
        >
          {/* Close button */}
          <button 
            style={{ 
              position: 'absolute', 
              top: '20px', 
              right: '20px', 
              border: 'none', 
              background: 'rgba(255,255,255,0.2)', 
              color: '#fff', 
              width: '40px', 
              height: '40px', 
              borderRadius: '50%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer',
              zIndex: 310
            }}
            onClick={() => setZoomImageSrc(null)}
          >
            <X size={24} />
          </button>

          {/* Full-size Scrollable image container */}
          <div 
            style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              overflow: 'auto',
              cursor: 'zoom-out'
            }}
          >
            <img 
              src={zoomImageSrc} 
              alt="Zoomed Illustration" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: '100%', 
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
              }} 
            />
          </div>
          
          <div style={{ position: 'absolute', bottom: '20px', color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontFamily: 'var(--font-sans)', textAlign: 'center' }}>
            🔍 Pinch or drag to scroll. Tap anywhere to close.
          </div>
        </div>
      )}

    </div>
  );
};
