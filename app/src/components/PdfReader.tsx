import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { ChevronLeft, ChevronRight, Download, ExternalLink, ZoomIn, ZoomOut, Maximize } from 'lucide-react';

// Configure PDF.js worker locally
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

interface PdfReaderProps {
  pdfUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onDocumentLoad: (numPages: number) => void;
  onToggleBars: () => void;
}

const PdfReader: React.FC<PdfReaderProps> = ({
  pdfUrl,
  currentPage,
  onPageChange,
  onDocumentLoad,
  onToggleBars
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1);
  const [fitWidth, setFitWidth] = useState<number>(1);
  const [pageRendered, setPageRendered] = useState(false);
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setLoadError(null);
    setPdfData(null);
    setNumPages(null);
    setPageRendered(false);
    
    fetch(pdfUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.arrayBuffer();
      })
      .then(buffer => {
        setPdfData(buffer);
      })
      .catch(err => {
        setLoadError(err.message || 'Failed to fetch PDF data');
        setIsLoading(false);
      });
  }, [pdfUrl]);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  // Calculate fit-to-width scale when container or page loads
  const calculateFitWidth = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    // The container is the scrollable area; compute available width minus padding
    const availableWidth = container.clientWidth - 16; // 8px padding each side
    // Default PDF page width is ~612pt (US Letter). We'll adjust on page load.
    const defaultPageWidth = 612;
    const newFitWidth = availableWidth / defaultPageWidth;
    setFitWidth(newFitWidth);
    setScale(newFitWidth);
  }, []);

  useEffect(() => {
    calculateFitWidth();
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      const handleResize = () => calculateFitWidth();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    // The app shell becomes wider when Reader opens on desktop. Watching the
    // actual page container keeps fit-to-width accurate even when the browser
    // viewport itself did not resize.
    const resizeObserver = new ResizeObserver(() => calculateFitWidth());
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [calculateFitWidth]);

  const handleDocumentLoadSuccess = ({ numPages: total }: { numPages: number }) => {
    setNumPages(total);
    setIsLoading(false);
    onDocumentLoad(total);
    // Recalculate fit after load
    setTimeout(calculateFitWidth, 100);
  };

  const handleDocumentLoadError = (error: Error) => {
    setLoadError(error.message || 'Failed to load PDF');
    setIsLoading(false);
  };

  const handlePageRenderSuccess = () => {
    setPageRendered(true);
  };

  // Navigation
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setPageRendered(false);
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (numPages && currentPage < numPages) {
      setPageRendered(false);
      onPageChange(currentPage + 1);
    }
  };

  // Zoom
  const zoomIn = () => setScale(prev => Math.min(3, prev + 0.25));
  const zoomOut = () => setScale(prev => Math.max(0.5, prev - 0.25));
  const resetZoom = () => setScale(fitWidth);

  // Touch swipe for page navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    const diffY = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger page swipe if horizontal movement is dominant
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
      if (diffX < -60) {
        goToNextPage();
      } else if (diffX > 60) {
        goToPrevPage();
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const zoomPercent = Math.round((scale / fitWidth) * 100);

  return (
    <div className="pdf-reader-frame">
      <div className="pdf-file-actions" onClick={(event) => event.stopPropagation()}>
        <a className="pdf-file-action-btn" href={pdfUrl} target="_blank" rel="noopener noreferrer" title="Open PDF">
          <ExternalLink size={13} />
        </a>
        <a className="pdf-file-action-btn" href={pdfUrl} download="Ameys_Book.pdf" title="Download PDF">
          <Download size={13} />
        </a>
      </div>
      {/* PDF Page Grid: [‹] [page] [›] */}
      <div 
        className="pdf-page-grid"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Left arrow gutter */}
        <div className="pdf-nav-gutter">
          {currentPage > 1 && (
            <button
              className="pdf-nav-btn"
              onClick={goToPrevPage}
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Center: PDF page */}
        <div 
          ref={containerRef}
          className="pdf-page-container"
          onClick={onToggleBars}
        >
          {isLoading && !loadError && (
            <div className="pdf-loading-state">
              <div className="pdf-loading-spinner" />
              <div style={{ marginTop: '16px', fontWeight: '600', fontSize: '14px', color: 'var(--text-heading)' }}>
                Loading Original PDF...
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', maxWidth: '280px' }}>
                The original book PDF is ~43 MB. This may take a few seconds on the first load.
              </div>
            </div>
          )}

          {loadError && (
            <div className="pdf-loading-state">
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄❌</div>
              <div style={{ fontWeight: '600', color: 'var(--text-heading)' }}>Failed to load PDF</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{loadError}</div>
            </div>
          )}

          {pdfData && (
            <Document
              file={pdfData}
              onLoadSuccess={handleDocumentLoadSuccess}
              onLoadError={handleDocumentLoadError}
              loading={null}
            >
              {numPages && (
                <Page
                  pageNumber={currentPage}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  onRenderSuccess={handlePageRenderSuccess}
                  loading={
                    <div className="pdf-page-placeholder">
                      <div className="pdf-loading-spinner" />
                    </div>
                  }
                />
              )}
            </Document>
          )}

          {/* Floating Zoom Pill */}
          {!isLoading && pdfData && (
            <div className="pdf-floating-zoom-bar">
              <button className="pdf-zoom-btn-mini" onClick={zoomOut} title="Zoom Out" disabled={scale <= 0.5}>
                <ZoomOut size={12} />
              </button>
              <span style={{ fontSize: '11px', fontWeight: '700', minWidth: '36px', textAlign: 'center', color: 'var(--text-heading)' }}>
                {zoomPercent}%
              </span>
              <button className="pdf-zoom-btn-mini" onClick={zoomIn} title="Zoom In" disabled={scale >= 3}>
                <ZoomIn size={12} />
              </button>
              <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border)', margin: '0 4px' }} />
              <button className="pdf-zoom-btn-mini" onClick={resetZoom} title="Fit to Width">
                <Maximize size={12} />
              </button>
            </div>
          )}

          {/* Page rendered overlay fade-in */}
          {!pageRendered && numPages && !isLoading && (
            <div className="pdf-page-loading-overlay">
              <div className="pdf-loading-spinner" />
            </div>
          )}
        </div>

        {/* Right arrow gutter */}
        <div className="pdf-nav-gutter">
          {numPages && currentPage < numPages && (
            <button
              className="pdf-nav-btn"
              onClick={goToNextPage}
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfReader;
