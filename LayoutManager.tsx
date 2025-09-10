import React, { useState, useCallback, useEffect } from 'react';
import './LayoutManager.css';

interface LayoutConfig {
  id: string;
  name: string;
  description?: string;
  timestamp: number;
  version: string;
  components: ComponentLayout[];
  tables: TableLayout[];
  menus: MenuLayout[];
  globalStyles: GlobalStyles;
}

interface ComponentLayout {
  id: string;
  type: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  styles: Record<string, string>;
  properties: Record<string, any>;
  visible: boolean;
  zIndex: number;
}

interface TableLayout {
  id: string;
  columns: ColumnConfig[];
  sorting: { column: string; direction: 'asc' | 'desc' }[];
  filters: Record<string, any>;
  pagination: { pageSize: number; currentPage: number };
}

interface ColumnConfig {
  id: string;
  name: string;
  width: number;
  visible: boolean;
  order: number;
  sortable: boolean;
  filterable: boolean;
}

interface MenuLayout {
  id: string;
  items: MenuItem[];
  collapsed: boolean;
  position: 'left' | 'right' | 'top' | 'bottom';
}

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  url?: string;
  children: MenuItem[];
  visible: boolean;
  order: number;
}

interface GlobalStyles {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  fontSize: number;
  fontFamily: string;
  borderRadius: number;
  spacing: number;
}

interface LayoutManagerProps {
  isActive: boolean;
  onClose: () => void;
  onLayoutLoad: (config: LayoutConfig) => void;
}

