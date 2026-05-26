import React, { useState, useEffect } from 'react';
import { X, Download, File as FileIcon, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { api } from '../../api';
import { Document, Page, pdfjs } from 'react-pdf';
import { useInView } from 'react-intersection-observer';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const LazyPdfPage = ({ pageNumber, width }) => {
  const { ref, inView } = useInView({ rootMargin: '100px 0px', triggerOnce: false });
  return (
    <div ref={ref} style={{ minHeight: '800px', marginBottom: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
      {inView ? (
        <Page 
          pageNumber={pageNumber} 
          renderTextLayer={false} 
          renderAnnotationLayer={false} 
          width={width} 
          className="shadow-lg" 
          renderMode="canvas" 
        />
      ) : (
        <div style={{ height: '800px', width: width, background: '#444', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
          Загрузка страницы {pageNumber}...
        </div>
      )}
    </div>
  );
};

export const DocumentViewer = ({ file, isOpen, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isOpen || !file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const fileUrl = `${api.getDocumentUrl(file.id)}?inline=true`;

  return (
    <div 
      style={{ 
        position: 'fixed', 
        top: 0, left: 0, right: 0, bottom: 0, 
        background: 'rgba(0,0,0,0.85)', 
        backdropFilter: 'blur(5px)',
        zIndex: 9999, 
        display: 'flex', 
        flexDirection: 'column' 
      }}
    >
      {/* Header */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '1rem', 
          background: 'rgba(0,0,0,0.6)', 
          color: 'white',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
          <FileIcon size={20} className="flex-shrink-0" />
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {file.originalName}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <a 
            href={api.getDocumentUrl(file.id)} 
            className="btn btn-outline" 
            style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)', padding: '0.4rem 0.8rem' }} 
            title="Скачать"
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Download size={16} /> <span className="hidden sm:inline ml-1">Скачать</span>
          </a>
          <button 
            className="btn btn-icon" 
            style={{ color: 'white', background: 'rgba(255,255,255,0.1)' }} 
            onClick={onClose}
            title="Закрыть"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '1rem', overflow: 'auto' }}>
        {isImage ? (
          <TransformWrapper
            initialScale={1}
            minScale={0.5}
            maxScale={5}
            centerOnInit
            wheel={{ step: 0.1 }}
          >
            {({ zoomIn, zoomOut, resetTransform }) => (
              <>
                <div style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.6)', padding: '0.5rem', borderRadius: '2rem', zIndex: 10, backdropFilter: 'blur(4px)' }}>
                  <button className="btn btn-icon" style={{ color: 'white', border: 'none' }} onClick={() => zoomOut()}><ZoomOut size={20} /></button>
                  <button className="btn btn-icon" style={{ color: 'white', border: 'none' }} onClick={() => resetTransform()}><RotateCcw size={20} /></button>
                  <button className="btn btn-icon" style={{ color: 'white', border: 'none' }} onClick={() => zoomIn()}><ZoomIn size={20} /></button>
                </div>
                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                  <img 
                    src={fileUrl} 
                    alt={file.originalName} 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: 'calc(100vh - 150px)', 
                      objectFit: 'contain', 
                      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                      borderRadius: '4px'
                    }} 
                  />
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <Document
              file={{ url: fileUrl, withCredentials: true }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              loading={<div className="text-white p-8 flex items-center gap-3"><div className="animate-spin border-2 border-white border-t-transparent rounded-full w-5 h-5"></div> Загрузка PDF...</div>}
              error={<div className="text-danger p-8 bg-white rounded">Ошибка при загрузке PDF. Пожалуйста, скачайте файл.</div>}
            >
              {Array.from(new Array(numPages || 0), (el, index) => (
                <LazyPdfPage 
                  key={`page_${index + 1}`} 
                  pageNumber={index + 1} 
                  width={Math.min(windowWidth * 0.95, 1000)} 
                />
              ))}
            </Document>
          </div>
        )}
      </div>
    </div>
  );
};
