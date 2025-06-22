# FigJam Clone MVP - Project Plan

## Overview
Build a collaborative whiteboard application similar to FigJam with real-time collaboration, drawing tools, and basic shapes/text functionality.

## 🚀 Current Progress Summary

### ✅ PHASE 1 COMPLETED - Foundation & Basic Drawing
- **Canvas Infrastructure**: HTML5 Canvas with pan/zoom, coordinate transforms, device pixel ratio
- **Drawing Engine**: React Context state management, rendering pipeline, path smoothing
- **Basic Tools**: Pen tool with variable width/color, Rectangle tool, Circle tool
- **UI Foundation**: Main toolbar, tool selection, dual color system (stroke/fill)

### ✅ PHASE 2 PARTIAL - Selection System COMPLETED
- **Selection System**: Click to select objects, multi-select with Ctrl+click, visual indicators
- **Selection Features**: Bounding boxes, selection handles, delete with keyboard
- **Object Detection**: Hit testing for paths and shapes, proper layering

### 🔄 CURRENTLY WORKING ON - Object Manipulation
- **Next**: Move selected objects with drag
- **After**: Resize with handles, rotation

### 📍 Routes Created
- `/figjam` - Dashboard with board grid
- `/figjam/[boardId]` - Canvas view with full drawing functionality
- `/figjam-demo` - Standalone demo page

## Implementation Phases - Detailed Tasks

## Phase 1: Canvas Foundation & Basic Drawing

### Canvas Infrastructure ✅ COMPLETED
- [x] Create canvas component with proper HTML5 Canvas setup
- [x] Implement canvas sizing and device pixel ratio handling
- [x] Add viewport transformation matrix for pan/zoom
- [x] Create coordinate conversion utilities (screen to canvas coords)
- [x] Set up mouse/touch event handling on canvas
- [x] Implement pan functionality with mouse drag (via select tool)
- [x] Add zoom functionality with mouse wheel and pinch gestures
- [x] Create infinite canvas bounds and viewport management

### Basic Drawing Engine ✅ COMPLETED
- [x] Design object model (DrawingPath and Shape interfaces)
- [x] Create Path object for freehand drawing
- [x] Create React Context for canvas state management
- [x] Create React Context for drawing tools state
- [x] Add basic rendering pipeline for objects
- [x] Create pen/brush tool with pressure sensitivity
- [x] Implement stroke smoothing for pen tool
- [x] Add variable stroke width and color support
- [x] Create undo/redo system with command pattern (partially completed - needs keyboard shortcuts)

### Basic Shapes ✅ COMPLETED
- [x] Create Rectangle shape object
- [x] Create Circle/Ellipse shape object  
- [ ] Create Line shape object (deferred)
- [x] Implement shape preview while drawing (dashed preview)
- [ ] Add snap-to-grid functionality (optional)

## Phase 2: Advanced Tools & UI

### Selection System ✅ COMPLETED
- [x] Create selection tool with click detection
- [x] Implement bounding box calculation for objects
- [x] Add visual selection indicators (selection handles)
- [x] Create multi-select with Ctrl+click (rectangle selection deferred)
- [x] Implement hit testing for overlapping objects
- [x] Add selection state management

### Object Manipulation ✅ COMPLETED
- [x] Move selected objects with mouse drag
- [x] Delete selected objects (Delete key handler)
- [x] Resize objects with corner/edge handles (8 handles: corners + edges)
- [x] Dynamic cursor styles for resize handles
- [x] Copy/paste functionality (Ctrl+C/V)
- [x] Duplicate objects (Ctrl+D)
- [x] Select all objects (Ctrl+A)
- [ ] Rotate objects with rotation handle

### Styling and Properties ✅ COMPLETED
- [x] Create color picker component (dual stroke/fill system)
- [x] Implement fill color for shapes
- [x] Add stroke color and width controls
- [ ] Object layering (bring to front/send to back)
- [x] Style inheritance and default styles
- [ ] Properties panel for selected objects

### Toolbar and UI ✅ COMPLETED
- [x] Create main toolbar component
- [x] Add tool selection buttons (pen, shapes, select, etc.)
- [x] Implement color palette component (dual stroke/fill)
- [x] Add stroke width slider
- [ ] Create keyboard shortcuts handler
- [ ] Add tool options panel (context-sensitive)

## Phase 3: Text and Advanced Features

### Text System
- [ ] Create Text object with editable content
- [ ] Implement text input overlay for editing
- [ ] Add font family, size, and style controls
- [ ] Text alignment options (left, center, right)
- [ ] Auto-resize text boxes based on content
- [ ] Text selection and cursor positioning

### Sticky Notes
- [ ] Create StickyNote component with background color
- [ ] Add resizable sticky note functionality
- [ ] Implement text editing within sticky notes
- [ ] Color themes for sticky notes
- [ ] Auto-save sticky note content

### Advanced Tools
- [ ] Arrow tool with arrowhead styles
- [ ] Connector lines that snap to object edges
- [ ] Shape library with common symbols
- [ ] Image insertion and handling
- [ ] Basic alignment tools (align left/center/right)

## Phase 4: Data Persistence

### Database Schema Design
- [ ] Create boards table (id, userId, name, createdAt, updatedAt, settings)
- [ ] Create board_objects table (id, boardId, type, properties, position, style, zIndex)
- [ ] Create board_collaborators table (boardId, userId, role, permissions, joinedAt)
- [ ] Add database migrations for new tables
- [ ] Create TypeScript types for database schemas

