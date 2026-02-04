
import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Trash2, Download, Maximize2 } from 'lucide-react';
import { ImageItem } from '../types';
import { dbService } from '../services/db';

interface TaskImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  images: ImageItem[];
  onDeleteImage?: (imageId: string) => void;
}

export const TaskImagesModal: React.FC<TaskImagesModalProps> = ({ isOpen, onClose, title, images, onDeleteImage }) => {
  const [fullscreenImage, setFullscreenImage] = useState<ImageItem | null>(null);
  const [resolvedImages, setResolvedImages] = useState<ImageItem[]>([]);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      const loadImages = async () => {
        const loaded = await Promise.all(images.map(async (img) => {
          // Check if it's a reference
          if (img.url && img.url.startsWith('ref:')) {
            const imageId = img.url.split(':')[1];
            setLoadingMap(prev => ({ ...prev, [img.id]: true }));
            const realContent = await dbService.getTopicImage(imageId);
            setLoadingMap(prev => ({ ...prev, [img.id]: false }));
            if (realContent) {
              return { ...img, url: realContent };
            }
          }
          return img;
        }));
        setResolvedImages(loaded);
      };
      loadImages();
    }
  }, [isOpen, images]);

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" 
        onClick={onClose}
      >
        <div 
          className="glass-panel bg-[#050b07]/95 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-white/10 flex flex-col max-h-[80vh]"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
            <div className="flex items-center gap-2 min-w-0">
               <ImageIcon className="w-4 h-4 text-lime-400 flex-shrink-0" />
               <h3 className="font-bold text-white truncate text-sm sm:text-base">{title}</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-white/10 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 overflow-y-auto custom-scrollbar grid grid-cols-2 gap-3">
            {images.length === 0 ? (
              <div className="col-span-2 text-slate-500 text-center py-8 text-xs italic">No images attached</div>
            ) : (
              resolvedImages.map((img) => (
                <div 
                  key={img.id} 
                  className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-square cursor-pointer hover:border-lime-500/50 transition-colors"
                  onClick={() => !loadingMap[img.id] && setFullscreenImage(img)}
                >
                   {loadingMap[img.id] ? (
                     <div className="w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-lime-500 border-t-transparent rounded-full animate-spin"></div>
                     </div>
                   ) : (
                     <img 
                       src={img.url} 
                       alt="Task attachment" 
                       className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                     />
                   )}
                   
                   {/* Overlay Actions */}
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        className="p-2 bg-white/10 rounded-full text-white pointer-events-none"
                      >
                         <Maximize2 className="w-5 h-5 opacity-70" />
                      </button>
                      
                      <div className="absolute top-2 right-2 flex gap-2">
                        <a 
                          href={img.url} 
                          download={`attachment-${img.id}.jpg`}
                          className="p-1.5 bg-black/50 rounded-lg hover:bg-lime-500 hover:text-black text-white transition-colors backdrop-blur-sm border border-white/10"
                          title="Download"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        {onDeleteImage && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteImage(img.id); }}
                            className="p-1.5 bg-black/50 rounded-lg hover:bg-rose-500 hover:text-white text-rose-400 transition-colors backdrop-blur-sm border border-white/10"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                   </div>
                   
                   <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                     <p className="text-[9px] text-slate-300 text-center font-mono">
                       {new Date(img.createdAt).toLocaleDateString()}
                     </p>
                   </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Full Screen Viewer */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/98 backdrop-blur-xl animate-in fade-in zoom-in duration-300"
          onClick={() => setFullscreenImage(null)}
        >
          <button 
             className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-[70]"
             onClick={() => setFullscreenImage(null)}
          >
             <X className="w-6 h-6" />
          </button>

          <img 
            src={fullscreenImage.url} 
            alt="Full screen view" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl p-2 sm:p-4"
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
             <a 
                href={fullscreenImage.url} 
                download={`attachment-${fullscreenImage.id}.jpg`}
                className="px-4 py-2 bg-white/10 hover:bg-lime-500 hover:text-black text-white rounded-full backdrop-blur-md border border-white/10 font-bold text-sm flex items-center gap-2 transition-colors"
                onClick={(e) => e.stopPropagation()}
             >
                <Download className="w-4 h-4" /> Download
             </a>
             {onDeleteImage && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    if(confirm('Delete this image?')) {
                        onDeleteImage(fullscreenImage.id);
                        setFullscreenImage(null);
                    }
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-rose-600 hover:text-white text-rose-400 rounded-full backdrop-blur-md border border-white/10 font-bold text-sm flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
             )}
          </div>
        </div>
      )}
    </>
  );
};
