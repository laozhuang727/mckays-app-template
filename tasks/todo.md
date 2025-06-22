# FigJam Clone MVP - Project Plan

## Overview
Build a collaborative whiteboard application similar to FigJam with real-time collaboration, drawing tools, and basic shapes/text functionality.

## Implementation Phases - Detailed Tasks

## Phase 1: Canvas Foundation & Basic Drawing

### Canvas Infrastructure
- [ ] Create canvas component with proper HTML5 Canvas setup
- [ ] Implement canvas sizing and device pixel ratio handling
- [ ] Add viewport transformation matrix for pan/zoom
- [ ] Create coordinate conversion utilities (screen to canvas coords)
- [ ] Set up mouse/touch event handling on canvas
- [ ] Implement pan functionality with mouse drag
- [ ] Add zoom functionality with mouse wheel and pinch gestures
- [ ] Create infinite canvas bounds and viewport management

### Basic Drawing Engine
- [ ] Design object model (base DrawingObject class)
- [ ] Create Path object for freehand drawing
- [ ] Create React Context for canvas state management
- [ ] Create React Context for drawing tools state
- [ ] Add basic rendering pipeline for objects
- [ ] Create pen/brush tool with pressure sensitivity
- [ ] Implement stroke smoothing for pen tool
- [ ] Add variable stroke width and color support
- [ ] Create undo/redo system with command pattern

### Basic Shapes
- [ ] Create Rectangle shape object
- [ ] Create Circle/Ellipse shape object  
- [ ] Create Line shape object
- [ ] Implement shape preview while drawing
- [ ] Add snap-to-grid functionality (optional)

## Phase 2: Advanced Tools & UI

### Selection System
- [ ] Create selection tool with click detection
- [ ] Implement bounding box calculation for objects
- [ ] Add visual selection indicators (selection handles)
- [ ] Create multi-select with rectangle selection
- [ ] Implement hit testing for overlapping objects
- [ ] Add selection state management

### Object Manipulation
- [ ] Move selected objects with mouse drag
- [ ] Resize objects with corner/edge handles
- [ ] Rotate objects with rotation handle
- [ ] Delete selected objects (Delete key handler)
- [ ] Copy/paste functionality (Ctrl+C/V)
- [ ] Duplicate objects (Ctrl+D)

### Styling and Properties
- [ ] Create color picker component
- [ ] Implement fill color for shapes
- [ ] Add stroke color and width controls
- [ ] Object layering (bring to front/send to back)
- [ ] Style inheritance and default styles
- [ ] Properties panel for selected objects

### Toolbar and UI
- [ ] Create main toolbar component
- [ ] Add tool selection buttons (pen, shapes, select, etc.)
- [ ] Implement color palette component
- [ ] Add stroke width slider
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