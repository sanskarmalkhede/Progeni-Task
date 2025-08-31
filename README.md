# User Profile Management Application

A modern React application for managing user profiles with database integration and QR code functionality.

## Features

- User profile CRUD operations
- PostgreSQL database integration with Prisma ORM
- QR code generation and scanning
- Modern UI with Tailwind CSS
- TypeScript support
- Responsive design

## Prerequisites

Before setting up the project locally, ensure you have the following installed:

- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL database

## Local Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd <project-directory>
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
VITE_API_URL="http://localhost:3000/api"
```

Replace the database connection string with your PostgreSQL credentials.

### 3. Database Setup

Run the database migration to create the required tables:

```bash
npx prisma migrate dev
```

Optionally, seed the database with sample data:

```bash
npx prisma db seed
```

### 4. Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 5. Start the Backend API (if separate)

If you have a separate backend server:

```bash
npm run server
```

The API will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests

## Project Structure

```
src/
├── components/          # React components
├── lib/                # Utility functions and API calls
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles

prisma/
└── schema.prisma       # Database schema

tests/
├── e2e/               # End-to-end tests
└── screenshots/       # Test screenshots
```

## Database Schema

The application uses PostgreSQL with the following main table:

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    bio TEXT,
    avatar_url VARCHAR(500),
    date_of_birth DATE,
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

- `GET /api/users` - Retrieve all users
- `GET /api/users/:id` - Retrieve a specific user
- `POST /api/users` - Create a new user
- `PUT /api/users/:id` - Update an existing user
- `DELETE /api/users/:id` - Delete a user

## Technologies Used

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Database**: PostgreSQL with Prisma ORM
- **Testing**: Playwright for E2E testing
- **QR Code**: qrcode library for generation and scanning
- **Build Tool**: Vite

## Troubleshooting

### Database Connection Issues

1. Ensure PostgreSQL is running
2. Verify database credentials in `.env` file
3. Check if the database exists
4. Run `npx prisma db push` to sync the schema

### Port Conflicts

If port 5173 is already in use, Vite will automatically use the next available port. Check the terminal output for the actual port being used.

### Build Issues

1. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf .vite`
3. Ensure all environment variables are properly set

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests to ensure everything works
5. Submit a pull request

## License

This project is licensed under the MIT License.