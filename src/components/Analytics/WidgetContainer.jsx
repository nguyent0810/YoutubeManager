import React, { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { Settings, Eye, EyeOff, GripVertical, Smartphone, Monitor, Tablet } from 'lucide-react'

const WidgetContainer = ({ widgets, onLayoutChange, onWidgetToggle, renderWidget }) => {
  const [isEditMode, setIsEditMode] = useState(false)
  const [viewMode, setViewMode] = useState('desktop') // desktop, tablet, mobile
  const [isMobile, setIsMobile] = useState(false)
  const [visibleWidgets, setVisibleWidgets] = useState(
    widgets.reduce((acc, widget) => ({ ...acc, [widget.id]: widget.visible !== false }), {})
  )

  // Detect screen size and set mobile mode
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      if (width < 768) {
        setIsMobile(true)
        setViewMode('mobile')
      } else if (width < 1024) {
        setIsMobile(false)
        setViewMode('tablet')
      } else {
        setIsMobile(false)
        setViewMode('desktop')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Handle drag end
  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(widgets)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    onLayoutChange(items)
  }

  // Toggle widget visibility
  const toggleWidget = (widgetId) => {
    const newVisibility = { ...visibleWidgets, [widgetId]: !visibleWidgets[widgetId] }
    setVisibleWidgets(newVisibility)
    onWidgetToggle(widgetId, newVisibility[widgetId])
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Customize your analytics view</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* View Mode Selector (Desktop only) */}
          {!isMobile && (
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'desktop' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Desktop View"
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setViewMode('tablet')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'tablet' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Tablet View"
              >
                <Tablet size={16} />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
                }`}
                title="Mobile View"
              >
                <Smartphone size={16} />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isEditMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Settings size={16} />
            <span className={isMobile ? 'hidden' : ''}>{isEditMode ? 'Done' : 'Customize'}</span>
          </button>
        </div>
      </div>

      {/* Widget Visibility Controls (shown in edit mode) */}
      {isEditMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-3">Show/Hide Widgets</h3>
          <div className={`grid gap-3 ${
            isMobile
              ? 'grid-cols-1'
              : viewMode === 'tablet'
                ? 'grid-cols-2'
                : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
          }`}>
            {widgets.map((widget) => (
              <button
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  visibleWidgets[widget.id]
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                {visibleWidgets[widget.id] ? (
                  <Eye size={14} />
                ) : (
                  <EyeOff size={14} />
                )}
                <span className={isMobile ? 'text-xs' : ''}>{widget.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Draggable Widget Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="widgets" direction="vertical">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`${
                isMobile ? 'space-y-4' : 'space-y-6'
              } ${snapshot.isDraggingOver ? 'bg-blue-50 rounded-lg p-4' : ''}`}
            >
              {widgets.map((widget, index) => {
                if (!visibleWidgets[widget.id]) return null

                return (
                  <Draggable
                    key={widget.id}
                    draggableId={widget.id}
                    index={index}
                    isDragDisabled={!isEditMode || isMobile} // Disable drag on mobile
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`relative ${
                          snapshot.isDragging ? 'z-50 rotate-1 shadow-2xl' : ''
                        } ${isEditMode ? 'ring-2 ring-blue-200 rounded-lg' : ''} ${
                          isMobile ? 'mx-2' : ''
                        }`}
                      >
                        {/* Drag Handle (shown in edit mode, hidden on mobile) */}
                        {isEditMode && !isMobile && (
                          <div
                            {...provided.dragHandleProps}
                            className="absolute top-2 right-2 z-10 p-2 bg-white rounded-lg shadow-md cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors"
                          >
                            <GripVertical size={16} className="text-gray-400" />
                          </div>
                        )}

                        {/* Mobile Reorder Buttons (shown in edit mode on mobile) */}
                        {isEditMode && isMobile && (
                          <div className="absolute top-2 right-2 z-10 flex space-x-1">
                            <button
                              onClick={() => {
                                if (index > 0) {
                                  const newWidgets = [...widgets]
                                  const temp = newWidgets[index]
                                  newWidgets[index] = newWidgets[index - 1]
                                  newWidgets[index - 1] = temp
                                  onLayoutChange(newWidgets)
                                }
                              }}
                              disabled={index === 0}
                              className="p-1 bg-white rounded shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                              <span className="text-xs">↑</span>
                            </button>
                            <button
                              onClick={() => {
                                if (index < widgets.length - 1) {
                                  const newWidgets = [...widgets]
                                  const temp = newWidgets[index]
                                  newWidgets[index] = newWidgets[index + 1]
                                  newWidgets[index + 1] = temp
                                  onLayoutChange(newWidgets)
                                }
                              }}
                              disabled={index === widgets.length - 1}
                              className="p-1 bg-white rounded shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                            >
                              <span className="text-xs">↓</span>
                            </button>
                          </div>
                        )}

                        {/* Widget Content */}
                        <div className={`${isEditMode ? 'pointer-events-none' : ''}`}>
                          {renderWidget(widget, isEditMode, viewMode)}
                        </div>
                      </div>
                    )}
                  </Draggable>
                )
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Edit Mode Instructions */}
      {isEditMode && (
        <div className="text-center py-8 text-gray-500">
          <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>
            💡 <strong>Tip:</strong> {isMobile
              ? 'Use ↑↓ buttons to reorder widgets, or toggle visibility above'
              : 'Drag widgets by their handle to reorder, or use the buttons above to show/hide widgets'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default WidgetContainer
