import React, { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { toPng } from 'html-to-image';
import { 
  Type, Layers, Save, Download, Undo, Redo, Sparkles,
  Trash2, Ruler, Image as LucideImage, Bot, Loader2,
  Wand2, Shapes, Plus, Maximize2, RotateCw, GripVertical,
  FlipHorizontal, FlipVertical, Copy, X, Check, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight, Command, ZoomIn, ZoomOut, Maximize, RotateCcw
} from 'lucide-react';


const InteractiveNode = ({ 
  element, 
  isSelected,
  isAICapturing,
  onSelect, 
  onChange, 
  onDuplicate, 
  onDelete, 
  onBringToFront, 
  onSendToBack, 
  onDragStart,
  zoomScale,
  resources 
}) => {
  const nodeRef = useRef(null);
  const innerTextRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startPointerRef = useRef({ x: 0, y: 0 });
  const startElPosRef = useRef({ xCm: 0, yCm: 0, widthCm: 0, heightCm: 0, fontSize: 0, rotation: 0, angleOffset: 0 });
  const activeMode = useRef(null);

  const [textDim, setTextDim] = useState({ w: 0, h: 0 });
  const [activePopover, setActivePopover] = useState(null); // 'size' | 'flip' | 'rotate' | null
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!isSelected) {
      setActivePopover(null);
      setShowContextMenu(false);
    }
  }, [isSelected]);

  useEffect(() => {
    if (element.type === 'text' && innerTextRef.current && isSelected) {
      const w = innerTextRef.current.offsetWidth;
      const h = innerTextRef.current.offsetHeight;
      setTextDim({
        w: w / zoomScale,
        h: h / zoomScale
      });
    }
  }, [element.text, element.fontSize, element.fontFamily, zoomScale, isSelected]);

  const handlePointerDown = (e, mode = 'drag') => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();
    onSelect();
    
    if (onDragStart) onDragStart();

    setMousePos({ x: e.clientX, y: e.clientY });

    if (mode === 'drag') {
      setShowContextMenu(false);
    }

    if (mode.startsWith('resize')) {
      setIsResizing(true);
    }

    if (mode === 'rotate') {
      setIsRotating(true);
    }
    
    isDraggingRef.current = true;
    activeMode.current = mode;
    startPointerRef.current = { x: e.clientX, y: e.clientY };
    
    startElPosRef.current = {
      xCm: element.xCm,
      yCm: element.yCm,
      widthCm: element.widthCm || 50,
      heightCm: element.heightCm || 50,
      fontSize: element.fontSize || 10,
      rotation: element.rotation || 0,
      angleOffset: undefined
    };

    const handlePointerMove = (moveEvt) => {
      if (!isDraggingRef.current) return;
      
      setMousePos({ x: moveEvt.clientX, y: moveEvt.clientY });

      const dxScreen = moveEvt.clientX - startPointerRef.current.x;
      const dyScreen = moveEvt.clientY - startPointerRef.current.y;
      
      const dxCm = dxScreen / zoomScale;
      const dyCm = dyScreen / zoomScale;

      if (activeMode.current === 'drag') {
        onChange({
          ...element,
          xCm: startElPosRef.current.xCm + dxCm,
          yCm: startElPosRef.current.yCm + dyCm
        });
      } else if (activeMode.current.startsWith('resize')) {
        const handleType = activeMode.current;
        
        const rad = (startElPosRef.current.rotation * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        
        const localDx = (dxCm * cos + dyCm * sin);
        const localDy = (-dxCm * sin + dyCm * cos);

        let newW = startElPosRef.current.widthCm;
        let newH = startElPosRef.current.heightCm;

        if (handleType === 'resize-se') {
          newW = Math.max(1, startElPosRef.current.widthCm + localDx);
          newH = Math.max(1, startElPosRef.current.heightCm + localDy);
        } else if (handleType === 'resize-sw') {
          newW = Math.max(1, startElPosRef.current.widthCm - localDx);
          newH = Math.max(1, startElPosRef.current.heightCm + localDy);
        } else if (handleType === 'resize-ne') {
          newW = Math.max(1, startElPosRef.current.widthCm + localDx);
          newH = Math.max(1, startElPosRef.current.heightCm - localDy);
        } else if (handleType === 'resize-nw') {
          newW = Math.max(1, startElPosRef.current.widthCm - localDx);
          newH = Math.max(1, startElPosRef.current.heightCm - localDy);
        }

        // --- SI SE PRESIONA SHIFT: MANTENER PROPORCIÓN DE LA IMAGEN ---
        if (moveEvt.shiftKey && startElPosRef.current.heightCm > 0) {
          const aspectRatio = startElPosRef.current.widthCm / startElPosRef.current.heightCm;
          newH = newW / aspectRatio;
        }

        if (element.type === 'image') {
          onChange({ ...element, widthCm: newW, heightCm: newH });
        } else if (element.type === 'text') {
          const scaleFactor = Math.max(0.1, newW / (startElPosRef.current.widthCm || 1));
          const newSize = Math.max(0.5, startElPosRef.current.fontSize * scaleFactor);
          onChange({ ...element, fontSize: newSize });
        }
      
      } else if (activeMode.current === 'rotate') {
        if (!nodeRef.current) return;
        const rect = nodeRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const currentAngle = Math.atan2(moveEvt.clientY - centerY, moveEvt.clientX - centerX) * (180 / Math.PI);
        
        if (startElPosRef.current.angleOffset === undefined) {
          const initialAngle = Math.atan2(startPointerRef.current.y - centerY, startPointerRef.current.x - centerX) * (180 / Math.PI);
          startElPosRef.current.angleOffset = startElPosRef.current.rotation - initialAngle;
        }
        
        let newRotation = currentAngle + startElPosRef.current.angleOffset;
        newRotation = ((newRotation % 360) + 360) % 360;
        
        onChange({ ...element, rotation: newRotation });
      }
    };

    const handlePointerUp = () => {
      isDraggingRef.current = false;
      activeMode.current = null;
      setIsResizing(false);
      setIsRotating(false);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect();

    const menuWidth = 240;
    const menuHeight = 320;
    let x = e.clientX;
    let y = e.clientY;

    if (x + menuWidth > window.innerWidth) {
      x = window.innerWidth - menuWidth - 16;
    }
    if (y + menuHeight > window.innerHeight) {
      y = window.innerHeight - menuHeight - 16;
    }

    setContextMenuPos({ x, y });
    setShowContextMenu(true);
  };

  const currentRot = element.rotation || 0;

  return (
    <>
      <div 
        ref={nodeRef}
        style={{
          position: 'absolute',
          left: `${element.xCm * zoomScale}px`,
          top: `${element.yCm * zoomScale}px`,
          transform: `translate(-50%, -50%) rotate(${currentRot}deg)`,
          width: element.type === 'image' ? `${element.widthCm * zoomScale}px` : 'max-content',
          height: element.type === 'image' ? `${element.heightCm * zoomScale}px` : 'auto',
          padding: element.type === 'text' ? '4px' : 0,
          cursor: 'grab',
          userSelect: 'none',
          touchAction: 'none',
          pointerEvents: 'auto',
          zIndex: 'auto'
        }}
        onPointerDown={(e) => handlePointerDown(e, 'drag')}
        onContextMenu={handleContextMenu}
       className={`group absolute rounded ${
  isSelected && !isAICapturing
    ? element.type === 'text'
      ? 'ring-2 ring-amber-500 bg-amber-500/10'
      : 'ring-2 ring-amber-500 ring-offset-2 ring-offset-transparent'
    : !isAICapturing
      ? 'hover:ring-1 hover:ring-amber-400/50'
      : ''
}`}
      >
        {element.type === 'image' ? (
         <img 
  src={resources?.find(r => r.id === element.resourceId)?.url || element.url || 'https://placehold.co/200x200/cbd5e1/334155?text=Imagen'} 
  alt="Resource"
  className="w-full h-full pointer-events-none select-none" 
  style={{
    width: '100%',
    height: '100%',
    objectFit: element.keepAspectRatio ? 'contain' : 'fill', 
    pointerEvents: 'none'
  }}
/>
        ) : (
          <div 
            ref={innerTextRef}
            style={{ 
              color: element.color || '#ffffff', 
              fontSize: `${element.fontSize * zoomScale}px`, 
              fontFamily: element.fontFamily || 'sans-serif', 
              textAlign: element.textAlign || 'center',
              whiteSpace: 'pre-line',
              width: 'max-content',
              lineHeight: 1.2,
              pointerEvents: 'none',
              userSelect: 'none'
          }}>
            {element.text || 'Texto'}
          </div>
        )}

        {isSelected && !isAICapturing && (
          <>
            <div 
              onPointerDown={(e) => handlePointerDown(e, 'resize-se')} 
              className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-slate-900 rounded-sm cursor-se-resize shadow-md hover:scale-125 transition-transform z-10"
              title="Cambiar tamaño (SE)"
            />
            <div 
              onPointerDown={(e) => handlePointerDown(e, 'resize-sw')} 
              className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border border-slate-900 rounded-sm cursor-sw-resize shadow-md hover:scale-125 transition-transform z-10"
              title="Cambiar tamaño (SW)"
            />
            <div 
              onPointerDown={(e) => handlePointerDown(e, 'resize-ne')} 
              className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 border border-slate-900 rounded-sm cursor-ne-resize shadow-md hover:scale-125 transition-transform z-10"
              title="Cambiar tamaño (NE)"
            />
            <div 
              onPointerDown={(e) => handlePointerDown(e, 'resize-nw')} 
              className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-amber-400 border border-slate-900 rounded-sm cursor-nw-resize shadow-md hover:scale-125 transition-transform z-10"
              title="Cambiar tamaño (NW)"
            />

            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-amber-500 pointer-events-none" />
            <div 
              onPointerDown={(e) => handlePointerDown(e, 'rotate')} 
              className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 bg-indigo-600 border-2 border-white rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center shadow-xl hover:scale-125 transition-transform z-20"
              title="Girar elemento"
            >
              <RotateCw size={11} className="text-white" />
            </div>
          </>
        )}
      </div>

{isRotating && !isAICapturing && (        <div 
          className="fixed pointer-events-none z-[99999] bg-slate-950/95 text-indigo-300 border border-indigo-500/60 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-2xl flex items-center space-x-2 font-mono text-xs font-bold animate-in fade-in duration-75 select-none"
          style={{ 
            left: `${mousePos.x + 18}px`, 
            top: `${mousePos.y - 38}px`,
            transform: 'none'
          }}
        >
          <RotateCw size={13} className="text-indigo-400 animate-spin" />
          <span>{Math.round(currentRot)}°</span>
        </div>
      )}

{isResizing && !isAICapturing && (        <div 
          className="fixed pointer-events-none z-[99999] bg-slate-950/95 text-amber-300 border border-amber-500/60 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-2xl flex items-center space-x-2 font-mono text-xs font-bold animate-in fade-in duration-75 select-none"
          style={{ 
            left: `${mousePos.x + 18}px`, 
            top: `${mousePos.y + 18}px`,
            transform: 'none'
          }}
        >
          <Maximize2 size={13} className="text-amber-400" />
          <span>
            {element.type === 'image' 
              ? `${(element.widthCm || 0).toFixed(1)} × ${(element.heightCm || 0).toFixed(1)} cm`
              : `${(element.fontSize || 0).toFixed(1)} cm (${textDim.w.toFixed(1)} × ${textDim.h.toFixed(1)} cm)`
            }
          </span>
        </div>
      )}

      {showContextMenu && !isAICapturing && (
        <div 
          className="fixed bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 text-slate-100 rounded-2xl shadow-2xl p-2 z-[9999] w-60 text-xs select-none animate-in fade-in zoom-in-95 duration-150"
          style={{ left: `${contextMenuPos.x}px`, top: `${contextMenuPos.y}px` }}
          onPointerDown={e => e.stopPropagation()}
          onContextMenu={e => e.preventDefault()}
        >
          {activePopover === 'size' && (
            <div className="mb-2 p-2 bg-slate-950 border border-slate-800 rounded-xl space-y-2 animate-in fade-in duration-100">
              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400">
                <span>Dimensiones</span>
                <button onClick={() => setActivePopover(null)} className="hover:text-white p-0.5"><X size={12} /></button>
              </div>
              {element.type === 'image' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-0.5">Ancho (cm)</span>
                    <input 
                      type="number"
                      value={parseFloat((element.widthCm || 0).toFixed(1))}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) onChange({ ...element, widthCm: val });
                      }}
                      className="w-full bg-slate-900 text-amber-400 border border-slate-700 px-1.5 py-1 rounded text-center outline-none focus:border-amber-500 font-mono text-xs"
                      step="0.5"
                    />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block mb-0.5">Alto (cm)</span>
                    <input 
                      type="number"
                      value={parseFloat((element.heightCm || 0).toFixed(1))}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) onChange({ ...element, heightCm: val });
                      }}
                      className="w-full bg-slate-900 text-amber-400 border border-slate-700 px-1.5 py-1 rounded text-center outline-none focus:border-amber-500 font-mono text-xs"
                      step="0.5"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <span className="text-[9px] text-slate-400 block mb-1">Tamaño de Letra (cm)</span>
                  <input 
                    type="number"
                    value={parseFloat((element.fontSize || 0).toFixed(1))}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) onChange({ ...element, fontSize: val });
                    }}
                    className="w-full bg-slate-900 text-amber-400 border border-slate-700 px-2 py-1 rounded text-center outline-none focus:border-amber-500 font-mono text-xs"
                    step="0.5"
                  />
                </div>
              )}
            </div>
          )}

          {activePopover === 'rotate' && (
            <div className="mb-2 p-2 bg-slate-950 border border-slate-800 rounded-xl space-y-2 animate-in fade-in duration-100">
              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400">
                <span>Rotación manual</span>
                <button onClick={() => setActivePopover(null)} className="hover:text-white p-0.5"><X size={12} /></button>
              </div>
              <div className="flex items-center space-x-2">
                <input 
                  type="number"
                  value={Math.round(element.rotation || 0)}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    if (!isNaN(val)) onChange({ ...element, rotation: ((val % 360) + 360) % 360 });
                  }}
                  className="w-16 bg-slate-900 text-amber-400 border border-slate-700 px-1.5 py-1 rounded text-center outline-none focus:border-amber-500 font-mono text-xs"
                />
                <div className="flex space-x-1 flex-1 justify-end">
                  <button onClick={() => onChange({ ...element, rotation: (((element.rotation || 0) - 90) % 360 + 360) % 360 })} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-200 font-mono">-90°</button>
                  <button onClick={() => onChange({ ...element, rotation: (((element.rotation || 0) + 90) % 360 + 360) % 360 })} className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px] text-slate-200 font-mono">+90°</button>
                  <button onClick={() => onChange({ ...element, rotation: 0 })} className="px-2 py-1 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded text-[10px] font-mono">0°</button>
                </div>
              </div>
            </div>
          )}

          {activePopover === 'flip' && element.type === 'image' && (
            <div className="mb-2 p-2 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between text-[11px] font-semibold text-amber-400 mb-1">
                <span>Voltear imagen</span>
                <button onClick={() => setActivePopover(null)} className="hover:text-white p-0.5"><X size={12} /></button>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onChange({ ...element, flipX: !element.flipX })}
                  className={`p-1.5 rounded-lg flex items-center justify-center space-x-1.5 text-xs transition-colors ${element.flipX ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'}`}
                >
                  <FlipHorizontal size={13} />
                  <span>Horiz</span>
                </button>
                <button
                  onClick={() => onChange({ ...element, flipY: !element.flipY })}
                  className={`p-1.5 rounded-lg flex items-center justify-center space-x-1.5 text-xs transition-colors ${element.flipY ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-900 hover:bg-slate-800 text-slate-300'}`}
                >
                  <FlipVertical size={13} />
                  <span>Vert</span>
                </button>
              </div>
            </div>
          )}

          <div className="space-y-0.5">
            <button 
              onClick={() => { setShowContextMenu(false); onDuplicate(); }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <Copy size={14} className="text-slate-400" />
                <span>Duplicar</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Ctrl+D</span>
            </button>

            <button 
              onClick={() => { setShowContextMenu(false); onDelete(); }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <Trash2 size={14} />
                <span>Eliminar</span>
              </div>
              <span className="text-[10px] text-rose-500/70 font-mono">Supr / Del</span>
            </button>

            <div className="h-px bg-slate-800 my-1" />

            <button 
              onClick={() => setActivePopover(activePopover === 'size' ? null : 'size')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${activePopover === 'size' ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-slate-800 text-slate-200'}`}
            >
              <div className="flex items-center space-x-2.5">
                <Maximize2 size={14} className="text-slate-400" />
                <span>Tamaño / Medidas</span>
              </div>
            </button>

            <button 
              onClick={() => setActivePopover(activePopover === 'rotate' ? null : 'rotate')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${activePopover === 'rotate' ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-slate-800 text-slate-200'}`}
            >
              <div className="flex items-center space-x-2.5">
                <RotateCw size={14} className="text-slate-400" />
                <span>Girar / Rotación</span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono">{Math.round(currentRot)}°</span>
            </button>

            {element.type === 'image' && (
              <button 
                onClick={() => setActivePopover(activePopover === 'flip' ? null : 'flip')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${activePopover === 'flip' ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-slate-800 text-slate-200'}`}
              >
                <div className="flex items-center space-x-2.5">
                  <FlipHorizontal size={14} className="text-slate-400" />
                  <span>Voltear Imagen</span>
                </div>
              </button>
            )}

            <div className="h-px bg-slate-800 my-1" />

            <button 
              onClick={() => { setShowContextMenu(false); onBringToFront(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 transition-colors"
            >
              <ArrowUp size={14} className="text-slate-400" />
              <span>Traer al frente</span>
            </button>

            <button 
              onClick={() => { setShowContextMenu(false); onSendToBack(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-1.5 hover:bg-slate-800 rounded-lg text-slate-200 transition-colors"
            >
              <ArrowDown size={14} className="text-slate-400" />
              <span>Enviar al fondo</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default function EventDesignerApp() {

  const [viewMode, setViewMode] = useState('designer');

  const [resources, setResources] = useState([]);
  const [isUploadingResource, setIsUploadingResource] = useState(false);

  const resourceFileInputRef = useRef(null);

  const [pages, setPages] = useState([
    {
      id: 'p1',
      name: 'Cilindro XL',
      shape: 'rect_banner',
      widthCm: 150,
      heightCm: 80,
      bgColor: '#ffffff',
      elements: [
        {
          id: 'el_1',
          type: 'text',
          text: 'Mi Gran Evento',
          xCm: 75,
          yCm: 40,
          fontSize: 12,
          color: '#f59e0b',
          fontFamily: 'Georgia, serif',
          label: 'Título'
        }
      ]
    }
  ]);

  // History Stack for Undo / Redo
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);
  const [toastMessage, setToastMessage] = useState(null);

  const [activePageId, setActivePageId] = useState('p1');
  const [activeTool, setActiveTool] = useState('medidas');
  const [selectedElementId, setSelectedElementId] = useState(null);

  const [dragItemIndex, setDragItemIndex] = useState(null);
  const [dragOverItemIndex, setDragOverItemIndex] = useState(null);

  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // 👁️ MODO DE CAPTURA LIMPIA PARA LA IA
const [isAICapturing, setIsAICapturing] = useState(false);

  // ZOOM CONTROLS & AUTO-FIT CONTAINER OBSERVER
  const [userZoomMultiplier, setUserZoomMultiplier] = useState(1);

  const canvasViewportRef = useRef(null);
  const canvasRef = useRef(null);

  const [viewportSize, setViewportSize] = useState({
    width: 800,
    height: 500
  });

  // =====================================================
  // 👁️ OJOS DE LA IA — CAPTURA VISUAL
  // =====================================================

 const captureCanvasForAI = useCallback(async () => {

  if (!canvasRef.current) {
    throw new Error(
      'El lienzo todavía no está disponible'
    );
  }

  // 👁️ Activar modo de captura limpia
  setIsAICapturing(true);

  // Esperar a que React actualice el DOM
  await new Promise(resolve =>
    requestAnimationFrame(() =>
      requestAnimationFrame(resolve)
    )
  );

  try {

    console.log(
      '👁️ Capturando lienzo limpio para la IA...'
    );

    const dataUrl = await toPng(
      canvasRef.current,
      {
        cacheBust: true,
        pixelRatio: 2
      }
    );

    console.log(
      '👁️ Captura visual limpia generada'
    );

    return dataUrl;

  } catch (error) {

    console.error(
      '❌ Error capturando lienzo:',
      error
    );

    throw error;

  } finally {

    // 👁️ Restaurar controles del editor
    setIsAICapturing(false);

  }

}, []);
  // =====================================================
  // 🧪 PRUEBA TEMPORAL DE LOS OJOS
  // =====================================================

const testCaptureCanvas = async () => {

  try {

    console.log(
      '\n===================================='
    );
    console.log(
      '👁️ ENVIANDO LIENZO A GEMINI...'
    );
    console.log(
      '===================================='
    );
    // =====================================================
    // 1. CAPTURAR LIENZO
    // =====================================================
    const image =
      await captureCanvasForAI();

    console.log(
      '✅ Captura creada'
    );

    // =====================================================
    // 2. CREAR ESTADO DEL DISEÑO
    // =====================================================

    const visionContext = {

  canvas: {
    widthCm:
      currentPage.widthCm,

    heightCm:
      currentPage.heightCm,

    shape:
      currentPage.shape
  },

  elements:
    currentPage.elements,

  resources:
    resources.map(resource => ({

      id:
        resource.id,

      name:
        resource.name,

      label:
        resource.label,

      category:
        resource.category,

      widthPx:
        resource.widthPx,

      heightPx:
        resource.heightPx,

      aspectRatio:
        resource.aspectRatio,

      tags:
        resource.tags

    }))
};
    console.log(
      '📐 Estado del diseño preparado:',
      visionContext
    );

    // =====================================================
    // 3. ENVIAR A NUESTRO BACKEND
    // =====================================================

    const response =
      await fetch(
        'http://localhost:3001/api/vision',
        {

          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({

            image,

            designContext:
              visionContext

          })

        }
      );

    // =====================================================
    // 4. LEER RESPUESTA
    // =====================================================

    const data =
      await response.json();

    console.log(
      '\n===================================='
    );
    console.log(
      '👁️ RESPUESTA REAL DE GEMINI'
    );
    console.log(
      '===================================='
    );
    console.log(
      JSON.stringify(
        data,
        null,
        2
      )
    );

    // =====================================================
    // 5. MOSTRAR RESULTADO
    // =====================================================

    if (!response.ok) {

      console.error(
        '❌ Error de Gemini:',
        data
      );

      alert(
        'Error de Gemini:\n\n' +
        (
          data.error ||
          'Error desconocido'
        )
      );

      return;
    }

    // =====================================================
    // 6. MOSTRAR ANÁLISIS EN UNA VENTANA
    // =====================================================

    const analysis =
      data.visualAnalysis;


    const newWindow =
      window.open(
        '',
        '_blank',
        'width=800,height=700'
      );

    if (newWindow) {

      newWindow.document.write(`
        <html>

          <head>

            <title>
              👁️ Análisis de Gemini
            </title>

          </head>

          <body
            style="
              margin:0;
              padding:30px;
              background:#111827;
              color:#e5e7eb;
              font-family:Arial,sans-serif;
            "
          >
            <h1>
              👁️ Gemini está viendo tu diseño
            </h1>
            <hr>
            <h2>
              Composición
            </h2>
            <p>
              ${analysis?.composition || ''}
            </p>
            <h2>
              Jerarquía visual
            </h2>
            <p>
              ${analysis?.hierarchy || ''}
            </p>
            <h2>
              Balance
            </h2>
            <p>
              ${analysis?.balance || ''}
            </p>
            <h2>
              Espaciado
            </h2>
            <p>
              ${analysis?.spacing || ''}
            </p>
            <h2>
              Alineación
            </h2>
            <p>
              ${analysis?.alignment || ''}
            </p>
            <h2>
              Contraste
            </h2>

            <p>
              ${analysis?.contrast || ''}
            </p>
            <h2>
              Problemas detectados
            </h2>

            <pre
              style="
                white-space:pre-wrap;
                background:#1f2937;
                padding:15px;
                border-radius:8px;
              "
            >
${JSON.stringify(
  analysis?.issues || [],
  null,
  2
)}
            </pre>
            <h2>
              Observaciones
            </h2>
            <pre
              style="
                white-space:pre-wrap;
                background:#1f2937;
                padding:15px;
                border-radius:8px;
              "
            >
${JSON.stringify(
  analysis?.observations || [],
  null,
  2
)}
            </pre>

          </body>

        </html>

      `);

      newWindow.document.close();

    }

  } catch (error) {

    console.error(
      '❌ Error enviando lienzo a Gemini:',
      error
    );

    alert(
      'Error conectando con Gemini:\n\n' +
      error.message
    );

  }

};

  // =====================================================
  // AQUÍ CONTINÚA TU CÓDIGO ORIGINAL

  // Mover estos useState al inicio de EventDesignerApp

  useEffect(() => {
    if (!canvasViewportRef.current) return;
    
    const updateSize = () => {
      if (canvasViewportRef.current) {
        setViewportSize({
          width: canvasViewportRef.current.clientWidth,
          height: canvasViewportRef.current.clientHeight
        });
      }
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(canvasViewportRef.current);

    return () => observer.disconnect();
  }, [viewMode]);

  const currentPage = pages.find(p => p.id === activePageId) || pages[0];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };
  const handleUploadResource = async (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Selecciona una imagen válida');
    event.target.value = '';
    return;
  }

  setIsUploadingResource(true);

  try {
    // 1. Detectar dimensiones reales de la imagen
    const imageUrl = URL.createObjectURL(file);

    const dimensions = await new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });

        URL.revokeObjectURL(imageUrl);
      };

      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('No se pudo leer la imagen'));
      };

      img.src = imageUrl;
    });

    const widthPx = dimensions.width;
    const heightPx = dimensions.height;
    const aspectRatio = widthPx / heightPx;

    // 2. Crear nombre único para Storage
    const fileExtension =
      file.name.split('.').pop()?.toLowerCase() || 'png';

    const storagePath =
      `resources/${crypto.randomUUID()}.${fileExtension}`;

    // 3. Subir imagen a Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('resources')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });

    if (uploadError) {
      console.error('❌ Error subiendo imagen:', uploadError);
      showToast('No se pudo subir la imagen');
      return;
    }

    // 4. Obtener URL pública
    const { data: publicUrlData } = supabase
      .storage
      .from('resources')
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData?.publicUrl;

    if (!publicUrl) {
      throw new Error('No se pudo obtener la URL de la imagen');
    }

    // 5. Guardar información en tablaresources
    const { data: resourceRow, error: dbError } = await supabase
      .from('tablaresources')
      .insert({
        name: file.name,
        url: publicUrl,
        storage_path: storagePath,
        category: 'sin_categoria',
        width_px: widthPx,
        height_px: heightPx,
        aspect_ratio: aspectRatio,
        tags: null
      })
      .select()
      .single();

    // 6. Si falla la base de datos,
    // eliminar también la imagen para no dejar basura en Storage
    if (dbError) {
      console.error('❌ Error guardando recurso:', dbError);

      await supabase
        .storage
        .from('resources')
        .remove([storagePath]);

      showToast('La imagen no pudo registrarse');
      return;
    }

    // 7. Convertir registro de Supabase al formato que usa tu aplicación
    const newResource = {
      id: resourceRow.id,
      type: 'image',
      url: publicUrl,
      label: resourceRow.name || file.name,
      name: resourceRow.name || file.name,
      category: resourceRow.category || 'sin_categoria',
      widthPx: widthPx,
      heightPx: heightPx,
      aspectRatio: aspectRatio,
      storagePath: storagePath,
      tags: resourceRow.tags || []
    };

    // 8. Mostrarlo inmediatamente en la galería
    setResources(prev => [
      newResource,
      ...prev
    ]);

    showToast('Imagen subida correctamente');

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    showToast('Ocurrió un error al subir la imagen');

  } finally {
    setIsUploadingResource(false);

    // Permite volver a seleccionar el mismo archivo
    event.target.value = '';
  }
};
const loadResources = useCallback(async () => {
  try {
    const { data, error } = await supabase
      .from('tablaresources')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error cargando recursos:', error);
      showToast('No se pudieron cargar los recursos');
      return;
    }

    const mappedResources = (data || []).map(row => {
      let publicUrl = row.url;

      if (row.storage_path) {
        const { data: publicData } = supabase
          .storage
          .from('resources') // <--- CORREGIDO (agregada la "s")
          .getPublicUrl(row.storage_path);

        publicUrl = publicData?.publicUrl || row.url;
      }

      return {
        id: row.id,
        type: 'image',
        url: publicUrl,
        label: row.name || 'Recurso',
        name: row.name || 'Recurso',
        category: row.category || 'sin_categoria',
        widthPx: Number(row.width_px) || 0,
        heightPx: Number(row.height_px) || 0,
        aspectRatio:
          Number(row.aspect_ratio) ||
          (
            Number(row.width_px) > 0 &&
            Number(row.height_px) > 0
              ? Number(row.width_px) / Number(row.height_px)
              : 1
          ),
        storagePath: row.storage_path,
        tags: row.tags || []
      };
    });

    setResources(mappedResources);

    console.log('✅ Recursos cargados:', mappedResources);

  } catch (error) {
    console.error('❌ Error inesperado cargando recursos:', error);
  }
}, []);
useEffect(() => {
  loadResources();
}, [loadResources]);

  const recordHistory = () => {
    setPast(prev => [...prev, JSON.parse(JSON.stringify(pages))]);
    setFuture([]);
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    
    setFuture(prev => [JSON.parse(JSON.stringify(pages)), ...prev]);
    setPages(previous);
    setPast(newPast);
    showToast('Cambio deshecho (Ctrl+Z)');
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast(prev => [...prev, JSON.parse(JSON.stringify(pages))]);
    setPages(next);
    setFuture(newFuture);
    showToast('Cambio rehecho (Ctrl+Y)');
  };

  const updatePageDirect = (updates) => {
    setPages(pages.map(p => p.id === activePageId ? { ...p, ...updates } : p));
  };

  const updatePage = (updates) => {
    recordHistory();
    updatePageDirect(updates);
  };

  const updateElement = (elId, updates) => {
    setPages(pages.map(p => {
      if (p.id === activePageId) {
        return {
          ...p,
          elements: p.elements.map(e => e.id === elId ? { ...e, ...updates } : e)
        };
      }
      return p;
    }));
  };

  const deleteElement = (elId) => {
    if (!elId) return;
    recordHistory();
    setPages(pages.map(p => {
      if (p.id === activePageId) {
        return {
          ...p,
          elements: p.elements.filter(e => e.id !== elId)
        };
      }
      return p;
    }));
    if (selectedElementId === elId) setSelectedElementId(null);
    showToast('Elemento eliminado');
  };

  const duplicateElement = (elId) => {
    const elToDup = currentPage.elements.find(e => e.id === elId);
    if (!elToDup) return;
    recordHistory();
    const newEl = {
      ...elToDup,
      id: `${elToDup.type}_${Date.now()}`,
      xCm: elToDup.xCm + 4,
      yCm: elToDup.yCm + 4,
      label: elToDup.label ? `${elToDup.label} (Copia)` : undefined
    };
    setPages(pages.map(p => {
      if (p.id === activePageId) {
        return { ...p, elements: [...p.elements, newEl] };
      }
      return p;
    }));
    setSelectedElementId(newEl.id);
    showToast('Elemento duplicado');
  };

  const bringToFront = (elId) => {
    const el = currentPage.elements.find(e => e.id === elId);
    if (!el) return;
    recordHistory();
    const filtered = currentPage.elements.filter(e => e.id !== elId);
    setPages(pages.map(p => p.id === activePageId ? { ...p, elements: [...filtered, el] } : p));
  };

  const sendToBack = (elId) => {
    const el = currentPage.elements.find(e => e.id === elId);
    if (!el) return;
    recordHistory();
    const filtered = currentPage.elements.filter(e => e.id !== elId);
    setPages(pages.map(p => p.id === activePageId ? { ...p, elements: [el, ...filtered] } : p));
  };

  const addTab = () => {
    recordHistory();
    const newId = `p_${Date.now()}`;
    setPages([...pages, { 
      id: newId, 
      name: `Nueva Pieza`, 
      shape: 'rect_banner', 
      widthCm: 100, 
      heightCm: 100, 
      bgColor: '#ffffff', 
      elements: [] 
    }]);
    setActivePageId(newId);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isTyping = activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.isContentEditable
      );

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (!isTyping) {
          e.preventDefault();
          handleUndo();
        }
        return;
      }

      if (
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'z')
      ) {
        if (!isTyping) {
          e.preventDefault();
          handleRedo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        if (!isTyping && selectedElementId) {
          e.preventDefault();
          duplicateElement(selectedElementId);
        }
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace' || e.key === 'Supr') {
        if (!isTyping && selectedElementId) {
          e.preventDefault();
          deleteElement(selectedElementId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, past, future, pages]);

  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = "move";
    setDragItemIndex(index);
  };

  const handleDragEnter = (e, index) => {
    setDragOverItemIndex(index);
  };

const handleDrop = (e, dropIndex) => {
  e.preventDefault();
  if (dragItemIndex === null || dragItemIndex === dropIndex) return;
  recordHistory();
  
  setPages(prevPages => prevPages.map(p => {
    if (p.id === activePageId) {
      const newElements = [...p.elements];
      const realDragIndex = newElements.length - 1 - dragItemIndex;
      let realDropIndex = newElements.length - 1 - dropIndex;
      
      const [draggedItem] = newElements.splice(realDragIndex, 1);
      
      /* Si la capa eliminada estaba antes en el arreglo, ajustamos la posición de inserción */
      if (realDragIndex < realDropIndex) {
        realDropIndex -= 1;
      }
      
      newElements.splice(realDropIndex, 0, draggedItem);
      
      return { ...p, elements: newElements };
    }
    return p;
  }));
  
  setDragItemIndex(null);
  setDragOverItemIndex(null);
};

  const addTextElement = () => {
    recordHistory();
    const newEl = { id: `txt_${Date.now()}`, type: 'text', text: 'Nuevo Texto', xCm: currentPage.widthCm/2, yCm: currentPage.heightCm/2, fontSize: 10, color: '#1e293b', fontFamily: 'sans-serif', rotation: 0 };
    setPages(pages.map(p => p.id === activePageId ? { ...p, elements: [...p.elements, newEl] } : p));
    setSelectedElementId(newEl.id);
    setActiveTool('texto');
  };

  const addImageElement = (resourceId) => {
  const resource = resources.find(r => r.id === resourceId);
  const imgUrl = resource?.url || '';

  if (!imgUrl) return;

  const img = new Image();
  img.src = imgUrl;

  img.onload = () => {
    const maxSizeCm = 40; // Tamaño máximo deseado al insertar (en cm)
    const naturalWidth = img.naturalWidth || 300;
    const naturalHeight = img.naturalHeight || 300;
    const aspectRatio = naturalWidth / naturalHeight;

    let initialWidthCm = maxSizeCm;
    let initialHeightCm = maxSizeCm;

    // Calcular dimensiones en cm respetando la proporción real de la imagen
    if (naturalWidth > naturalHeight) {
      initialWidthCm = maxSizeCm;
      initialHeightCm = maxSizeCm / aspectRatio;
    } else {
      initialHeightCm = maxSizeCm;
      initialWidthCm = maxSizeCm * aspectRatio;
    }

    recordHistory();

    const newEl = {
  id: `img_${Date.now()}`,
  type: 'image',
  resourceId,
  xCm: currentPage.widthCm / 2,
  yCm: currentPage.heightCm / 2,
  widthCm: Math.round(initialWidthCm * 10) / 10,
  heightCm: Math.round(initialHeightCm * 10) / 10,
  rotation: 0,
  keepAspectRatio: false // <--- CAMBIA 'true' POR 'false' AQUÍ
};

    setPages(prevPages => prevPages.map(p => {
      if (p.id === activePageId) {
        return { ...p, elements: [...p.elements, newEl] };
      }
      return p;
    }));

    setSelectedElementId(newEl.id);
  };
};
const handleGenerateAIDesign = async () => {
  if (!aiPrompt.trim()) {
    showToast('Escribe una instrucción para la IA');
    return;
  }

setIsGenerating(true);

try {

  /*
  =======================================================
  1. 👁️ CAPTURAR EL LIENZO PARA GEMINI
  =======================================================
  */

  console.log(
    '\n👁️ Preparando captura visual para Gemini...'
  );

  const canvasImage =
    await captureCanvasForAI();

  console.log(
    '👁️ Captura obtenida correctamente'
  );


  /*
  =======================================================
  2. 👁️ ENVIAR LIENZO A GEMINI VISION
  =======================================================
  */

  const visionResponse =
    await fetch(
      'http://localhost:3001/api/vision',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({

          image:
            canvasImage,

          designContext: {

            canvas: {
              widthCm:
                currentPage.widthCm,

              heightCm:
                currentPage.heightCm,

              shape:
                currentPage.shape
            },

            elements:
              currentPage.elements,

            resources:
              resources.map(resource => ({
                id:
                  resource.id,

                name:
                  resource.name,

                label:
                  resource.label,

                category:
                  resource.category,

                widthPx:
                  resource.widthPx,

                heightPx:
                  resource.heightPx,

                aspectRatio:
                  resource.aspectRatio,

                tags:
                  resource.tags
              }))
          }

        })
      }
    );


  /*
  =======================================================
  3. RECIBIR ANÁLISIS DE GEMINI
  =======================================================
  */

  const visionData =
    await visionResponse.json();


  if (
    !visionResponse.ok ||
    !visionData.success
  ) {

    throw new Error(
      visionData.error ||
      'Gemini no pudo analizar el lienzo'
    );

  }


  const visualAnalysis =
    visionData.visualAnalysis;


  console.log(
    '\n👁️ ANÁLISIS VISUAL DE GEMINI:'
  );

  console.log(
    JSON.stringify(
      visualAnalysis,
      null,
      2
    )
  );


  /*
  =======================================================
  4. 🧠 ENVIAR TODO A OLLAMA
  =======================================================
  */

  const response =
    await fetch(
      'http://localhost:3001/api/chat-agent',
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json'
        },

        body: JSON.stringify({

          /*
          -----------------------------------------------
          ORDEN DEL USUARIO
          -----------------------------------------------
          */

          prompt:
            aiPrompt,


          /*
          -----------------------------------------------
          LIENZO
          -----------------------------------------------
          */

          canvas: {
            widthCm:
              currentPage.widthCm,

            heightCm:
              currentPage.heightCm,

            shape:
              currentPage.shape
          },


          /*
          -----------------------------------------------
          ELEMENTOS ACTUALES
          -----------------------------------------------
          */

          elements:
            currentPage.elements,


          /*
          -----------------------------------------------
          RECURSOS DISPONIBLES
          -----------------------------------------------
          */

          resources:
            resources.map(resource => ({
              id:
                resource.id,

              name:
                resource.name,

              label:
                resource.label,

              category:
                resource.category,

              widthPx:
                resource.widthPx,

              heightPx:
                resource.heightPx,

              aspectRatio:
                resource.aspectRatio,

              tags:
                resource.tags
            })),


          /*
          -----------------------------------------------
          👁️ ANÁLISIS VISUAL DE GEMINI
          -----------------------------------------------
          */

          visualAnalysis:
            visualAnalysis

        })
      }
    );


  /*
  =======================================================
  5. CONTINUAR CON LA RESPUESTA DE OLLAMA
  =======================================================
  */
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.error || 'Error al comunicarse con el agente'
      );
    }

    const toolCalls = data.toolCalls || [];

    console.log(
      '🤖 Tool calls recibidos por frontend:',
      toolCalls
    );

    if (toolCalls.length === 0) {
      showToast('La IA no generó ninguna acción');
      return;
    }


    /*
    =======================================================
    2. GUARDAR HISTORIAL UNA SOLA VEZ
    =======================================================
    */

    recordHistory();


    /*
    =======================================================
    3. MAPA DE ELEMENTOS CREADOS
    =======================================================

    Nos servirá para convertir:

    __LAST_ADDED_ELEMENT__

    en el ID real generado por React.
    =======================================================
    */

    const createdElementsByResource = {};


    /*
    =======================================================
    4. EJECUTAR TODAS LAS HERRAMIENTAS
    =======================================================
    */

    setPages(prevPages => {

      return prevPages.map(page => {

        if (page.id !== activePageId) {
          return page;
        }

        let newElements = [...page.elements];


        /*
        ===================================================
        RECORRER TOOL CALLS
        ===================================================
        */

        for (const toolCall of toolCalls) {

          const functionName =
            toolCall?.function?.name;

          let args =
            toolCall?.function?.arguments || {};


          /*
          -------------------------------------------------
          SEGURIDAD
          -------------------------------------------------
          */

          if (typeof args === 'string') {
            try {
              args = JSON.parse(args);
            } catch {
              console.error(
                '❌ No se pudieron interpretar argumentos:',
                args
              );
              continue;
            }
          }


          console.log(
            `🔧 Ejecutando: ${functionName}`,
            args
          );


          /*
          =================================================
          SET CANVAS SIZE
          =================================================
          */

          if (functionName === 'setCanvasSize') {

            const widthCm =
              Number(args.widthCm);

            const heightCm =
              Number(args.heightCm);

            if (
              Number.isFinite(widthCm) &&
              Number.isFinite(heightCm) &&
              widthCm > 0 &&
              heightCm > 0
            ) {
              page.widthCm = widthCm;
              page.heightCm = heightCm;
            }

            continue;
          }


          /*
          =================================================
          SET CANVAS SHAPE
          =================================================
          */

          if (functionName === 'setCanvasShape') {

            if (args.shape) {
              page.shape = args.shape;
            }

            continue;
          }


          /*
          =================================================
          SET CANVAS BACKGROUND
          =================================================
          */

          if (functionName === 'setCanvasBackground') {

            if (args.color) {
              page.bgColor = args.color;
            }

            continue;
          }


          /*
          =================================================
          ADD ELEMENT
          =================================================
          */

          if (functionName === 'addElement') {

            const resourceId =
              args.resourceId;

            if (!resourceId) {
              console.warn(
                '⚠️ addElement ignorado: no tiene resourceId'
              );

              continue;
            }


            /*
            -----------------------------------------------
            VERIFICAR QUE EL RECURSO EXISTA
            -----------------------------------------------
            */

            const resource =
              resources.find(
                r => String(r.id) === String(resourceId)
              );

            if (!resource) {
              console.warn(
                '⚠️ Recurso no encontrado:',
                resourceId
              );

              continue;
            }


            /*
            -----------------------------------------------
            GENERAR ID REAL
            -----------------------------------------------
            */

            const newElementId =
              `img_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`;


            /*
            -----------------------------------------------
            VALORES
            -----------------------------------------------
            */

            const xCm =
              Number.isFinite(Number(args.xCm))
                ? Number(args.xCm)
                : page.widthCm / 2;

            const yCm =
              Number.isFinite(Number(args.yCm))
                ? Number(args.yCm)
                : page.heightCm / 2;

            const widthCm =
              Number.isFinite(Number(args.widthCm))
                ? Number(args.widthCm)
                : 40;

            const heightCm =
              Number.isFinite(Number(args.heightCm))
                ? Number(args.heightCm)
                : 40;


            /*
            -----------------------------------------------
            CREAR ELEMENTO
            -----------------------------------------------
            */
const newElement = {
  id: newElementId,

  type: 'image',

  resourceId,

  xCm,

  yCm,

  widthCm,

  heightCm,

  rotation:
    Number.isFinite(Number(args.rotation))
      ? Number(args.rotation)
      : 0,

  flipX:
    args.flipX !== undefined
      ? Boolean(args.flipX)
      : false,

  flipY:
    args.flipY !== undefined
      ? Boolean(args.flipY)
      : false,

  /*
  =====================================================
  COMPORTAMIENTO IGUAL A IMAGEN AGREGADA MANUALMENTE
  =====================================================

  La imagen debe llenar exactamente el rectángulo
  definido por widthCm y heightCm.

  Por eso usamos false.

  Así React utiliza:

  objectFit: 'fill'

  igual que cuando agregas una imagen desde
  la biblioteca manualmente.
  =====================================================
  */

  keepAspectRatio: false
};


            /*
            -----------------------------------------------
            AGREGAR AL LIENZO
            -----------------------------------------------
            */

            newElements.push(newElement);


            /*
            -----------------------------------------------
            GUARDAR ID REAL
            -----------------------------------------------

            Esto permite posteriormente ejecutar:

            sendToBack
            bringToFront

            usando el ID real.
            -----------------------------------------------
            */

            const resourceKey = String(resourceId);

if (!createdElementsByResource[resourceKey]) {
  createdElementsByResource[resourceKey] = [];
}

createdElementsByResource[resourceKey].push(
  newElementId
);

            console.log(
              '✅ Elemento creado:',
              newElement
            );

            continue;
          }


          /*
          =================================================
          MOVE ELEMENT
          =================================================
          */

          if (functionName === 'moveElement') {

            const elementId =
              args.elementId;

            if (!elementId) {
              continue;
            }

            newElements =
              newElements.map(element => {

                if (element.id !== elementId) {
                  return element;
                }

                return {
                  ...element,

                  ...(args.xCm !== undefined
                    ? {
                        xCm: Number(args.xCm)
                      }
                    : {}),

                  ...(args.yCm !== undefined
                    ? {
                        yCm: Number(args.yCm)
                      }
                    : {})
                };
              });

            continue;
          }


          /*
=================================================
RESIZE ELEMENT
=================================================
*/

if (functionName === 'resizeElement') {

  const elementId =
    args.elementId;

  if (!elementId) {
    continue;
  }

  newElements =
    newElements.map(element => {

      /*
      -----------------------------------------------
      VERIFICAR ELEMENTO
      -----------------------------------------------
      */

      if (element.id !== elementId) {
        return element;
      }


      /*
      -----------------------------------------------
      ACTUALIZAR DIMENSIONES
      -----------------------------------------------

      Si la IA proporciona ancho y/o alto,
      respetamos exactamente esos valores.
      -----------------------------------------------
      */

      return {
        ...element,

        ...(args.widthCm !== undefined
          ? {
              widthCm:
                Number(args.widthCm)
            }
          : {}),

        ...(args.heightCm !== undefined
          ? {
              heightCm:
                Number(args.heightCm)
            }
          : {}),


        /*
        -----------------------------------------------
        IMÁGENES
        -----------------------------------------------

        Cuando la IA cambia las dimensiones de una
        imagen, NO queremos que la proporción original
        impida que ocupe exactamente el nuevo rectángulo.

        Esto hace que se comporte igual que una imagen
        agregada manualmente desde la biblioteca.

        Resultado:

        40 × 60 cm
        → imagen realmente ocupa 40 × 60 cm
        → objectFit: fill
        -----------------------------------------------
        */

        ...(element.type === 'image' &&
          (
            args.widthCm !== undefined ||
            args.heightCm !== undefined
          )
          ? {
              keepAspectRatio: false
            }
          : {})
      };
    });

  continue;
}
          /*
          =================================================
          ROTATE ELEMENT
          =================================================
          */

          if (functionName === 'rotateElement') {

            const elementId =
              args.elementId;

            if (!elementId) {
              continue;
            }

            newElements =
              newElements.map(element => {

                if (element.id !== elementId) {
                  return element;
                }

                return {
                  ...element,

                  rotation:
                    Number(args.rotation) || 0
                };
              });

            continue;
          }


          /*
          =================================================
          FLIP ELEMENT
          =================================================
          */

          if (functionName === 'flipElement') {

  const elementId =
    args.elementId;

  if (!elementId) {
    continue;
  }

  const flipX =
    args.horizontal !== undefined
      ? args.horizontal
      : args.flipX;

  const flipY =
    args.vertical !== undefined
      ? args.vertical
      : args.flipY;

  newElements =
    newElements.map(element => {

      if (element.id !== elementId) {
        return element;
      }

      return {
        ...element,

        ...(flipX !== undefined
          ? {
              flipX:
                Boolean(flipX)
            }
          : {}),

        ...(flipY !== undefined
          ? {
              flipY:
                Boolean(flipY)
            }
          : {})
      };
    });

  continue;
}
          /*
          =================================================
          DUPLICATE ELEMENT
          =================================================
          */

          if (functionName === 'duplicateElement') {

            const elementId =
              args.elementId;

            const original =
              newElements.find(
                element =>
                  element.id === elementId
              );

            if (!original) {
              continue;
            }

            const duplicateId =
              `${original.type}_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`;

            const duplicate = {
              ...original,

              id: duplicateId,

              xCm:
                original.xCm + 4,

              yCm:
                original.yCm + 4
            };

            newElements.push(duplicate);

            continue;
          }


          /*
          =================================================
          DELETE ELEMENT
          =================================================
          */

          if (functionName === 'deleteElement') {

            const elementId =
              args.elementId;

            if (!elementId) {
              continue;
            }

            newElements =
              newElements.filter(
                element =>
                  element.id !== elementId
              );

            continue;
          }


          /*
          =================================================
          BRING TO FRONT
          =================================================
          */

          /*
=================================================
BRING TO FRONT
=================================================
*/

if (functionName === 'bringToFront') {

  let targetElementId =
    args.elementId;

  /*
  ---------------------------------------------
  RESOLVER ELEMENTO RECIÉN CREADO
  ---------------------------------------------
  */

  if (
    targetElementId ===
      '__LAST_ADDED_ELEMENT__' &&
    args.resourceId
  ) {

    const resourceKey =
      String(args.resourceId);

    const created =
      createdElementsByResource[
        resourceKey
      ];

    if (
      Array.isArray(created) &&
      created.length > 0
    ) {
      targetElementId =
        created[created.length - 1];
    }
  }

  /*
  ---------------------------------------------
  VERIFICAR ELEMENTO
  ---------------------------------------------
  */

  if (!targetElementId) {
    console.warn(
      '⚠️ No se pudo resolver elemento para bringToFront'
    );

    continue;
  }

  const element =
    newElements.find(
      el =>
        el.id === targetElementId
    );

  if (!element) {
    console.warn(
      '⚠️ Elemento no encontrado para bringToFront:',
      targetElementId
    );

    continue;
  }

  /*
  ---------------------------------------------
  MOVER AL FRENTE
  ---------------------------------------------
  */

  newElements =
    newElements.filter(
      el =>
        el.id !== targetElementId
    );

  newElements.push(element);

  continue;
}


          /*
          =================================================
          SEND TO BACK
          =================================================
          */

          if (functionName === 'sendToBack') {

  let elementId =
    args.elementId;

  /*
  ---------------------------------------------
  RESOLVER ELEMENTO RECIÉN CREADO
  ---------------------------------------------
  */

  if (
    elementId ===
    '__LAST_ADDED_ELEMENT__' &&
    args.resourceId
  ) {

    const resourceKey =
      String(args.resourceId);

    const created =
      createdElementsByResource[
        resourceKey
      ];

    if (
      Array.isArray(created) &&
      created.length > 0
    ) {
      elementId =
        created[created.length - 1];
    }
  }

  if (!elementId) {
    console.warn(
      '⚠️ No se pudo resolver elemento para sendToBack'
    );

    continue;
  }

  const element =
    newElements.find(
      el => el.id === elementId
    );

  if (!element) {
    console.warn(
      '⚠️ Elemento no encontrado para sendToBack:',
      elementId
    );

    continue;
  }


            /*
            ---------------------------------------------
            MANDAR AL FONDO REAL
            ---------------------------------------------
            */

            newElements =
              newElements.filter(
                el => el.id !== elementId
              );

            newElements.unshift(element);

            console.log(
              '⬇️ Elemento enviado al fondo:',
              elementId
            );

            continue;
          }


          /*
          =================================================
          ADD TEXT
          =================================================
          */

          if (functionName === 'addText') {

            const newTextId =
              `txt_${Date.now()}_${Math.random()
                .toString(36)
                .slice(2, 7)}`;


            const newText = {

              id: newTextId,

              type: 'text',

              text:
                args.text ||
                'Nuevo Texto',

              xCm:
                Number.isFinite(Number(args.xCm))
                  ? Number(args.xCm)
                  : page.widthCm / 2,

              yCm:
                Number.isFinite(Number(args.yCm))
                  ? Number(args.yCm)
                  : page.heightCm / 2,

              fontSize:
                Number.isFinite(Number(args.fontSize))
                  ? Number(args.fontSize)
                  : 10,

              color:
                args.color ||
                '#1e293b',

              fontFamily:
                args.fontFamily ||
                'sans-serif',

              rotation:
                Number(args.rotation) || 0
            };


            newElements.push(newText);

            console.log(
              '✏️ Texto creado:',
              newText
            );

            continue;
          }


          /*
          =================================================
          UPDATE TEXT
          =================================================
          */

          if (functionName === 'updateText') {

            const elementId =
              args.elementId;

            if (!elementId) {
              continue;
            }

            newElements =
              newElements.map(element => {

                if (
                  element.id !== elementId
                ) {
                  return element;
                }

                return {
                  ...element,

                  ...(args.text !== undefined
                    ? {
                        text: args.text
                      }
                    : {}),

                  ...(args.fontSize !== undefined
                    ? {
                        fontSize:
                          Number(args.fontSize)
                      }
                    : {}),

                  ...(args.color !== undefined
                    ? {
                        color: args.color
                      }
                    : {}),

                  ...(args.fontFamily !== undefined
                    ? {
                        fontFamily:
                          args.fontFamily
                      }
                    : {}),

                  ...(args.rotation !== undefined
                    ? {
                        rotation:
                          Number(args.rotation)
                      }
                    : {})
                };
              });

            continue;
          }


          /*
          =================================================
          TOOL DESCONOCIDA
          =================================================
          */

          console.warn(
            '⚠️ Tool no reconocida:',
            functionName
          );
        }


        /*
        ===================================================
        DEVOLVER PÁGINA ACTUALIZADA
        ===================================================
        */

        return {
          ...page,
          elements: newElements
        };
      });
    });


    /*
    =======================================================
    5. LIMPIAR PROMPT
    =======================================================
    */

    setAiPrompt('');

    /*
    =======================================================
    6. MENSAJE
    =======================================================
    */

    showToast(
      `Diseño generado: ${toolCalls.length} acciones`
    );


  } catch (error) {

    console.error(
      '❌ Error generando diseño con IA:',
      error
    );

    showToast(
      error.message ||
      'No se pudo generar el diseño'
    );

  } finally {

    setIsGenerating(false);
  }
};
  const handleWheelZoom = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setUserZoomMultiplier(prev => Math.min(Math.max(0.3, prev * zoomFactor), 4.0));
    }
  };

 const renderCanvas = () => {
  const availableW = Math.max(300, viewportSize.width - 120);
  const availableH = Math.max(300, viewportSize.height - 120);

  /* Valores seguros para evitar divisiones entre 0 */
  const safeW = Math.max(1, currentPage.widthCm || 1);
  const safeH = Math.max(1, currentPage.heightCm || 1);

  const fitScale = Math.min(availableW / safeW, availableH / safeH);
  const zoomScale = fitScale * userZoomMultiplier;

  const displayWidth = safeW * zoomScale;
  const displayHeight = safeH * zoomScale;

  const rulerTicks = [];
  const maxCm = Math.max(safeW, safeH);
  const step = maxCm > 200 ? 20 : maxCm > 100 ? 10 : 5;
  for (let i = 0; i <= maxCm; i += step) {
    rulerTicks.push(i);
  }

    return (
      <div 
        ref={canvasViewportRef}
        className="flex-1 bg-slate-900 relative overflow-auto flex items-center justify-center p-12 select-none"
        onPointerDown={() => setSelectedElementId(null)}
        onWheel={handleWheelZoom}
      >
        <div className="relative my-auto mx-auto transition-all duration-75">
          
          {/* Regla Horizontal */}
          <div className="absolute bottom-full left-0 right-0 h-6 bg-slate-950/90 border-b border-slate-700 select-none">
            {rulerTicks.filter(cm => cm <= currentPage.widthCm).map(cm => {
              const isMajor = cm % (step * 2) === 0 || cm === 0;
              return (
                <div 
                  key={`h-${cm}`} 
                  className={`absolute bottom-0 border-l border-slate-500 ${isMajor ? 'h-full' : 'h-1/3'}`}
                  style={{ left: `${(cm / currentPage.widthCm) * 100}%` }}
                >
                  {isMajor && <span className="text-[8px] text-slate-400 absolute left-0.5 top-0 font-medium">{cm}</span>}
                </div>
              );
            })}
          </div>

          {/* Regla Vertical */}
          <div className="absolute right-full top-0 bottom-0 w-6 bg-slate-950/90 border-r border-slate-700 select-none">
            {rulerTicks.filter(cm => cm <= currentPage.heightCm).map(cm => {
              const isMajor = cm % (step * 2) === 0 || cm === 0;
              return (
                <div 
                  key={`v-${cm}`} 
                  className={`absolute right-0 border-b border-slate-500 ${isMajor ? 'w-full' : 'w-1/3'}`}
                  style={{ bottom: `${(cm / currentPage.heightCm) * 100}%` }}
                >
                  {isMajor && <span className="text-[8px] text-slate-400 absolute left-0.5 bottom-0.5 font-medium">{cm}</span>}
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-full right-full w-6 h-6 bg-slate-950 border-b border-r border-slate-700 flex items-center justify-center">
            <span className="text-[8px] font-mono text-amber-500 font-bold">cm</span>
          </div>

          {/* Lienzo Físico Auto-Ajustable */}
         <div 
  ref={canvasRef}
  data-ai-canvas="true"
  className="relative bg-white shadow-2xl overflow-hidden cursor-crosshair transition-all duration-100"
            style={{
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
              backgroundColor: currentPage.bgColor,
              borderRadius: currentPage.shape === 'round_panel' ? '50%' : '4px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {currentPage.elements.map(el => (
              <InteractiveNode 
                key={el.id} 
                element={el} 
                zoomScale={zoomScale}
                isSelected={selectedElementId === el.id}
                isAICapturing={isAICapturing}
                onSelect={() => { setSelectedElementId(el.id); setActiveTool(el.type === 'text' ? 'texto' : 'ordenar'); }}
                onChange={(updatedEl) => updateElement(el.id, updatedEl)}
                onDragStart={recordHistory}
                onDuplicate={() => duplicateElement(el.id)}
                onDelete={() => deleteElement(el.id)}
                onBringToFront={() => bringToFront(el.id)}
                onSendToBack={() => sendToBack(el.id)}
                resources={resources} // <--- AÑADE ESTA LÍNEA AQUÍ
              />
            ))}
          </div>
        </div>

        {/* FLOATING ZOOM TOOLBAR OVERLAY */}
        <div className="absolute bottom-6 right-6 bg-slate-950/90 border border-slate-700/80 backdrop-blur-md text-slate-200 rounded-2xl p-1.5 flex items-center space-x-1.5 shadow-2xl z-40 select-none animate-in fade-in duration-200">
          <button 
            onClick={() => setUserZoomMultiplier(prev => Math.max(0.3, prev - 0.15))}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-amber-400 transition-colors"
            title="Alejar vista (-)"
          >
            <ZoomOut size={16} />
          </button>
          <button 
  onClick={() => setUserZoomMultiplier(prev => Math.max(0.3, prev - 0.15))}
  className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-amber-400 transition-colors"
  title="Alejar vista (-)"
>
  <ZoomOut size={16} />
</button>

          <div className="relative group">
            <button className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono font-bold text-amber-400 hover:border-amber-500 transition-colors min-w-[62px] text-center">
              {Math.round(userZoomMultiplier * 100)}%
            </button>
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-xl text-xs space-y-0.5 z-50">
              {[0.5, 0.75, 1.0, 1.25, 1.5, 2.0].map(scaleVal => (
                <button
                  key={scaleVal}
                  onClick={() => setUserZoomMultiplier(scaleVal)}
                  className={`px-3 py-1 text-left rounded-lg transition-colors font-mono text-[11px] ${
                    userZoomMultiplier === scaleVal ? 'bg-amber-500/20 text-amber-400 font-bold' : 'hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  {Math.round(scaleVal * 100)}% {scaleVal === 1.0 && '(Auto Fit)'}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => setUserZoomMultiplier(prev => Math.min(4.0, prev + 0.15))}
            className="p-2 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-amber-400 transition-colors"
            title="Acercar vista (+)"
          >
            <ZoomIn size={16} />
          </button>

          <div className="w-px h-5 bg-slate-800 my-auto mx-0.5" />

          <button 
            onClick={() => setUserZoomMultiplier(1.0)}
            className={`p-2 rounded-xl transition-colors flex items-center space-x-1.5 text-xs font-medium ${
              userZoomMultiplier === 1.0 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Ajustar automáticamente al máximo espacio de pantalla"
          >
            <Maximize size={15} />
            <span className="hidden sm:inline text-[11px]">Auto Fit</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden select-none">
      
      {/* REAL-TIME TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-16 right-6 bg-amber-500/90 text-slate-950 font-bold px-4 py-2 rounded-xl shadow-2xl backdrop-blur-md z-[99999] text-xs flex items-center space-x-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <Sparkles size={14} />
          <span>{toastMessage}</span>
        </div>
      )}

      {}
      <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded flex items-center justify-center shadow-lg">
            <Sparkles size={18} className="text-slate-900" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">EventStudio Pro</span>
        </div>

        <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button onClick={() => setViewMode('designer')} className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${viewMode === 'designer' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}>Diseñador de Fundas</button>
          <button onClick={() => setViewMode('stage')} className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${viewMode === 'stage' ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}>Armador 3D</button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-slate-900/80 p-1 border border-slate-800 rounded-lg">
            <button 
              onClick={handleUndo}
              disabled={past.length === 0}
              className={`p-1.5 rounded transition-all ${past.length > 0 ? 'text-slate-300 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'}`}
              title="Deshacer (Ctrl+Z)"
            >
              <Undo size={16} />
            </button>
            <button 
              onClick={handleRedo}
              disabled={future.length === 0}
              className={`p-1.5 rounded transition-all ${future.length > 0 ? 'text-slate-300 hover:text-amber-400 hover:bg-slate-800' : 'text-slate-600 cursor-not-allowed'}`}
              title="Rehacer (Ctrl+Y / Ctrl+Shift+Z)"
            >
              <Redo size={16} />
            </button>
          </div>

          <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 text-sm font-bold rounded shadow-lg shadow-orange-500/20 flex items-center space-x-2">
            <Download size={16} />
            <span>Exportar HD</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      {viewMode === 'designer' ? (
        <div className="flex flex-1 overflow-hidden">
          
          {/* TOOLBAR SIDEBAR */}
          <div className="w-16 bg-slate-950 border-r border-slate-800 flex flex-col items-center py-4 space-y-2 z-20">
            {[
              { id: 'ia', icon: <Bot size={22} />, label: 'IA' },
              { id: 'medidas', icon: <Ruler size={22} />, label: 'Fondo' },
              { id: 'ordenar', icon: <Layers size={22} />, label: 'Capas' },
              { id: 'libreria', icon: <LucideImage size={22} />, label: 'Librería' },
              { id: 'texto', icon: <Type size={22} />, label: 'Texto' }
            ].map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className={`w-12 h-12 flex flex-col items-center justify-center rounded-xl transition-all relative ${
                  activeTool === tool.id ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                {tool.icon}
                <span className="text-[8px] mt-1 font-medium">{tool.label}</span>
                {activeTool === tool.id && <div className="absolute left-0 top-2 bottom-2 w-1 bg-amber-500 rounded-r-full" />}
              </button>
            ))}
          </div>

          {/* TOOL PANEL (EXPANDED) */}
          <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-10 overflow-y-auto shadow-xl">
            
            {activeTool === 'ia' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center space-x-2 text-indigo-400 mb-2">
                  <Wand2 size={18} />
                  <h3 className="text-sm font-bold">Orquestador IA</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">Escribe qué necesitas diseñar. La IA buscará en tus recursos y armará las capas automáticamente.</p>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder='Ej: "Cilindro de 150x80 con temática de la sirenita"'
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm text-slate-200 h-32 focus:border-indigo-500 outline-none"
                />
                <button
  onClick={handleGenerateAIDesign}
  disabled={isGenerating || !aiPrompt.trim()}
  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
>
  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
  <span>Generar Capas y Medidas</span>
</button>

<button
  onClick={testCaptureCanvas}
  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
>
  <LucideImage size={14} />
  <span>👁️ Analizar con Gemini</span>
</button>
              </div>
            )}

            {activeTool === 'medidas' && (
              <div className="p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">Propiedades del Molde</h3>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Formato</label>
                  <select 
                    value={currentPage.shape}
                    onChange={(e) => updatePage({ shape: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="rect_banner">Funda Cilindro / Panel Recto</option>
                    <option value="round_panel">Funda Panel Circular</option>
                  </select>
                </div>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 block mb-1">Ancho (cm)</label>
                    <input 
                      type="number" 
                      value={currentPage.widthCm || ''} 
                      onFocus={recordHistory}
                      onChange={(e) => updatePageDirect({ widthCm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-slate-400 block mb-1">Alto (cm)</label>
                    <input 
                      type="number" 
                      value={currentPage.heightCm || ''} 
                      onFocus={recordHistory}
                      onChange={(e) => updatePageDirect({ heightCm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Color de Fondo Tela</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="color" 
                      value={currentPage.bgColor} 
                      onPointerDown={recordHistory}
                      onChange={(e) => updatePageDirect({ bgColor: e.target.value })} 
                      className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0" 
                    />
                    <input 
                      type="text" 
                      value={currentPage.bgColor} 
                      onFocus={recordHistory}
                      onChange={(e) => updatePageDirect({ bgColor: e.target.value })} 
                      className="flex-1 bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 uppercase" 
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold block">Atajos Teclado</span>
                  <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 text-[11px] space-y-1.5 text-slate-400 font-mono">
                    <div className="flex justify-between"><span>Deshacer:</span><span className="text-amber-400">Ctrl + Z</span></div>
                    <div className="flex justify-between"><span>Rehacer:</span><span className="text-amber-400">Ctrl + Y</span></div>
                    <div className="flex justify-between"><span>Eliminar:</span><span className="text-rose-400">Supr / Del</span></div>
                    <div className="flex justify-between"><span>Duplicar:</span><span className="text-amber-400">Ctrl + D</span></div>
                    <div className="flex justify-between"><span>Zoom Rueda:</span><span className="text-indigo-400">Ctrl + Wheel</span></div>
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'libreria' && (
              <div className="p-4 flex flex-col h-full">
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 mb-4">Tus Recursos
                  <input
  ref={resourceFileInputRef}
  type="file"
  accept="image/*"
  className="hidden"
  onChange={handleUploadResource}
/>

<button
  onClick={() => resourceFileInputRef.current?.click()}
  disabled={isUploadingResource}
  className="w-full mb-4 px-3 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 text-slate-950 font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
>
  {isUploadingResource ? (
    <>
      <Loader2 size={16} className="animate-spin" />
      Subiendo...
    </>
  ) : (
    <>
      <Plus size={16} />
      Subir imagen
    </>
  )}
</button>
                </h3>
                <div className="grid grid-cols-2 gap-2 overflow-y-auto">
                  {resources.map(res => (
                    <div 
                      key={res.id} 
                      onClick={() => addImageElement(res.id)}
                      className="aspect-square bg-slate-950 border border-slate-800 rounded-lg p-1 cursor-pointer hover:border-amber-500 transition-colors group relative"
                    >
                      <img src={res.url} alt={res.label} className="w-full h-full object-cover rounded opacity-80 group-hover:opacity-100" />
                      <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-1 text-[9px] text-center text-white truncate rounded-b">
                        {res.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTool === 'texto' && (
              <div className="p-4 space-y-4">
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">Herramientas de Texto</h3>
                <button onClick={addTextElement} className="w-full py-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded hover:bg-amber-500/20 text-sm font-medium flex items-center justify-center space-x-2">
                  <Plus size={16} /> <span>Añadir Texto Nuevo</span>
                </button>

                {selectedElementId && currentPage.elements.find(e => e.id === selectedElementId)?.type === 'text' && (
                  <div className="mt-6 space-y-4 bg-slate-950/50 p-3 rounded-lg border border-slate-800">
                    {(() => {
                      const el = currentPage.elements.find(e => e.id === selectedElementId);
                      return (
                        <>
                          <div>
                            <label className="text-[10px] text-slate-400 block mb-1">Contenido (Enter para párrafos)</label>
                            <textarea 
                              value={el.text} 
                              onChange={(e) => updateElement(el.id, { text: e.target.value })}
                              placeholder="Escribe tu texto aquí...&#10;Presiona Enter para nuevo párrafo"
                              className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-slate-200 h-24 outline-none focus:border-amber-500 font-sans"
                            />
                          </div>
                          <div className="flex space-x-2">
                             <div className="flex-1">
                               <label className="text-[10px] text-slate-400 block mb-1">Tamaño</label>
                               <input type="number" value={Math.round(el.fontSize)} onChange={(e) => updateElement(el.id, { fontSize: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-sm text-center" />
                             </div>
                             <div className="flex-1">
                               <label className="text-[10px] text-slate-400 block mb-1">Color</label>
                               <input type="color" value={el.color || '#ffffff'} onChange={(e) => updateElement(el.id, { color: e.target.value })} className="w-full h-8 bg-transparent cursor-pointer rounded" />
                             </div>
                          </div>
                          <div>
                             <label className="text-[10px] text-slate-400 block mb-1">Alineación del Texto</label>
                             <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                               <button 
                                 onClick={() => updateElement(el.id, { textAlign: 'left' })}
                                 className={`py-1.5 flex items-center justify-center rounded transition-colors ${el.textAlign === 'left' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}`}
                                 title="Alinear a la izquierda"
                               >
                                 <AlignLeft size={16} />
                               </button>
                               <button 
                                 onClick={() => updateElement(el.id, { textAlign: 'center' })}
                                 className={`py-1.5 flex items-center justify-center rounded transition-colors ${(!el.textAlign || el.textAlign === 'center') ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}`}
                                 title="Centrar"
                               >
                                 <AlignCenter size={16} />
                               </button>
                               <button 
                                 onClick={() => updateElement(el.id, { textAlign: 'right' })}
                                 className={`py-1.5 flex items-center justify-center rounded transition-colors ${el.textAlign === 'right' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-slate-200'}`}
                                 title="Alinear a la derecha"
                               >
                                 <AlignRight size={16} />
                               </button>
                             </div>
                          </div>
                          <div>
                             <label className="text-[10px] text-slate-400 block mb-1">Tipografía</label>
                             <select value={el.fontFamily} onChange={(e) => updateElement(el.id, { fontFamily: e.target.value })} className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-sm">
                               <option value="sans-serif">Modern (Sans)</option>
                               <option value="Georgia, serif">Elegante (Serif)</option>
                               <option value="'Brush Script MT', cursive">Cursiva (Script)</option>
                             </select>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {activeTool === 'ordenar' && (
              <div className="p-4 flex flex-col h-full">
                <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 mb-2">Capas del Diseño</h3>
                <p className="text-[10px] text-slate-400 mb-4 leading-tight">
                  Arrastra para reordenar. La capa más alta está por encima de las demás.
                </p>
                <div className="space-y-1 overflow-y-auto pr-1 pb-20">
                  {[...currentPage.elements].reverse().map((el, index) => (
                    <div 
                      key={el.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragEnter={(e) => handleDragEnter(e, index)}
                      onDragOver={(e) => e.preventDefault()}
                      onDragEnd={() => { setDragItemIndex(null); setDragOverItemIndex(null); }}
                      onDrop={(e) => handleDrop(e, index)}
                      onClick={() => setSelectedElementId(el.id)}
                      className={`flex items-center justify-between p-2 rounded border cursor-grab active:cursor-grabbing transition-all ${
                        selectedElementId === el.id ? 'bg-slate-800 border-amber-500' : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                      } ${dragOverItemIndex === index ? 'border-t-2 border-t-amber-400 mt-2' : ''} ${dragItemIndex === index ? 'opacity-40 border-dashed' : ''}`}
                    >
                      <div className="flex items-center space-x-2 overflow-hidden pointer-events-none">
                        <GripVertical size={14} className="text-slate-600 shrink-0" />
                        {el.type === 'text' ? <Type size={14} className="text-slate-400 shrink-0" /> : <LucideImage size={14} className="text-slate-400 shrink-0" />}
                        <span className="text-xs text-slate-200 truncate">{el.label || el.text || 'Elemento'}</span>
                      </div>
                      {selectedElementId === el.id && (
                        <div className="flex items-center space-x-1">
                          <button onClick={(e) => { e.stopPropagation(); duplicateElement(el.id); }} className="text-amber-400 hover:text-amber-300 p-1" title="Duplicar"><Copy size={13} /></button>
                          <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="text-rose-400 hover:text-rose-300 p-1" title="Eliminar (Supr)"><Trash2 size={13} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                  {currentPage.elements.length === 0 && <p className="text-xs text-slate-500 text-center mt-10">No hay capas. Usa la librería o la IA.</p>}
                </div>
              </div>
            )}
          </div>

          {/* MAIN CANVAS AREA */}
          <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900">
            {renderCanvas()}

            {}
            <div className="h-12 bg-slate-950 border-t border-slate-800 flex items-center px-4 space-x-2 shrink-0 overflow-x-auto">
              {pages.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActivePageId(p.id)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-t-md border-b-2 transition-colors ${
                    activePageId === p.id ? 'bg-slate-800 text-amber-400 border-amber-500' : 'text-slate-400 border-transparent hover:bg-slate-900'
                  }`}
                >
                  {p.name}
                </button>
              ))}
              <button 
                onClick={addTab} 
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 flex items-center space-x-1 text-xs"
              >
                <Plus size={14} />
                <span>Añadir Pieza</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* 3D STAGE MODE */
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-900">
          <Shapes size={48} className="text-indigo-400 mb-4 animate-bounce" />
          <h2 className="text-xl font-bold text-white mb-2">Armador de Escenarios 3D</h2>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            Visualiza tus fundas y paneles montados en un entorno tridimensional para ver la presentación final de tu evento.
          </p>
          <button 
            onClick={() => setViewMode('designer')} 
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-sm transition-colors"
          >
            Volver al Diseñador
          </button>
        </div>
      )}
    </div>
  );
}