# Helpdesk System

This is a helpdesk ticketing system built with Node.js, Express, MongoDB, and Socket.IO. It allows users to submit support tickets, which administrators can manage and respond to.

## Features

- User authentication (login/register)
- Role-based access control (standard user, 1. linje, 2. linje, and admin roles)
- User management system for administrators
  - Create new users
  - Update user roles
  - Delete users
  - View all users in the system
- Ticket creation and management
  - Status tracking (Open, In Progress, Solved, Closed)
  - Priority levels (High, Medium, Low)
  - Category classification
  - Comment thread on each ticket
  - Ticket history tracking
- Real-time notifications via Socket.IO
- Responsive design for desktop and mobile
- Dark mode support
- Comprehensive security features
- Admin dashboard with statistics and filtering options

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **Frontend**: EJS templates, Bootstrap 5
- **Authentication**: JWT stored in HTTP-only cookies
- **Password Hashing**: Argon2
- **Real-time Communication**: Socket.IO
- **Charts**: Chart.js for data visualization
- **Deployment**: GitHub Actions for CI/CD

## API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/auth/login` | Render login page | Public |
| POST | `/api/auth/login` | Authenticate user | Public |
| GET | `/api/auth/register` | Render registration page | Public |
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/logout` | Log out user | Authenticated |

### Ticket Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/tickets/mydashboard` | User dashboard with their tickets | Authenticated |
| GET | `/api/tickets/admin` | Admin dashboard with all tickets | Admin |
| GET | `/api/tickets/create` | Render ticket creation form | Authenticated |
| POST | `/api/tickets/create` | Create new ticket | Authenticated |
| GET | `/api/tickets/view/:id` | View specific ticket | Ticket owner or Admin |
| GET | `/api/tickets/edit/:id` | Render ticket edit form | Admin |
| POST | `/api/tickets/update/:id` | Update ticket | Admin |
| POST | `/api/tickets/comment/:id` | Add comment to ticket | Ticket owner or Admin |

### User Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users/manage` | View user management interface | Admin |
| GET | `/api/users/all` | Get list of all users | Admin |
| POST | `/api/users/update/:id` | Update user role | Admin |
| GET | `/api/users/delete/:id` | Delete user | Admin |
| POST | `/api/users/create` | Create new user | Admin |

## Security Features

- **JWT Authentication**: Tokens stored in HTTP-only cookies
- **Password Hashing**: Argon2 algorithm for secure password storage
- **Rate Limiting**: Protection against brute force attacks
  - Login attempts limited to 20 per 2 minutes
  - API requests limited to 100 per 15 minutes
- **Route Protection**: Role-based middleware for authorization
- **Input Validation**: Server-side validation of form inputs
- **Helmet Security Headers**: Protection against various common web vulnerabilities
- **XSS Protection**: Guards against cross-site scripting attacks
- **Input Sanitization**: Clean user inputs to prevent injection attacks
- **CSRF Protection**: Through same-site cookie attributes
- **Secure HTTP Headers**: Protection against clickjacking, MIME sniffing, etc.
- **Hidden Server Information**: Removes X-Powered-By header
- **Error Handling**: Limited exposure of error details in production

## Socket.IO Events

| Event | Description | Sender | Receiver |
|-------|-------------|--------|----------|
| `joinUserRoom` | User joins their personal notification room | Client | Server |
| `joinAdminRoom` | Admin joins admin notification room | Client | Server |
| `new-ticket` | Notification of new ticket creation | Server | Admins |
| `ticket-updated` | Notification of ticket status change | Server | Ticket owner |
| `new-comment` | Notification of new comment | Server | Ticket owner or Admins |

## Database Models

### User Model
- name: String (required)
- email: String (required, unique)
- password: String (required, hashed with Argon2)
- role: String (enum: 'user', '1st_line', '2nd_line', 'admin', default: 'user')
- createdAt: Date

### Ticket Model
- title: String (required)
- description: String (required)
- category: String (required)
- user: ObjectId (reference to User model)
- status: String (enum: 'Åpen', 'Under arbeid', 'Løst', 'Lukket', default: 'Åpen')
- priority: String (enum: 'Lav', 'Medium', 'Høy', default: 'Medium')
- comments: Array of Comment subdocuments
- history: Array of History subdocuments
- createdAt: Date
- updatedAt: Date

### Comment Schema (subdocument in Ticket)
- user: ObjectId (reference to User model)
- text: String (required)
- createdAt: Date

### History Schema (subdocument in Ticket)
- action: String (required)
- user: ObjectId (reference to User model)
- timestamp: Date

## Recent Security Enhancements

1. **Helmet Implementation**: Added comprehensive HTTP security headers
2. **Input Sanitization**: Using express-validator to clean user inputs
3. **XSS Protection**: Additional middleware to prevent cross-site scripting
4. **Content Security Policy**: Strict rules about what resources can be loaded
5. **Dark Mode**: Enhanced UI with dark mode toggle for better accessibility
6. **Real-time Notifications**: Improved socket.io implementation for better user experience

## Setup Instructions

1. Clone the repository
2. Install dependencies: `npm install`
3. Create .env file with required environment variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/helpdesk
   JWT_SECRET=your_secret_key
   NODE_ENV=development
   ```
4. Start the application:
   - Development: `npm run dev`
   - Production: `npm start`

## Development Practices

- **Code Organization**: MVC pattern (Models, Views, Controllers)
- **Error Handling**: Centralized error handling middleware
- **Configuration**: Environment-based configuration using dotenv
- **Logging**: Console logging for development, file logging for production
- **Comments**: Code is thoroughly commented for future maintenance

## Deployment

This application includes GitHub Actions workflows for CI/CD pipeline, automatically deploying to a self-hosted runner when changes are pushed to the main branch.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
