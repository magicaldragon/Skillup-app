import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import ComponentSelector from './ComponentSelector';
import TableEditor from './TableEditor';
import MenuEditor from './MenuEditor';
import LayoutManager from './LayoutManager';
import './PreviewMode.css';

interface SelectableElement {
  id: string;
  type: 'table' | 'menu' | 'panel' | 'button' | 'form' | 'other';
  element: HTMLElement;
  rect: DOMRect;
  selector: string;
  name: string;
}

interface PreviewModeProps {
  isActive: boolean;
  children: React.ReactNode;
}

const PreviewMode: React.FC<PreviewModeProps> = ({ isActive, children }) => {

  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectableElement | null>(null);
  const [editMode, setEditMode] = useState<'select' | 'drag'>('select');
  const [activeEditor, setActiveEditor] = useState<'table' | 'menu' | null>(null);
  const [showLayoutManager, setShowLayoutManager] = useState(false);



  const handleSelect = useCallback((id: string) => {
    setSelectedComponent(id);
  }, []);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedComponent(null);
      setSelectedElement(null);
    }
  }, []);

  const handleElementSelect = useCallback((element: SelectableElement | null) => {
    setSelectedElement(element);
    setSelectedComponent(null);
    
    // Auto-detect editor type based on element
    if (element) {
      if (element.type === 'table') {
        // Don't auto-open, just prepare for manual opening
      } else if (element.type === 'menu') {
        // Don't auto-open, just prepare for manual opening
      }
    }
  }, []);

  const handleModeSwitch = useCallback((mode: 'select' | 'drag') => {
    setEditMode(mode);
    if (mode === 'select') {
      setSelectedComponent(null);
    } else {
      setSelectedElement(null);
    }
  }, []);

  const handleTableChange = useCallback((tableData: any) => {
    console.log('Table data changed:', tableData);
    // Apply table changes to the DOM
  }, []);

  const handleMenuChange = useCallback((menuData: any) => {
    console.log('Menu data changed:', menuData);
    // Apply menu changes to the DOM
  }, []);

  const handleLayoutLoad = useCallback((config: any) => {
    console.log('Loading layout configuration:', config);
    // Apply layout configuration to the application
    // This would involve updating component positions, styles, etc.
    setShowLayoutManager(false);
  }, []);

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="preview-mode-container">
        <div className="preview-toolbar">
          <h3>Preview Mode - Visual Editor</h3>
          <div className="toolbar-center">
            <div className="mode-switcher">
              <button 
                className={`mode-btn ${editMode === 'select' ? 'active' : ''}`}
                onClick={() => handleModeSwitch('select')}
              >
                🎯 Select
              </button>
              <button 
                className={`mode-btn ${editMode === 'drag' ? 'active' : ''}`}
                onClick={() => handleModeSwitch('drag')}
              >
                🔄 Drag
              </button>
            </div>
            <button 
              className="mode-btn"
              onClick={() => setShowLayoutManager(true)}
            >
              💾 Layouts
            </button>
          </div>
          <div className="toolbar-controls">
            <button className="btn-primary">💾 Save Layout</button>
            <button className="btn-secondary">🔄 Reset</button>
            <button className="btn-secondary">❌ Exit Preview</button>
          </div>
        </div>
        
        <ComponentSelector
          isActive={editMode === 'select'}
          onElementSelect={handleElementSelect}
          selectedElement={selectedElement}
        />
        
        <div 
          className={`preview-canvas ${editMode === 'select' ? 'selection-mode' : 'drag-mode'}`}
          onClick={handleCanvasClick}
        >
          {children}
        </div>
        
        {(selectedComponent || selectedElement) && !activeEditor && (
          <div className="component-properties">
            <h4>Element Properties</h4>
            
            {selectedElement && (
              <>
                <div className="property-group">
                  <label>Element Type</label>
                  <input type="text" value={selectedElement.type} readOnly />
                </div>
                <div className="property-group">
                  <label>Element Name</label>
                  <input type="text" value={selectedElement.name} readOnly />
                </div>
                <div className="property-group">
                  <label>Element ID</label>
                  <input type="text" value={selectedElement.id} readOnly />
                </div>
                <div className="property-group">
                  <label>Dimensions</label>
                  <div className="dimension-inputs">
                    <input 
                      type="number" 
                      placeholder="Width" 
                      value={Math.round(selectedElement.rect.width)}
                      readOnly
                    />
                    <span>×</span>
                    <input 
                      type="number" 
                      placeholder="Height" 
                      value={Math.round(selectedElement.rect.height)}
                      readOnly
                    />
                  </div>
                </div>
                <div className="property-group">
                  <label>Position</label>
                  <div className="dimension-inputs">
                    <input 
                      type="number" 
                      placeholder="X" 
                      value={Math.round(selectedElement.rect.left)}
                      readOnly
                    />
                    <span>,</span>
                    <input 
                      type="number" 
                      placeholder="Y" 
                      value={Math.round(selectedElement.rect.top)}
                      readOnly
                    />
                  </div>
                </div>
              </>
            )}
            
            {selectedComponent && (
              <div className="property-group">
                <label>Component ID: {selectedComponent}</label>
              </div>
            )}
            
            <div className="property-actions">
              <button className="btn-primary">✏️ Edit Styles</button>
              <button className="btn-secondary">📋 Copy</button>
              <button className="btn-danger">🗑️ Delete</button>
              {selectedElement && selectedElement.type === 'table' && (
                <button 
                  className="btn-primary"
                  onClick={() => setActiveEditor('table')}
                >
                  Edit Table
                </button>
              )}
              {selectedElement && selectedElement.type === 'menu' && (
                <button 
                  className="btn-primary"
                  onClick={() => setActiveEditor('menu')}
                >
                  Edit Menu
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Table Editor */}
        <TableEditor
          tableElement={activeEditor === 'table' && selectedElement ? selectedElement.element as HTMLTableElement : null}
          isActive={activeEditor === 'table'}
          onColumnsChange={handleTableChange}
          onClose={() => setActiveEditor(null)}
        />
        
        {/* Menu Editor */}
        <MenuEditor
          menuElement={activeEditor === 'menu' && selectedElement ? selectedElement.element : null}
          isActive={activeEditor === 'menu'}
          onMenuChange={handleMenuChange}
          onClose={() => setActiveEditor(null)}
        />
        
        {/* Layout Manager */}
        <LayoutManager
          isActive={showLayoutManager}
          onClose={() => setShowLayoutManager(false)}
          onLayoutLoad={handleLayoutLoad}
        />
      </div>
    </DndProvider>
  );
};

export default PreviewMode;