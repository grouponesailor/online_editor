# Collaborative Document Editor

A real-time collaborative document editor built with Angular and TipTap, designed to work both online and offline with on-premise server support.

## 🚀 Features

### Core Editing Features
- **Rich Text Editing**: Full-featured editor powered by TipTap with support for:
  - Text formatting (bold, italic, underline, strikethrough)
  - Font families and sizes
  - Text alignment and line height
  - Text and highlight colors
  - Subscript and superscript
- **Tables**: Insert and edit tables with dynamic sizing
- **Images**: Upload, insert by URL, and edit images with built-in editor
- **Shapes**: Insert various shapes (rectangle, circle, triangle, arrow, star, etc.)
- **Document Management**: Editable document names with auto-save

### Collaboration Features
- **Real-time Collaboration**: Multiple users can edit simultaneously
- **User Awareness**: See other collaborators and their cursors
- **Conflict Resolution**: Automatic conflict resolution using Yjs
- **Comments System**: Add and manage comments on documents

### Network Modes
- **Offline Mode**: Works completely offline with local storage
- **On-Premise Mode**: Connect to local network servers (192.168.x.x, localhost)
- **Online Mode**: Ready for cloud/internet-based servers
- **Auto-Discovery**: Automatically scans for available collaboration servers
- **Fallback Support**: Graceful degradation when network is unavailable

### Sharing & Collaboration
- **Share Dialog**: Modern UI for document sharing
- **Multiple Share Options**: Direct links, QR codes, email sharing
- **User Management**: Add/remove users with different permission levels
- **Visual Feedback**: Copy confirmation with auto-hide notifications
- **Network Status**: Real-time connection status display

## 🏗️ Architecture

The project follows Angular best practices with a modular architecture:

```
src/app/
├── core/                    # Singleton services and core functionality
│   ├── services/
│   │   ├── network-config.service.ts
│   │   └── share.service.ts
│   └── core.module.ts
├── shared/                  # Reusable components and utilities
│   ├── components/
│   │   ├── toolbar/
│   │   ├── share-dialog/
│   │   ├── image-edit-dialog/
│   │   └── comments-sidebar/
│   └── shared.module.ts
├── features/                # Feature modules
│   └── editor/
│       ├── components/
│       │   └── editor/
│       ├── services/
│       ├── editor.module.ts
│       └── editor-routing.module.ts
├── extensions/              # Custom TipTap extensions
│   └── shape.ts
├── app.component.ts
├── app.module.ts
└── app-routing.module.ts
```

## 🛠️ Tech Stack

- **Frontend**: Angular 15+ with TypeScript
- **Rich Text Editor**: TipTap (ProseMirror-based)
- **Real-time Collaboration**: Yjs + y-websocket
- **Styling**: Tailwind CSS
- **State Management**: RxJS Observables
- **Network Detection**: Custom service with auto-discovery

## 📦 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/grouponesailor/online_editor.git
   cd online_editor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Development server**:
   ```bash
   ng serve
   ```
   Navigate to `http://localhost:4200`

4. **Build for production**:
   ```bash
   ng build --prod
   ```

## 🧪 Testing

The project includes comprehensive test automation for all AI functionality:

### Running Tests

1. **Run all tests**:
   ```bash
   npm test
   ```

2. **Run tests with coverage**:
   ```bash
   npm run test:coverage
   ```

3. **Run tests in CI mode**:
   ```bash
   npm run test:ci
   ```

4. **Run E2E tests**:
   ```bash
   npm run e2e
   ```

5. **Watch mode for development**:
   ```bash
   npm run test:watch
   ```

### Test Coverage

The AI section includes comprehensive test automation covering:

- **Unit Tests**: Individual component and service testing
- **Integration Tests**: Component interaction and workflow testing
- **E2E Tests**: Complete user journey testing
- **Error Handling**: Network failures, API errors, edge cases
- **Performance Tests**: Large documents, rapid interactions
- **Accessibility Tests**: Keyboard navigation, screen reader support

