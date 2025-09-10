import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './MenuEditor.css';

interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  url?: string;
  element: HTMLElement;
  parent?: string;
  children: MenuItem[];
  order: number;
  visible: boolean;
  disabled: boolean;
  level: number;
}

interface DraggableMenuItemProps {
  item: MenuItem;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number, targetParent?: string) => void;
  onEdit: (item: MenuItem) => void;
  isEditing: boolean;
  level: number;
}

interface MenuEditorProps {
  menuElement: HTMLElement | null;
  isActive: boolean;
  onMenuChange: (items: MenuItem[]) => void;
  onClose: () => void;
}

const DraggableMenuItem: React.FC<DraggableMenuItemProps> = ({
  item,
  index,
  moveItem,
  onEdit,
  isEditing,
  level
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const [{ isDragging }, drag] = useDrag({
    type: 'menu-item',
    item: { id: item.id, index, level },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'menu-item',
    drop: (draggedItem: { id: string; index: number; level: number }) => {
      if (draggedItem.id !== item.id) {
        moveItem(draggedItem.index, index, item.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const handleToggleExpand = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleEdit = useCallback(() => {
    onEdit(item);
  }, [item, onEdit]);

  drag(drop(ref));

  return (
    <div
      ref={ref}
      className={`menu-item-wrapper ${
        isDragging ? 'dragging' : ''
      } ${
        isOver && canDrop ? 'drop-target' : ''
      }`}
      style={{
        marginLeft: `${level * 20}px`,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className={`menu-item ${!item.visible ? 'hidden' : ''} ${item.disabled ? 'disabled' : ''}`}>
        <div className="menu-item-content">
          {item.children.length > 0 && (
            <button 
              className="expand-btn"
              onClick={handleToggleExpand}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          
          <div className="item-info">
            {item.icon && <span className="item-icon">{item.icon}</span>}
            <span className="item-label">{item.label}</span>
            {item.url && <span className="item-url">{item.url}</span>}
          </div>
          
          {isEditing && (
            <div className="item-controls">
              <button 
                className="control-btn edit-btn"
                onClick={handleEdit}
                title="Edit Item"
              >
                ✏️
              </button>
              <button 
                className="control-btn visibility-btn"
                title="Toggle Visibility"
              >
                {item.visible ? '👁️' : '🙈'}
              </button>
              <button 
                className="control-btn disable-btn"
                title="Toggle Disabled"
              >
                {item.disabled ? '🚫' : '✅'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      {isExpanded && item.children.length > 0 && (
        <div className="menu-children">
          {item.children.map((child, childIndex) => (
            <DraggableMenuItem
              key={child.id}
              item={child}
              index={childIndex}
              moveItem={moveItem}
              onEdit={onEdit}
              isEditing={isEditing}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const MenuEditor: React.FC<MenuEditorProps> = ({
  menuElement,
  isActive,
  onMenuChange,
  onClose
}) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [originalMenu, setOriginalMenu] = useState<HTMLElement | null>(null);

  // Extract menu items from DOM element
  const extractMenuItems = useCallback((element: HTMLElement): MenuItem[] => {
    const items: MenuItem[] = [];
    
    const processElement = (el: HTMLElement, level = 0, parent?: string): MenuItem => {
      const id = el.id || `menu-item-${Date.now()}-${Math.random()}`;
      const label = el.textContent?.trim() || 'Menu Item';
      const url = el.getAttribute('href') || el.getAttribute('data-url') || undefined;
      const icon = el.querySelector('.icon, [class*="icon"]')?.textContent || undefined;
      
      const children: MenuItem[] = [];
      const childElements = el.querySelectorAll(':scope > ul > li, :scope > .submenu > .menu-item');
      
      childElements.forEach((child, index) => {
        if (child instanceof HTMLElement) {
          const childItem = processElement(child, level + 1, id);
          childItem.order = index;
          children.push(childItem);
        }
      });
      
      return {
        id,
        label,
        icon,
        url,
        element: el,
        parent,
        children,
        order: 0,
        visible: !el.hasAttribute('hidden') && el.style.display !== 'none',
        disabled: el.hasAttribute('disabled') || el.classList.contains('disabled'),
        level
      };
    };
    
    // Find menu items (links, buttons, list items)
    const menuSelectors = 'a, button, li, .menu-item, .nav-item';
    const topLevelItems = element.querySelectorAll(`:scope > ${menuSelectors}, :scope ul > li, :scope .menu > .menu-item`);
    
    topLevelItems.forEach((item, index) => {
      if (item instanceof HTMLElement) {
        const menuItem = processElement(item, 0);
        menuItem.order = index;
        items.push(menuItem);
      }
    });
    
    return items;
  }, []);

  // Initialize menu items
  useEffect(() => {
    if (menuElement && isActive) {
      const extractedItems = extractMenuItems(menuElement);
      setMenuItems(extractedItems);
      setOriginalMenu(menuElement.cloneNode(true) as HTMLElement);
    }
  }, [menuElement, isActive, extractMenuItems]);

  // Handle item reordering
  const moveItem = useCallback((dragIndex: number, hoverIndex: number, targetParent?: string) => {
    setMenuItems(prev => {
      const newItems = [...prev];
      const draggedItem = newItems[dragIndex];
      
      // Remove from current position
      newItems.splice(dragIndex, 1);
      
      // Insert at new position
      if (targetParent) {
        // Moving to be a child of another item
        const parentItem = newItems.find(item => item.id === targetParent);
        if (parentItem) {
          draggedItem.parent = targetParent;
          draggedItem.level = parentItem.level + 1;
          parentItem.children.push(draggedItem);
        }
      } else {
        // Moving at the same level
        newItems.splice(hoverIndex, 0, draggedItem);
      }
      
      // Update order values
      newItems.forEach((item, index) => {
        item.order = index;
      });
      
      return newItems;
    });
  }, []);

  // Handle item editing
  const handleEdit = useCallback((item: MenuItem) => {
    setEditingItem(item);
  }, []);

  // Save item changes
  const saveItemChanges = useCallback((updatedItem: MenuItem) => {
    setMenuItems(prev => prev.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    ));
    setEditingItem(null);
  }, []);

  // Apply changes to the actual menu
  const applyChanges = useCallback(() => {
    if (!menuElement) return;
    
    // Rebuild the menu structure based on current items
    const buildMenuHTML = (items: MenuItem[]): string => {
      return items
        .filter(item => item.visible)
        .sort((a, b) => a.order - b.order)
        .map(item => {
          const tag = item.url ? 'a' : 'div';
          const href = item.url ? `href="${item.url}"` : '';
          const classes = `menu-item ${item.disabled ? 'disabled' : ''}`;
          
          let html = `<${tag} ${href} class="${classes}" id="${item.id}">`;
          
          if (item.icon) {
            html += `<span class="icon">${item.icon}</span>`;
          }
          
          html += `<span class="label">${item.label}</span>`;
          
          if (item.children.length > 0) {
            html += `<ul class="submenu">${buildMenuHTML(item.children)}</ul>`;
          }
          
          html += `</${tag}>`;
          
          return html;
        })
        .join('');
    };
    
    menuElement.innerHTML = buildMenuHTML(menuItems);
    onMenuChange(menuItems);
  }, [menuElement, menuItems, onMenuChange]);

  // Reset to original state
  const resetChanges = useCallback(() => {
    if (!originalMenu || !menuElement) return;
    
    const newMenu = originalMenu.cloneNode(true) as HTMLElement;
    menuElement.parentNode?.replaceChild(newMenu, menuElement);
    
    const extractedItems = extractMenuItems(newMenu);
    setMenuItems(extractedItems);
  }, [originalMenu, menuElement, extractMenuItems]);

  if (!isActive || !menuElement) return null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="menu-editor-overlay">
        <div className="menu-editor-toolbar">
          <h4>📋 Menu Editor</h4>
          <div className="toolbar-actions">
            <button 
              className={`edit-btn ${isEditing ? 'active' : ''}`}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? '✅ Done' : '✏️ Edit'}
            </button>
            <button className="apply-btn" onClick={applyChanges}>
              💾 Apply
            </button>
            <button className="reset-btn" onClick={resetChanges}>
              🔄 Reset
            </button>
            <button className="close-btn" onClick={onClose}>
              ❌ Close
            </button>
          </div>
        </div>
        
        <div className="menu-editor-content">
          <div className="menu-structure">
            <h5>Menu Structure</h5>
            <div className="menu-items-list">
              {menuItems.map((item, index) => (
                <DraggableMenuItem
                  key={item.id}
                  item={item}
                  index={index}
                  moveItem={moveItem}
                  onEdit={handleEdit}
                  isEditing={isEditing}
                  level={0}
                />
              ))}
            </div>
          </div>
          
          {editingItem && (
            <div className="item-editor">
              <h5>Edit Menu Item</h5>
              <div className="editor-form">
                <div className="form-group">
                  <label>Label</label>
                  <input 
                    type="text"
                    value={editingItem.label}
                    onChange={(e) => setEditingItem(prev => 
                      prev ? { ...prev, label: e.target.value } : null
                    )}
                  />
                </div>
                
                <div className="form-group">
                  <label>Icon (emoji or text)</label>
                  <input 
                    type="text"
                    value={editingItem.icon || ''}
                    onChange={(e) => setEditingItem(prev => 
                      prev ? { ...prev, icon: e.target.value } : null
                    )}
                    placeholder="🏠 or icon-home"
                  />
                </div>
                
                <div className="form-group">
                  <label>URL</label>
                  <input 
                    type="text"
                    value={editingItem.url || ''}
                    onChange={(e) => setEditingItem(prev => 
                      prev ? { ...prev, url: e.target.value } : null
                    )}
                    placeholder="/dashboard or https://example.com"
                  />
                </div>
                
                <div className="form-checkboxes">
                  <label>
                    <input 
                      type="checkbox"
                      checked={editingItem.visible}
                      onChange={(e) => setEditingItem(prev => 
                        prev ? { ...prev, visible: e.target.checked } : null
                      )}
                    />
                    Visible
                  </label>
                  
                  <label>
                    <input 
                      type="checkbox"
                      checked={editingItem.disabled}
                      onChange={(e) => setEditingItem(prev => 
                        prev ? { ...prev, disabled: e.target.checked } : null
                      )}
                    />
                    Disabled
                  </label>
                </div>
                
                <div className="form-actions">
                  <button 
                    className="save-btn"
                    onClick={() => editingItem && saveItemChanges(editingItem)}
                  >
                    💾 Save
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => setEditingItem(null)}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};

export default MenuEditor;