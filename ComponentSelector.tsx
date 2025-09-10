import React, { useState, useEffect, useCallback, useRef } from 'react';
import './ComponentSelector.css';

interface SelectableElement {
  id: string;
  type: 'table' | 'menu' | 'panel' | 'button' | 'form' | 'other';
  element: HTMLElement;
  rect: DOMRect;
  selector: string;
  name: string;
}

interface ComponentSelectorProps {
  isActive: boolean;
  onElementSelect: (element: SelectableElement | null) => void;
  selectedElement: SelectableElement | null;
}

const ComponentSelector: React.FC<ComponentSelectorProps> = ({
  isActive,
  onElementSelect,
  selectedElement
}) => {
  const [hoveredElement, setHoveredElement] = useState<SelectableElement | null>(null);
  const [selectableElements, setSelectableElements] = useState<SelectableElement[]>([]);
  const overlayRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<HTMLDivElement>(null);

  // Identify selectable elements in the DOM
  const identifySelectableElements = useCallback(() => {
    const elements: SelectableElement[] = [];
    
    // Define selectors for different component types
    const selectors = {
      table: 'table, .management-table, .data-table, [class*="table"]',
      menu: '.sidebar, .navigation, .menu, [class*="nav"], [class*="menu"]',
      panel: '.panel, [class*="panel"], .card, [class*="card"]',
      button: 'button, .btn, [class*="btn"]',
      form: 'form, .form, [class*="form"]'
    };

    Object.entries(selectors).forEach(([type, selector]) => {
      const foundElements = document.querySelectorAll(selector);
      foundElements.forEach((element, index) => {
        if (element instanceof HTMLElement && element.offsetParent !== null) {
          const rect = element.getBoundingClientRect();
          
          // Skip very small elements or elements outside viewport
          if (rect.width > 20 && rect.height > 20) {
            const id = element.id || `${type}-${index}`;
            const name = element.getAttribute('data-name') || 
                        element.getAttribute('aria-label') ||
                        element.className.split(' ')[0] ||
                        element.tagName.toLowerCase();

            elements.push({
              id,
              type: type as SelectableElement['type'],
              element,
              rect,
              selector,
              name
            });
          }
        }
      });
    });

    setSelectableElements(elements);
  }, []);

  // Handle mouse movement for highlighting
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isActive) return;

    const elementFromPoint = document.elementFromPoint(e.clientX, e.clientY);
    if (!elementFromPoint) return;

    // Find the closest selectable element
    let targetElement: HTMLElement | null = elementFromPoint as HTMLElement;
    let foundSelectable: SelectableElement | null = null;

    while (targetElement && !foundSelectable) {
      foundSelectable = selectableElements.find(el => 
        el.element === targetElement || el.element.contains(targetElement)
      ) || null;
      
      if (!foundSelectable) {
        targetElement = targetElement.parentElement;
      }
    }

    setHoveredElement(foundSelectable);
  }, [isActive, selectableElements]);

  // Handle click for selection
  const handleClick = useCallback((e: MouseEvent) => {
    if (!isActive) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (hoveredElement) {
      onElementSelect(hoveredElement);
    }
  }, [isActive, hoveredElement, onElementSelect]);

  // Update highlight position
  const updateHighlight = useCallback((element: SelectableElement | null, isSelection = false) => {
    const targetRef = isSelection ? selectionRef : highlightRef;
    if (!targetRef.current || !element) {
      if (targetRef.current) {
        targetRef.current.style.display = 'none';
      }
      return;
    }

    const rect = element.element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    targetRef.current.style.display = 'block';
    targetRef.current.style.left = `${rect.left + scrollX}px`;
    targetRef.current.style.top = `${rect.top + scrollY}px`;
    targetRef.current.style.width = `${rect.width}px`;
    targetRef.current.style.height = `${rect.height}px`;
  }, []);

  // Initialize and cleanup event listeners
  useEffect(() => {
    if (isActive) {
      identifySelectableElements();
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleClick, true);
      
      // Prevent default drag behavior
      document.addEventListener('dragstart', (e) => e.preventDefault());
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('click', handleClick, true);
      };
    }
  }, [isActive, handleMouseMove, handleClick, identifySelectableElements]);

  // Update highlights when elements change
  useEffect(() => {
    updateHighlight(hoveredElement, false);
  }, [hoveredElement, updateHighlight]);

  useEffect(() => {
    updateHighlight(selectedElement, true);
  }, [selectedElement, updateHighlight]);

  // Re-identify elements on window resize
  useEffect(() => {
    const handleResize = () => {
      if (isActive) {
        setTimeout(identifySelectableElements, 100);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, identifySelectableElements]);

  if (!isActive) return null;

  return (
    <>
      {/* Overlay to capture events */}
      <div 
        ref={overlayRef}
        className="component-selector-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9998,
          pointerEvents: 'none'
        }}
      />
      
      {/* Hover highlight */}
      <div 
        ref={highlightRef}
        className="component-highlight hover"
        style={{ display: 'none' }}
      >
        {hoveredElement && (
          <div className="component-label hover-label">
            <span className="component-type">{hoveredElement.type}</span>
            <span className="component-name">{hoveredElement.name}</span>
          </div>
        )}
      </div>
      
      {/* Selection highlight */}
      <div 
        ref={selectionRef}
        className="component-highlight selected"
        style={{ display: 'none' }}
      >
        {selectedElement && (
          <>
            <div className="component-label selected-label">
              <span className="component-type">{selectedElement.type}</span>
              <span className="component-name">{selectedElement.name}</span>
            </div>
            
            {/* Selection handles */}
            <div className="selection-handles">
              <div className="selection-handle top-left"></div>
              <div className="selection-handle top-right"></div>
              <div className="selection-handle bottom-left"></div>
              <div className="selection-handle bottom-right"></div>
              <div className="selection-handle top"></div>
              <div className="selection-handle bottom"></div>
              <div className="selection-handle left"></div>
              <div className="selection-handle right"></div>
            </div>
          </>
        )}
      </div>
      
      {/* Element list sidebar */}
      {selectableElements.length > 0 && (
        <div className="elements-sidebar">
          <h4>Selectable Elements</h4>
          <div className="elements-list">
            {selectableElements.map((element) => (
              <div 
                key={element.id}
                className={`element-item ${selectedElement?.id === element.id ? 'active' : ''}`}
                onClick={() => onElementSelect(element)}
              >
                <div className="element-icon">
                  {element.type === 'table' && '📊'}
                  {element.type === 'menu' && '📋'}
                  {element.type === 'panel' && '🗂️'}
                  {element.type === 'button' && '🔘'}
                  {element.type === 'form' && '📝'}
                  {element.type === 'other' && '📦'}
                </div>
                <div className="element-info">
                  <div className="element-name">{element.name}</div>
                  <div className="element-type">{element.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ComponentSelector;