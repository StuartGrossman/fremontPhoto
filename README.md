# Fremont Photo Application

## 📝 Overview
A web application for managing camera registration, photo galleries, and shipping labels. Built with React, Firebase, and modern web technologies.

## 🚀 Features

### 1. Authentication & User Management
- Google Sign-In integration
- Role-based access control (User/Admin)
- Protected routes and components

### 2. Camera Management
- QR code-based camera registration
- Camera status tracking
- Photo gallery per camera
- Shipping label generation

### 3. Admin Features
- Camera management dashboard
- User management interface
- QR code generation
- System monitoring

## 🔐 Authentication Requirements

| Page | Path | Auth Required | Role Required |
|------|------|---------------|---------------|
| Home | `/` | No | - |
| Login | `/login` | No | - |
| Profile | `/profile` | Yes | User |
| QR Registration | `/register/:id` | Yes | User |
| QR Viewer | `/qr/:id` | Yes | Admin |
| Photo Gallery | `/gallery/:id` | Yes | Owner/Admin |
| Admin Dashboard | `/admin` | Yes | Admin |
| Admin Management | `/admin/users` | Yes | Admin |

## 🏗️ Component Structure

### Core Components
1. **Navbar** (`src/components/Navbar.js`)
   - Navigation menu
   - Auth status display
   - Responsive design

2. **Profile** (`src/components/Profile.js`)
   - User's camera list
   - Camera status display
   - Shipping label generation
   - Test camera registration

3. **QRRegistration** (`src/components/QRRegistration.js`)
   - Camera registration form
   - QR code validation
   - User association

4. **PhotoGallery** (`src/components/PhotoGallery.js`)
   - Photo grid display
   - Upload functionality
   - Responsive layout

5. **AdminDashboard** (`src/components/AdminDashboard.js`)
   - Camera management
   - QR code generation
   - System overview

### Context & Utilities
1. **AuthContext** (`src/contexts/AuthContext.js`)
   - Authentication state management
   - User role handling
   - Protected route logic

2. **Firebase Configuration** (`src/firebase.js`)
   - Firebase initialization
   - Service configurations
   - Database connections

## 🔧 Technical Stack

### Frontend
- React 18
- React Router v6
- Firebase SDK
- CSS Modules
- Responsive Design

### Backend
- Firebase Authentication
- Firestore Database
- Firebase Storage
- Firebase Hosting

## 🛠️ Development Setup

1. **Prerequisites**
   - Node.js (v16+)
   - npm or yarn
   - Firebase CLI

2. **Installation**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create `.env` file with:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. **Development**
   ```bash
   npm start
   ```

5. **Build & Deploy**
   ```bash
   npm run build
   firebase deploy
   ```

## 🔒 Security Considerations

1. **Authentication**
   - All sensitive routes protected
   - Role-based access control
   - Secure session management

2. **Data Protection**
   - Server-side validation
   - Input sanitization
   - Secure file uploads

3. **API Security**
   - Firebase security rules
   - Protected endpoints
   - Rate limiting

## 📱 Mobile Responsiveness

- All pages optimized for mobile devices
- Responsive grid layouts
- Touch-friendly interfaces
- Proper spacing below fixed navbar

## 🐛 Known Issues

1. **Mobile Layout**
   - Fixed navbar spacing on some devices
   - Image optimization for slow connections

2. **Performance**
   - Large photo gallery loading times
   - QR code generation optimization

## 🔄 Future Improvements

1. **Features**
   - Bulk photo upload
   - Advanced camera management
   - Enhanced admin tools

2. **Performance**
   - Image compression
   - Lazy loading
   - Caching optimization

## 📄 License
MIT License

## 👥 Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request