### FigJam Route Setup
- [ ] Create /app/(authenticated)/figjam/page.tsx for dashboard
- [ ] Create /app/(authenticated)/figjam/[boardId]/page.tsx for canvas view
- [ ] Set up basic routing and navigation between dashboard and boards

### Board Management
- [ ] Create new board functionality
- [ ] List user's boards with thumbnails
- [ ] Rename board functionality
- [ ] Delete board with confirmation
- [ ] Duplicate board functionality
- [ ] Board search and filtering

### Save/Load System
- [ ] Implement serialization for all object types
- [ ] Create auto-save functionality (debounced, every 2 seconds)
- [ ] Add manual save indicator and controls
- [ ] Load board data and reconstruct objects
- [ ] Handle save conflicts and error states
- [ ] Export board as JSON/image

### Server Actions
- [ ] Create server action for saving board data
- [ ] Create server action for loading board data
- [ ] Add server action for board management operations
- [ ] Implement proper error handling and validation
- [ ] Add optimistic updates for better UX

## Phase 5: Real-time Collaboration

### WebSocket Infrastructure
- [ ] Set up Socket.io or native WebSocket server
- [ ] Create client-side WebSocket connection management
- [ ] Create React Context for collaboration state
- [ ] Implement connection status indicators
- [ ] Add reconnection logic with exponential backoff
- [ ] Create message queuing for offline scenarios

### Live Collaboration Features
- [ ] Real-time object updates (create, modify, delete)
- [ ] Live cursors showing other users' positions
- [ ] User presence indicators with avatars
- [ ] Real-time selection sharing
- [ ] Collaborative text editing with operational transforms

### Conflict Resolution
- [ ] Implement last-writer-wins for simple conflicts
- [ ] Add object locking during editing
- [ ] Create conflict detection for simultaneous edits
- [ ] User awareness system (who's editing what)
- [ ] Graceful handling of network issues

### Sharing and Permissions
- [ ] Share board by link functionality
- [ ] User role management (viewer, editor, owner)
- [ ] Permission checking on all operations
- [ ] Invite users to board via email
- [ ] Access control for board visibility

## Phase 6: Polish and Performance

### Performance Optimization
- [ ] Implement canvas object culling for viewport
- [ ] Add object pooling for frequently created items
- [ ] Optimize rendering with dirty rectangle updates
- [ ] Implement virtualization for large object counts
- [ ] Add performance monitoring and metrics

### Mobile and Touch Support
- [ ] Touch gesture handling (pan, zoom, tap)
- [ ] Mobile-optimized toolbar and UI
- [ ] Touch-friendly selection handles
- [ ] Responsive design for different screen sizes
- [ ] iOS Safari and Android Chrome compatibility

### User Experience Enhancements
- [ ] Loading states and skeleton screens
- [ ] Error boundaries and graceful error handling
- [ ] Keyboard navigation and accessibility
- [ ] Contextual menus (right-click)
- [ ] Tooltips and help system
- [ ] Onboarding flow for new users

## Technical Stack Integration
- **Frontend**: Next.js 15 with React 19
- **State Management**: React Context (no Zustand)
- **Canvas**: HTML5 Canvas API with custom drawing engine
- **Real-time**: Socket.io or native WebSockets
- **Database**: PostgreSQL with Drizzle ORM (extend existing schema)
- **Auth**: Clerk (already integrated)
- **UI**: Shadcn UI components for interface elements
- **Routes**: `/figjam` for dashboard, `/figjam/[boardId]` for canvas

## File Structure Plan
```
/app/(authenticated)/figjam/
  page.tsx               # FigJam dashboard (list of boards)
  [boardId]/
    page.tsx             # Main canvas view
  _components/
    canvas-board.tsx     # Main canvas component
    toolbar.tsx          # Drawing tools toolbar
    color-palette.tsx    # Color selection
    layers-panel.tsx     # Layers management
    mini-map.tsx         # Navigation minimap
    board-list.tsx       # Dashboard board grid
    collaboration/
      live-cursors.tsx   # Real-time cursors
      user-presence.tsx  # User indicators
  _contexts/
    canvas-context.tsx   # Canvas state management with React Context
    drawing-context.tsx  # Drawing tool state with React Context
    collaboration-context.tsx # Real-time sync state
  _hooks/
    use-canvas.ts        # Canvas hook using context
    use-drawing-tools.ts # Drawing tool logic
    use-collaboration.ts # Real-time sync hook
  _utils/
    canvas-utils.ts      # Canvas utilities
    drawing-engine.ts    # Core drawing logic

/db/schema/
  boards.ts              # Board metadata (renamed from canvases)
  board-objects.ts       # Drawing objects
  board-collaborators.ts # Sharing permissions

/components/ui/
  figjam/                # FigJam-specific UI components
```

## Questions to Consider
1. Should we use a canvas library (like Fabric.js) or build from scratch?
2. What WebSocket solution should we use (Socket.io, native WebSockets, or Pusher)?
3. How complex should the drawing engine be initially?
4. What's the target performance for number of objects on canvas?
5. Should we support vector or raster graphics (or both)?

---
*This plan will be refined based on feedback before implementation begins.*