import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './TableEditor.css';

interface ColumnData {
  id: string;
  key: string;
  title: string;
  width: number;
  minWidth: number;
  maxWidth: number;
  resizable: boolean;
  sortable: boolean;
  visible: boolean;
  order: number;
}

interface DraggableColumnProps {
  column: ColumnData;
  index: number;
  moveColumn: (dragIndex: number, hoverIndex: number) => void;
  onResize: (columnId: string, width: number) => void;
  isEditing: boolean;
}

interface TableEditorProps {
  tableElement: HTMLTableElement | null;
  isActive: boolean;
  onColumnsChange: (columns: ColumnData[]) => void;
  onClose: () => void;
}

const DraggableColumn: React.FC<DraggableColumnProps> = ({
  column,
  index,
  moveColumn,
  onResize,
  isEditing
}) => {
  const ref = useRef<HTMLTableCellElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);

  const [{ isDragging }, drag] = useDrag({
    type: 'column',
    item: { id: column.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'column',
    hover: (item: { id: string; index: number }) => {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;
      
      if (dragIndex === hoverIndex) return;
      
      moveColumn(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    if (!column.resizable) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsResizing(true);
    setStartX(e.clientX);
    setStartWidth(column.width);
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX;
      const newWidth = Math.max(
        column.minWidth,
        Math.min(column.maxWidth, startWidth + deltaX)
      );
      onResize(column.id, newWidth);
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [column, startX, startWidth, onResize]);

  drag(drop(ref));

  return (
    <th
      ref={ref}
      className={`draggable-column ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={{
        width: column.width,
        minWidth: column.minWidth,
        maxWidth: column.maxWidth,
        opacity: isDragging ? 0.5 : 1,
        cursor: isEditing ? 'grab' : 'default'
      }}
    >
      <div className="column-content">
        <span className="column-title">{column.title}</span>
        {isEditing && (
          <div className="column-controls">
            <button className="column-btn visibility-btn" title="Toggle Visibility">
              {column.visible ? '👁️' : '🙈'}
            </button>
            <button className="column-btn sort-btn" title="Toggle Sortable">
              {column.sortable ? '🔽' : '➖'}
            </button>
          </div>
        )}
      </div>
      
      {column.resizable && isEditing && (
        <div 
          className="resize-handle"
          onMouseDown={handleResizeStart}
          title="Resize Column"
        />
      )}
    </th>
  );
};

const TableEditor: React.FC<TableEditorProps> = ({
  tableElement,
  isActive,
  onColumnsChange,
  onClose
}) => {
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [originalTable, setOriginalTable] = useState<HTMLTableElement | null>(null);

  // Early return if no table element
  if (!tableElement) {
    return null;
  }

  // Extract column data from table element
  const extractColumns = useCallback((table: HTMLTableElement): ColumnData[] => {
    const headerRow = table.querySelector('thead tr') || table.querySelector('tr');
    if (!headerRow) return [];
    
    const headers = Array.from(headerRow.querySelectorAll('th, td'));
    
    return headers.map((header, index) => {
      const currentWidth = header.getBoundingClientRect().width;
      
      return {
        id: `col-${index}`,
        key: header.getAttribute('data-key') || `column-${index}`,
        title: header.textContent?.trim() || `Column ${index + 1}`,
        width: currentWidth,
        minWidth: 50,
        maxWidth: 500,
        resizable: true,
        sortable: header.hasAttribute('data-sortable') || false,
        visible: true,
        order: index
      };
    });
  }, []);

  // Initialize columns when table element changes
  useEffect(() => {
    if (tableElement && isActive) {
      const extractedColumns = extractColumns(tableElement);
      setColumns(extractedColumns);
      setOriginalTable(tableElement.cloneNode(true) as HTMLTableElement);
    }
  }, [tableElement, isActive, extractColumns]);

  // Handle column reordering
  const moveColumn = useCallback((dragIndex: number, hoverIndex: number) => {
    setColumns(prev => {
      const newColumns = [...prev];
      const draggedColumn = newColumns[dragIndex];
      
      newColumns.splice(dragIndex, 1);
      newColumns.splice(hoverIndex, 0, draggedColumn);
      
      // Update order values
      newColumns.forEach((col, index) => {
        col.order = index;
      });
      
      return newColumns;
    });
  }, []);

  // Handle column resizing
  const handleResize = useCallback((columnId: string, width: number) => {
    setColumns(prev => prev.map(col => 
      col.id === columnId ? { ...col, width } : col
    ));
  }, []);

  // Apply changes to the actual table
  const applyChanges = useCallback(() => {
    if (!tableElement || !originalTable) return;
    
    // Get all rows
    const rows = Array.from(tableElement.querySelectorAll('tr'));
    
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('th, td'));
      const newRow = row.cloneNode(false) as HTMLTableRowElement;
      
      // Reorder cells based on column order
      columns
        .filter(col => col.visible)
        .sort((a, b) => a.order - b.order)
        .forEach(column => {
          const originalIndex = parseInt(column.id.split('-')[1]);
          const cell = cells[originalIndex];
          
          if (cell) {
            const newCell = cell.cloneNode(true) as HTMLTableCellElement;
            newCell.style.width = `${column.width}px`;
            newCell.style.minWidth = `${column.minWidth}px`;
            newCell.style.maxWidth = `${column.maxWidth}px`;
            newRow.appendChild(newCell);
          }
        });
      
      row.parentNode?.replaceChild(newRow, row);
    });
    
    onColumnsChange(columns);
  }, [tableElement, originalTable, columns, onColumnsChange]);

  // Reset to original state
  const resetChanges = useCallback(() => {
    if (!originalTable || !tableElement) return;
    
    const newTable = originalTable.cloneNode(true) as HTMLTableElement;
    tableElement.parentNode?.replaceChild(newTable, tableElement);
    
    const extractedColumns = extractColumns(newTable);
    setColumns(extractedColumns);
  }, [originalTable, tableElement, extractColumns]);

  if (!isActive || !tableElement) return null;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="table-editor-overlay">
        <div className="table-editor-toolbar">
          <h4>📊 Table Editor</h4>
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
        
        {isEditing && (
          <div className="column-manager">
            <h5>Column Configuration</h5>
            <div className="columns-list">
              {columns.map((column, index) => (
                <div key={column.id} className="column-config">
                  <div className="column-header">
                    <span className="column-number">{index + 1}</span>
                    <input 
                      type="text" 
                      value={column.title}
                      onChange={(e) => {
                        setColumns(prev => prev.map(col => 
                          col.id === column.id ? { ...col, title: e.target.value } : col
                        ));
                      }}
                      className="column-title-input"
                    />
                  </div>
                  
                  <div className="column-settings">
                    <div className="setting-group">
                      <label>Width: {column.width}px</label>
                      <input 
                        type="range"
                        min={column.minWidth}
                        max={column.maxWidth}
                        value={column.width}
                        onChange={(e) => handleResize(column.id, parseInt(e.target.value))}
                      />
                    </div>
                    
                    <div className="setting-checkboxes">
                      <label>
                        <input 
                          type="checkbox" 
                          checked={column.visible}
                          onChange={(e) => {
                            setColumns(prev => prev.map(col => 
                              col.id === column.id ? { ...col, visible: e.target.checked } : col
                            ));
                          }}
                        />
                        Visible
                      </label>
                      
                      <label>
                        <input 
                          type="checkbox" 
                          checked={column.resizable}
                          onChange={(e) => {
                            setColumns(prev => prev.map(col => 
                              col.id === column.id ? { ...col, resizable: e.target.checked } : col
                            ));
                          }}
                        />
                        Resizable
                      </label>
                      
                      <label>
                        <input 
                          type="checkbox" 
                          checked={column.sortable}
                          onChange={(e) => {
                            setColumns(prev => prev.map(col => 
                              col.id === column.id ? { ...col, sortable: e.target.checked } : col
                            ));
                          }}
                        />
                        Sortable
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="table-preview">
          <table className="editable-table">
            <thead>
              <tr>
                {columns
                  .filter(col => col.visible)
                  .sort((a, b) => a.order - b.order)
                  .map((column, index) => (
                    <DraggableColumn
                      key={column.id}
                      column={column}
                      index={index}
                      moveColumn={moveColumn}
                      onResize={handleResize}
                      isEditing={isEditing}
                    />
                  ))
                }
              </tr>
            </thead>
          </table>
        </div>
      </div>
    </DndProvider>
  );
};

export default TableEditor;