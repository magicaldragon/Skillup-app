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
  const [copiedStyles, setCopiedStyles] = useState<Record<string, string>>({});
  const [shadowValues, setShadowValues] = useState({ x: 0, y: 0, blur: 0, color: '#000000' });
  const [transformValues, setTransformValues] = useState({ rotate: 0, scale: 1 });
  const [activeEditor, setActiveEditor] = useState<'table' | 'menu' | null>(null);
  const [showLayoutManager, setShowLayoutManager] = useState(false);





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

  const updateElementStyle = useCallback((property: string, value: string) => {
    if (selectedElement && selectedElement.element) {
      selectedElement.element.style.setProperty(property, value);
    }
  }, [selectedElement]);

  const updateElementTransform = useCallback((type: 'rotate' | 'scale', value: string) => {
    if (selectedElement && selectedElement.element) {
      const newTransformValues = { ...transformValues, [type]: type === 'rotate' ? parseFloat(value) : parseFloat(value) };
      setTransformValues(newTransformValues);
      const transformString = `rotate(${newTransformValues.rotate}deg) scale(${newTransformValues.scale})`;
      selectedElement.element.style.transform = transformString;
    }
  }, [selectedElement, transformValues]);

  const updateBoxShadow = useCallback((property: 'x' | 'y' | 'blur' | 'color', value: string) => {
    if (selectedElement && selectedElement.element) {
      const newShadowValues = { ...shadowValues, [property]: property === 'color' ? value : parseFloat(value) };
      setShadowValues(newShadowValues);
      const shadowString = `${newShadowValues.x}px ${newShadowValues.y}px ${newShadowValues.blur}px ${newShadowValues.color}`;
      selectedElement.element.style.boxShadow = shadowString;
    }
  }, [selectedElement, shadowValues]);

  const resetElementStyles = useCallback(() => {
    if (selectedElement && selectedElement.element) {
      selectedElement.element.removeAttribute('style');
      setShadowValues({ x: 0, y: 0, blur: 0, color: '#000000' });
      setTransformValues({ rotate: 0, scale: 1 });
    }
  }, [selectedElement]);

  const copyElementStyles = useCallback(() => {
    if (selectedElement && selectedElement.element) {
      const computedStyles = window.getComputedStyle(selectedElement.element);
      const stylesToCopy: Record<string, string> = {};
      
      // Copy important style properties
      const propertiesToCopy = [
        'width', 'height', 'margin', 'padding', 'backgroundColor', 'color',
        'fontSize', 'fontWeight', 'textAlign', 'border', 'borderRadius',
        'boxShadow', 'transform', 'opacity', 'position', 'zIndex'
      ];
      
      propertiesToCopy.forEach(prop => {
        stylesToCopy[prop] = computedStyles.getPropertyValue(prop);
      });
      
      setCopiedStyles(stylesToCopy);
    }
  }, [selectedElement]);

  const pasteElementStyles = useCallback(() => {
    if (selectedElement && selectedElement.element && Object.keys(copiedStyles).length > 0) {
      Object.entries(copiedStyles).forEach(([property, value]) => {
        if (value) {
          selectedElement.element.style.setProperty(property, value);
        }
      });
    }
  }, [selectedElement, copiedStyles]);

  if (!isActive) {
    return <>{children}</>;
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="preview-mode-container">
        <div className="preview-toolbar">
          <h3>Editor Mode - Visual Editor</h3>
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
            <button 
              className="btn-primary"
              onClick={() => setShowLayoutManager(true)}
              title="Save current layout"
            >
              💾 Save Layout
            </button>
            <button 
              className="btn-secondary"
              onClick={resetElementStyles}
              title="Reset all element styles"
            >
              🔄 Reset
            </button>
            <button 
              className="btn-secondary"
              onClick={() => window.location.reload()}
              title="Exit Editor Mode"
            >
              ❌ Exit Preview
            </button>
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
          {/* Render actual application interface */}
          <div className="app-container">
            {/* Sidebar */}
            <div className="sidebar-preview">
              <div className="sidebar-header">
                <div className="user-profile">
                  <div className="avatar-placeholder">👤</div>
                  <div className="user-info">
                    <h4>Admin User</h4>
                    <span>Administrator</span>
                  </div>
                </div>
              </div>
              
              <nav className="sidebar-nav">
                <div className="nav-section">
                  <div className="nav-item active">
                    <span className="nav-icon">🏠</span>
                    <span>Dashboard</span>
                  </div>
                  
                  <div className="nav-group">
                    <div className="nav-group-header">
                      <span className="nav-icon">📁</span>
                      <span>Management</span>
                    </div>
                    <div className="nav-subitems">
                      <div className="nav-item">
                        <span className="nav-icon">👥</span>
                        <span>Add New Members</span>
                      </div>
                      <div className="nav-item">
                        <span className="nav-icon">💎</span>
                        <span>Potential Students</span>
                      </div>
                      <div className="nav-item">
                        <span className="nav-icon">⏳</span>
                        <span>Waiting List</span>
                      </div>
                      <div className="nav-item">
                        <span className="nav-icon">👨‍👩‍👧‍👦</span>
                        <span>Classes</span>
                      </div>
                      <div className="nav-item">
                        <span className="nav-icon">📊</span>
                        <span>Levels</span>
                      </div>
                      <div className="nav-item">
                        <span className="nav-icon">⚙️</span>
                        <span>Accounts</span>
                      </div>
                      <div className="nav-item">
                        <span className="nav-icon">📋</span>
                        <span>Records</span>
                      </div>
                      <div className="nav-item selected">
                        <span className="nav-icon">✏️</span>
                        <span>Editor Mode</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="nav-group">
                    <div className="nav-group-header">
                      <span className="nav-icon">📝</span>
                      <span>Assignments</span>
                    </div>
                    <div className="nav-subitems">
                      <div className="nav-item">
                        <span className="nav-icon">✅</span>
                        <span>Full Practice Tests</span>
                      </div>
                      <div className="nav-item">
                        <span className="nav-icon">📄</span>
                        <span>Mini Tests</span>
                      </div>
                      <div className="nav-item">
                        <span className="nav-icon">📖</span>
                        <span>Reading</span>
                      </div>
                      <div className="nav-item">
                        <span className="nav-icon">🎧</span>
                        <span>Listening</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="sidebar-footer">
                  <div className="nav-item">
                    <span className="nav-icon">⚙️</span>
                    <span>Settings</span>
                  </div>
                  <div className="nav-item">
                    <span className="nav-icon">🚪</span>
                    <span>Logout</span>
                  </div>
                </div>
              </nav>
            </div>
            
            {/* Main Content Area */}
            <div className="main-content-preview">
              <div className="dashboard-header">
                <h1>Welcome back, Admin!</h1>
                <p>Here's your system administration dashboard overview</p>
              </div>
              
              {/* Summary Cards */}
              <div className="dashboard-summary">
                <div className="summary-card">
                  <div className="card-icon">👥</div>
                  <div className="card-content">
                    <h3>Total Students</h3>
                    <div className="card-value">156</div>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon">👨‍🏫</div>
                  <div className="card-content">
                    <h3>Total Teachers</h3>
                    <div className="card-value">12</div>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon">📚</div>
                  <div className="card-content">
                    <h3>Total Classes</h3>
                    <div className="card-value">8</div>
                  </div>
                </div>
                
                <div className="summary-card">
                  <div className="card-icon">📝</div>
                  <div className="card-content">
                    <h3>Assignments</h3>
                    <div className="card-value">24</div>
                  </div>
                </div>
              </div>
              
              {/* Data Tables */}
              <div className="dashboard-tables">
                <div className="table-section">
                  <h3>Recent Students</h3>
                  <div className="data-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Level</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>John Smith</td>
                          <td>john@example.com</td>
                          <td>Intermediate</td>
                          <td><span className="status active">Active</span></td>
                          <td>
                            <button className="btn-sm">Edit</button>
                            <button className="btn-sm">View</button>
                          </td>
                        </tr>
                        <tr>
                          <td>Sarah Johnson</td>
                          <td>sarah@example.com</td>
                          <td>Advanced</td>
                          <td><span className="status active">Active</span></td>
                          <td>
                            <button className="btn-sm">Edit</button>
                            <button className="btn-sm">View</button>
                          </td>
                        </tr>
                        <tr>
                          <td>Mike Davis</td>
                          <td>mike@example.com</td>
                          <td>Beginner</td>
                          <td><span className="status pending">Pending</span></td>
                          <td>
                            <button className="btn-sm">Edit</button>
                            <button className="btn-sm">View</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="table-section">
                  <h3>Recent Classes</h3>
                  <div className="data-table">
                    <table>
                      <thead>
                        <tr>
                          <th>Class Name</th>
                          <th>Teacher</th>
                          <th>Students</th>
                          <th>Schedule</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>IELTS Preparation A1</td>
                          <td>Ms. Anderson</td>
                          <td>15</td>
                          <td>Mon, Wed, Fri 9:00 AM</td>
                          <td>
                            <button className="btn-sm">Manage</button>
                          </td>
                        </tr>
                        <tr>
                          <td>Business English B2</td>
                          <td>Mr. Thompson</td>
                          <td>12</td>
                          <td>Tue, Thu 2:00 PM</td>
                          <td>
                            <button className="btn-sm">Manage</button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {(selectedComponent || selectedElement) && !activeEditor && (
          <div className="component-properties">
            <h4>Element Properties</h4>
            
            {selectedElement && (
              <>
                <div className="property-group">
                  <label>Element Info</label>
                  <div className="element-info-display">
                    <span className="info-badge type">{selectedElement.type}</span>
                    <span className="info-badge name">{selectedElement.name}</span>
                  </div>
                </div>
                
                {/* Layout & Dimensions */}
                <div className="property-section">
                  <h4>Layout & Size</h4>
                  <div className="property-group">
                    <label>Width</label>
                    <div className="input-with-unit">
                      <input 
                        type="number" 
                        value={Math.round(selectedElement.rect.width)}
                        onChange={(e) => updateElementStyle('width', e.target.value + 'px')}
                      />
                      <span className="unit">px</span>
                    </div>
                  </div>
                  <div className="property-group">
                    <label>Height</label>
                    <div className="input-with-unit">
                      <input 
                        type="number" 
                        value={Math.round(selectedElement.rect.height)}
                        onChange={(e) => updateElementStyle('height', e.target.value + 'px')}
                      />
                      <span className="unit">px</span>
                    </div>
                  </div>
                  <div className="property-group">
                    <label>Max Width</label>
                    <div className="input-with-unit">
                      <input 
                        type="number" 
                        placeholder="Auto"
                        onChange={(e) => updateElementStyle('maxWidth', e.target.value ? e.target.value + 'px' : 'none')}
                      />
                      <span className="unit">px</span>
                    </div>
                  </div>
                </div>

                {/* Spacing */}
                <div className="property-section">
                  <h4>Spacing</h4>
                  <div className="spacing-grid">
                    <div className="spacing-row">
                      <label>Margin</label>
                      <div className="spacing-inputs">
                        <input type="number" placeholder="Top" onChange={(e) => updateElementStyle('marginTop', e.target.value + 'px')} />
                        <input type="number" placeholder="Right" onChange={(e) => updateElementStyle('marginRight', e.target.value + 'px')} />
                        <input type="number" placeholder="Bottom" onChange={(e) => updateElementStyle('marginBottom', e.target.value + 'px')} />
                        <input type="number" placeholder="Left" onChange={(e) => updateElementStyle('marginLeft', e.target.value + 'px')} />
                      </div>
                    </div>
                    <div className="spacing-row">
                      <label>Padding</label>
                      <div className="spacing-inputs">
                        <input type="number" placeholder="Top" onChange={(e) => updateElementStyle('paddingTop', e.target.value + 'px')} />
                        <input type="number" placeholder="Right" onChange={(e) => updateElementStyle('paddingRight', e.target.value + 'px')} />
                        <input type="number" placeholder="Bottom" onChange={(e) => updateElementStyle('paddingBottom', e.target.value + 'px')} />
                        <input type="number" placeholder="Left" onChange={(e) => updateElementStyle('paddingLeft', e.target.value + 'px')} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Colors & Appearance */}
                <div className="property-section">
                  <h4>Colors & Appearance</h4>
                  <div className="property-group">
                    <label>Background Color</label>
                    <div className="color-input-group">
                      <input 
                        type="color" 
                        onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="#ffffff or transparent"
                        onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="property-group">
                    <label>Text Color</label>
                    <div className="color-input-group">
                      <input 
                        type="color" 
                        onChange={(e) => updateElementStyle('color', e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="#000000"
                        onChange={(e) => updateElementStyle('color', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="property-group">
                    <label>Border</label>
                    <div className="border-inputs">
                      <input 
                        type="number" 
                        placeholder="Width"
                        onChange={(e) => updateElementStyle('borderWidth', e.target.value + 'px')}
                      />
                      <select onChange={(e) => updateElementStyle('borderStyle', e.target.value)}>
                        <option value="none">None</option>
                        <option value="solid">Solid</option>
                        <option value="dashed">Dashed</option>
                        <option value="dotted">Dotted</option>
                      </select>
                      <input 
                        type="color" 
                        onChange={(e) => updateElementStyle('borderColor', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="property-group">
                    <label>Border Radius</label>
                    <div className="input-with-unit">
                      <input 
                        type="number" 
                        placeholder="0"
                        onChange={(e) => updateElementStyle('borderRadius', e.target.value + 'px')}
                      />
                      <span className="unit">px</span>
                    </div>
                  </div>
                  <div className="property-group">
                    <label>Opacity</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      defaultValue="1"
                      onChange={(e) => updateElementStyle('opacity', e.target.value)}
                    />
                  </div>
                </div>

                {/* Typography */}
                <div className="property-section">
                  <h4>Typography</h4>
                  <div className="property-group">
                    <label>Font Size</label>
                    <div className="input-with-unit">
                      <input 
                        type="number" 
                        placeholder="16"
                        onChange={(e) => updateElementStyle('fontSize', e.target.value + 'px')}
                      />
                      <span className="unit">px</span>
                    </div>
                  </div>
                  <div className="property-group">
                    <label>Font Weight</label>
                    <select onChange={(e) => updateElementStyle('fontWeight', e.target.value)}>
                      <option value="normal">Normal</option>
                      <option value="bold">Bold</option>
                      <option value="lighter">Lighter</option>
                      <option value="100">100</option>
                      <option value="200">200</option>
                      <option value="300">300</option>
                      <option value="400">400</option>
                      <option value="500">500</option>
                      <option value="600">600</option>
                      <option value="700">700</option>
                      <option value="800">800</option>
                      <option value="900">900</option>
                    </select>
                  </div>
                  <div className="property-group">
                    <label>Text Align</label>
                    <select onChange={(e) => updateElementStyle('textAlign', e.target.value)}>
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                      <option value="justify">Justify</option>
                    </select>
                  </div>
                  <div className="property-group">
                    <label>Line Height</label>
                    <input 
                      type="number" 
                      step="0.1"
                      placeholder="1.5"
                      onChange={(e) => updateElementStyle('lineHeight', e.target.value)}
                    />
                  </div>
                </div>

                {/* Position & Transform */}
                <div className="property-section">
                  <h4>Position & Transform</h4>
                  <div className="property-group">
                    <label>Position</label>
                    <select onChange={(e) => updateElementStyle('position', e.target.value)}>
                      <option value="static">Static</option>
                      <option value="relative">Relative</option>
                      <option value="absolute">Absolute</option>
                      <option value="fixed">Fixed</option>
                      <option value="sticky">Sticky</option>
                    </select>
                  </div>
                  <div className="property-group">
                    <label>Z-Index</label>
                    <input 
                      type="number" 
                      placeholder="auto"
                      onChange={(e) => updateElementStyle('zIndex', e.target.value)}
                    />
                  </div>
                  <div className="property-group">
                    <label>Transform</label>
                    <div className="transform-inputs">
                      <input 
                        type="number" 
                        placeholder="Rotate (deg)"
                        onChange={(e) => updateElementTransform('rotate', e.target.value + 'deg')}
                      />
                      <input 
                        type="number" 
                        step="0.1"
                        placeholder="Scale"
                        onChange={(e) => updateElementTransform('scale', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Effects */}
                <div className="property-section">
                  <h4>Effects</h4>
                  <div className="property-group">
                    <label>Box Shadow</label>
                    <div className="shadow-inputs">
                      <input type="number" placeholder="X" onChange={(e) => updateBoxShadow('x', e.target.value)} />
                      <input type="number" placeholder="Y" onChange={(e) => updateBoxShadow('y', e.target.value)} />
                      <input type="number" placeholder="Blur" onChange={(e) => updateBoxShadow('blur', e.target.value)} />
                      <input type="color" onChange={(e) => updateBoxShadow('color', e.target.value)} />
                    </div>
                  </div>
                  <div className="property-group">
                    <label>Transition</label>
                    <input 
                      type="text" 
                      placeholder="all 0.3s ease"
                      onChange={(e) => updateElementStyle('transition', e.target.value)}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="property-section">
                  <h4>Actions</h4>
                  <div className="action-buttons">
                    <button className="btn-reset" onClick={resetElementStyles}>Reset Styles</button>
                    <button className="btn-copy" onClick={copyElementStyles}>Copy Styles</button>
                    <button className="btn-paste" onClick={pasteElementStyles}>Paste Styles</button>
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