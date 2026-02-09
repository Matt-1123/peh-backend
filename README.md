# Project Earth Health - Backend

Backend API server for [projectearthhealth.com](https://projectearthhealth.com). Built with Node.js, Express, and MySQL.

## Features

- RESTful API architecture
- JWT-based authentication
- Secure password hashing with bcrypt
- MySQL database integration
- CORS-enabled for cross-origin requests
- Cookie-based session management

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express 5.1.0
- **Database:** MySQL (via mysql2)
- **Authentication:** JWT (jsonwebtoken) + bcrypt
- **Environment:** dotenv for configuration

## Prerequisites

- Node.js (v18 or higher recommended)
- MySQL database


## Usage

### Development Mode
Run with auto-reload on file changes:
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests (not yet implemented)

## Security

- Passwords are hashed using bcrypt before storage
- JWT tokens for stateless authentication
- CORS configured for trusted origins
- Environment variables for sensitive data