#### AI Service Tests (`ai.service.spec.ts`)
- API integration with Hugging Face
- Fallback model handling
- Text truncation and processing
- Error handling and recovery
- Service health checks

#### Comments Sidebar Tests (`comments-sidebar.component.spec.ts`)
- AI summarization workflow
- User interface interactions
- State management
- Clipboard operations
- Document insertion

#### Integration Tests (`comments-sidebar.component.integration.spec.ts`)
- Full workflow testing
- Tab navigation
- Error state handling
- Performance optimization

#### E2E Tests (`comments-sidebar.component.e2e.spec.ts`)
- Complete user journeys
- Multi-step workflows
- Cross-browser compatibility
- Accessibility compliance

### Test Configuration

Tests are configured with:
- **Karma**: Test runner
- **Jasmine**: Testing framework
- **Coverage reporting**: HTML and LCOV formats
- **CI/CD support**: Headless Chrome for automated testing
- **Mock services**: Comprehensive mocking for external dependencies

## 🖥️ Server Setup (Optional)

For real-time collaboration, you can run the included WebSocket server:

1. **Start the collaboration server**:
   ```bash
   node websocket-server.js
   ```

2. **The server provides**:
   - WebSocket connections for real-time collaboration
   - REST API for document management
   - User sharing and permissions
   - Automatic local IP detection
   - Health check endpoints

## 🔧 Configuration

### Network Configuration
The app automatically detects available collaboration servers:
- **Local Development**: `localhost:1234`
- **On-Premise**: Scans `192.168.x.x`, `10.0.x.x` networks
- **Offline**: Falls back to local storage

### Environment Variables
```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  collaborationServer: 'ws://localhost:1234',
  apiUrl: 'http://localhost:1234/api'
};
```

## 📱 Usage

### Basic Editing
1. Open the application
2. Start typing in the editor
3. Use the toolbar for formatting options
4. Documents auto-save locally

### Collaboration
1. Click the "Share" button in the header
2. Copy the share link or generate a QR code
3. Share with collaborators
4. See real-time changes and user cursors

### Offline Mode
1. Works automatically when no server is available
2. All changes saved to local storage
3. Auto-sync when connection is restored

## 🎨 Components

### Editor Component
- Main editing interface
- Network status indicator
- Document name management
- Collaboration setup

### Toolbar Component
- Tabbed interface (Home, Insert, Shapes, View)
- Rich formatting controls
- Table and image insertion
- Color pickers and style options

### Share Dialog Component
- Modern sharing interface
- Multiple sharing methods
- User management
- Network status display

### Comments Sidebar Component
- Comment management
- Real-time comment sync
- Reply functionality

## 🔐 Features in Detail

### Document Sharing
- **Private/Public access control**
- **Permission levels**: View, Comment, Edit
- **Link generation** with optional expiration
- **QR code sharing** for mobile access
- **Email integration** for direct sharing

### Network Modes
- **Smart Detection**: Automatically finds the best available server
- **Graceful Fallback**: Continues working when connection is lost
- **Status Indicators**: Clear visual feedback about connection state
- **Manual Refresh**: Option to manually reconnect

### Data Persistence
- **Local Storage**: Documents saved locally for offline access
- **Auto-Sync**: Automatic synchronization when coming back online
- **Conflict Resolution**: Intelligent merging of offline changes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit: `git commit -am 'Add some feature'`
5. Push: `git push origin feature-name`
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [TipTap](https://tiptap.dev/) - Excellent rich text editor framework
- [Yjs](https://yjs.dev/) - Real-time collaboration framework
- [Angular](https://angular.io/) - Powerful web application framework
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📞 Support

For support, please open an issue on GitHub or contact the maintainers.

---

**Built with ❤️ for seamless collaborative editing** 