const LayoutManager: React.FC<LayoutManagerProps> = ({
  isActive,
  onClose,
  onLayoutLoad
}) => {
  const [savedLayouts, setSavedLayouts] = useState<LayoutConfig[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<LayoutConfig | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [layoutName, setLayoutName] = useState('');
  const [layoutDescription, setLayoutDescription] = useState('');

  // Load saved layouts from localStorage
  useEffect(() => {
    const loadSavedLayouts = () => {
      try {
        const saved = localStorage.getItem('skillup-layouts');
        if (saved) {
          const layouts = JSON.parse(saved) as LayoutConfig[];
          setSavedLayouts(layouts);
        }
      } catch (error) {
        console.error('Failed to load saved layouts:', error);
      }
    };

    if (isActive) {
      loadSavedLayouts();
    }
  }, [isActive]);

  // Extract current layout from DOM
  const extractCurrentLayout = useCallback((): LayoutConfig => {
    const components: ComponentLayout[] = [];
    const tables: TableLayout[] = [];
    const menus: MenuLayout[] = [];

    // Extract components
    const selectableElements = document.querySelectorAll('[data-selectable]');
    selectableElements.forEach((element, index) => {
      if (element instanceof HTMLElement) {
        const rect = element.getBoundingClientRect();
        const styles = window.getComputedStyle(element);
        
        components.push({
          id: element.id || `component-${index}`,
          type: element.getAttribute('data-type') || element.tagName.toLowerCase(),
          position: { x: rect.left, y: rect.top },
          size: { width: rect.width, height: rect.height },
          styles: {
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily,
            padding: styles.padding,
            margin: styles.margin,
            borderRadius: styles.borderRadius,
            border: styles.border
          },
          properties: {
            className: element.className,
            innerHTML: element.innerHTML
          },
          visible: !element.hidden && styles.display !== 'none',
          zIndex: parseInt(styles.zIndex) || 0
        });
      }
    });

    // Extract tables
    const tableElements = document.querySelectorAll('table');
    tableElements.forEach((table, index) => {
      const headers = Array.from(table.querySelectorAll('th')).map((th, colIndex) => ({
        id: `col-${colIndex}`,
        name: th.textContent || `Column ${colIndex + 1}`,
        width: th.offsetWidth,
        visible: !th.hidden,
        order: colIndex,
        sortable: th.hasAttribute('data-sortable'),
        filterable: th.hasAttribute('data-filterable')
      }));

      tables.push({
        id: table.id || `table-${index}`,
        columns: headers,
        sorting: [],
        filters: {},
        pagination: { pageSize: 10, currentPage: 1 }
      });
    });

    // Extract menus
    const menuElements = document.querySelectorAll('nav, .menu, .sidebar');
    menuElements.forEach((menu, index) => {
      const extractMenuItems = (container: Element): MenuItem[] => {
        const items: MenuItem[] = [];
        const links = container.querySelectorAll('a, button, .menu-item');
        
        links.forEach((link, itemIndex) => {
          if (link instanceof HTMLElement) {
            items.push({
              id: link.id || `menu-item-${itemIndex}`,
              label: link.textContent?.trim() || `Item ${itemIndex + 1}`,
              icon: link.querySelector('.icon')?.textContent || undefined,
              url: link.getAttribute('href') || undefined,
              children: [],
              visible: !link.hidden,
              order: itemIndex
            });
          }
        });
        
        return items;
      };

      menus.push({
        id: menu.id || `menu-${index}`,
        items: extractMenuItems(menu),
        collapsed: menu.classList.contains('collapsed'),
        position: 'left' // Default position
      });
    });

    // Get global styles
    const rootStyles = window.getComputedStyle(document.documentElement);
    const globalStyles: GlobalStyles = {
      theme: document.body.classList.contains('dark') ? 'dark' : 'light',
      primaryColor: rootStyles.getPropertyValue('--primary-color') || '#3498db',
      secondaryColor: rootStyles.getPropertyValue('--secondary-color') || '#2c3e50',
      fontSize: parseInt(rootStyles.fontSize) || 14,
      fontFamily: rootStyles.fontFamily || 'Arial, sans-serif',
      borderRadius: parseInt(rootStyles.getPropertyValue('--border-radius')) || 4,
      spacing: parseInt(rootStyles.getPropertyValue('--spacing')) || 8
    };

    return {
      id: `layout-${Date.now()}`,
      name: layoutName || `Layout ${new Date().toLocaleString()}`,
      description: layoutDescription,
      timestamp: Date.now(),
      version: '1.0.0',
      components,
      tables,
      menus,
      globalStyles
    };
  }, [layoutName, layoutDescription]);

  // Save current layout
  const saveCurrentLayout = useCallback(() => {
    if (!layoutName.trim()) {
      alert('Please enter a layout name');
      return;
    }

    const layout = extractCurrentLayout();
    const updatedLayouts = [...savedLayouts, layout];
    
    try {
      localStorage.setItem('skillup-layouts', JSON.stringify(updatedLayouts));
      setSavedLayouts(updatedLayouts);
      setSaveDialogOpen(false);
      setLayoutName('');
      setLayoutDescription('');
      alert('Layout saved successfully!');
    } catch (error) {
      console.error('Failed to save layout:', error);
      alert('Failed to save layout. Please try again.');
    }
  }, [extractCurrentLayout, layoutName, savedLayouts, layoutDescription]);

  // Load selected layout
  const loadLayout = useCallback((layout: LayoutConfig) => {
    onLayoutLoad(layout);
    setSelectedLayout(layout);
    alert(`Layout "${layout.name}" loaded successfully!`);
  }, [onLayoutLoad]);

  // Delete layout
  const deleteLayout = useCallback((layoutId: string) => {
    if (confirm('Are you sure you want to delete this layout?')) {
      const updatedLayouts = savedLayouts.filter(layout => layout.id !== layoutId);
      setSavedLayouts(updatedLayouts);
      localStorage.setItem('skillup-layouts', JSON.stringify(updatedLayouts));
    }
  }, [savedLayouts]);

  // Export layout to file
  const exportLayout = useCallback((layout: LayoutConfig) => {
    setIsExporting(true);
    try {
      const dataStr = JSON.stringify(layout, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${layout.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export layout:', error);
      alert('Failed to export layout.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  // Import layout from file
  const importLayout = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const layout = JSON.parse(content) as LayoutConfig;
        
        // Validate layout structure
        if (!layout.id || !layout.name || !layout.components) {
          throw new Error('Invalid layout file format');
        }
        
        // Add imported layout to saved layouts
        layout.id = `imported-${Date.now()}`;
        const updatedLayouts = [...savedLayouts, layout];
        setSavedLayouts(updatedLayouts);
        localStorage.setItem('skillup-layouts', JSON.stringify(updatedLayouts));
        
        alert(`Layout "${layout.name}" imported successfully!`);
      } catch (error) {
        console.error('Failed to import layout:', error);
        alert('Failed to import layout. Please check the file format.');
      } finally {
        setIsImporting(false);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  }, [savedLayouts]);

  if (!isActive) return null;

  return (
    <div className="layout-manager-overlay">
      <div className="layout-manager">
        <div className="layout-manager-header">
          <h3>💾 Layout Manager</h3>
          <button className="close-btn" onClick={onClose} title="Close Layout Manager">
            ❌
          </button>
        </div>
        
        <div className="layout-manager-content">
          <div className="layout-actions">
            <button 
              className="save-btn"
              onClick={() => setSaveDialogOpen(true)}
              title="Save current layout configuration"
            >
              💾 Save Layout
            </button>
            
            <label className="import-btn" title="Import layout from file">
              📁 Import
              <input 
                type="file"
                accept=".json"
                onChange={importLayout}
                disabled={isImporting}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          
          <div className="saved-layouts">
            <h4>Saved Layouts ({savedLayouts.length})</h4>
            
            {savedLayouts.length === 0 ? (
              <div className="no-layouts">
                <p>No saved layouts found.</p>
                <p>Save your current layout to get started!</p>
              </div>
            ) : (
              <div className="layouts-grid">
                {savedLayouts.map((layout) => (
                  <div 
                    key={layout.id} 
                    className={`layout-card ${selectedLayout?.id === layout.id ? 'selected' : ''}`}
                  >
                    <div className="layout-info">
                      <h5>{layout.name}</h5>
                      {layout.description && (
                        <p className="layout-description">{layout.description}</p>
                      )}
                      <div className="layout-meta">
                        <span className="layout-date">
                          {new Date(layout.timestamp).toLocaleDateString()}
                        </span>
                        <span className="layout-components">
                          {layout.components.length} components
                        </span>
                      </div>
                    </div>
                    
                    <div className="layout-actions">
                      <button 
                        className="load-btn"
                        onClick={() => loadLayout(layout)}
                        title="Load this layout"
                      >
                        📂 Load
                      </button>
                      <button 
                        className="export-btn"
                        onClick={() => exportLayout(layout)}
                        disabled={isExporting}
                        title="Export layout to file"
                      >
                        📤 Export
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => deleteLayout(layout.id)}
                        title="Delete this layout"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Save Dialog */}
        {saveDialogOpen && (
          <div className="save-dialog-overlay">
            <div className="save-dialog">
              <h4>Save Layout</h4>
              
              <div className="form-group">
                <label>Layout Name *</label>
                <input 
                  type="text"
                  value={layoutName}
                  onChange={(e) => setLayoutName(e.target.value)}
                  placeholder="Enter layout name"
                  autoFocus
                />
              </div>
              
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea 
                  value={layoutDescription}
                  onChange={(e) => setLayoutDescription(e.target.value)}
                  placeholder="Describe this layout..."
                  rows={3}
                />
              </div>
              
              <div className="dialog-actions">
                <button 
                  className="save-btn"
                  onClick={saveCurrentLayout}
                  disabled={!layoutName.trim()}
                >
                  💾 Save
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setSaveDialogOpen(false);
                    setLayoutName('');
                    setLayoutDescription('');
                  }}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LayoutManager;