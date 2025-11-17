# Architecture Documentation

## Project Structure

The CritXChange project follows a clean MVC (Model-View-Controller) architecture with clear separation of concerns.

## Directory Structure

```
backend/
├── controllers/          # Business logic (controllers)
│   ├── accountController.js
│   ├── authController.js
│   ├── dashboardController.js
│   └── pageController.js
├── routes/              # Route definitions (no business logic)
│   ├── account.js
│   ├── auth.js
│   ├── dashboard.js
│   └── api.js
├── views/               # View templates (EJS)
│   ├── components/      # Reusable components
│   ├── layouts/         # Layout templates
│   ├── partials/        # Partial templates (header, footer, etc.)
│   ├── auth/            # Authentication views
│   ├── index.ejs
│   ├── about.ejs
│   └── dashboard.ejs
├── models/              # Database models (Sequelize)
│   ├── account.js
│   └── index.js
├── middleware/          # Express middleware
│   ├── auth.js
│   ├── optionalAuth.js
│   ├── validation.js
│   └── viewAuth.js
├── config/              # Configuration files
│   ├── passport.js
│   └── config.json
├── public/              # Static files
│   └── css/
├── tests/               # Test files
└── app.js               # Express app setup
```

## Architecture Layers

### 1. Controllers (`backend/controllers/`)

**Purpose:** Handle all business logic and coordinate between models and views.

**Responsibilities:**
- Process requests
- Validate input (business rules)
- Interact with models
- Format responses
- Handle errors

**Controllers:**
- `authController.js` - Authentication logic (login, register, password reset, MFA, OAuth)
- `accountController.js` - Account CRUD operations
- `dashboardController.js` - Dashboard rendering and logout
- `pageController.js` - Page rendering (home, about)

**Example:**
```javascript
class AuthController {
    static async login(req, res) {
        // Business logic here
        // No route definitions
    }
}
```

### 2. Routes (`backend/routes/`)

**Purpose:** Define URL endpoints and connect them to controllers.

**Responsibilities:**
- Define route paths
- Apply middleware
- Call controller methods
- No business logic

**Routes:**
- `auth.js` - Authentication routes
- `account.js` - Account API routes
- `dashboard.js` - Dashboard routes
- `api.js` - General API routes

**Example:**
```javascript
router.post('/login', AuthController.login);
router.get('/dashboard', requireAuth, DashboardController.renderDashboard);
```

### 3. Views (`backend/views/`)

**Purpose:** Presentation layer - templates for rendering HTML.

**Structure:**
- `components/` - Reusable view components
- `layouts/` - Page layouts
- `partials/` - Shared partials (header, footer)
- `auth/` - Authentication pages
- Individual page views

**Example:**
```
views/
├── layouts/main.ejs      # Main layout
├── partials/header.ejs   # Header partial
├── components/home-body.ejs  # Home page component
└── auth/login.ejs        # Login page
```

### 4. Models (`backend/models/`)

**Purpose:** Database layer - define data structures and relationships.

**Models:**
- `account.js` - User account model

**Example:**
```javascript
const Account = sequelize.define('Account', {
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    // ...
});
```

### 5. Middleware (`backend/middleware/`)

**Purpose:** Request processing functions (authentication, validation, etc.)

**Middleware:**
- `auth.js` - JWT authentication for API routes
- `viewAuth.js` - Authentication for view routes
- `optionalAuth.js` - Optional authentication
- `validation.js` - Input validation

## Request Flow

```
1. Request → app.js
2. Route → middleware (if any)
3. Route → Controller method
4. Controller → Model (database operations)
5. Controller → Response (JSON or render view)
```

## Example: Login Flow

```
1. User submits login form
   ↓
2. POST /api/auth/login
   ↓
3. routes/auth.js → AuthController.login()
   ↓
4. AuthController.login() → Account model (find user)
   ↓
5. AuthController.login() → Validate password
   ↓
6. AuthController.login() → Generate JWT token
   ↓
7. AuthController.login() → Return JSON response
   ↓
8. Frontend receives token → Redirect to dashboard
```

## Example: Dashboard Rendering

```
1. User navigates to /dashboard
   ↓
2. app.js → requireAuth middleware
   ↓
3. requireAuth → Verify token → Attach user to req
   ↓
4. app.js → DashboardController.renderDashboard()
   ↓
5. DashboardController → Render dashboard.ejs view
   ↓
6. View uses layouts/main.ejs + partials/header.ejs
   ↓
7. HTML sent to browser
```

## Separation of Concerns

### ✅ Good Practices

- **Controllers:** Business logic only
- **Routes:** Route definitions only
- **Views:** Presentation only
- **Models:** Data access only
- **Middleware:** Request processing only

### ❌ Anti-patterns to Avoid

- Business logic in routes
- Database queries in views
- Route definitions in controllers
- View rendering in models

## Benefits of This Structure

1. **Maintainability:** Easy to find and modify code
2. **Testability:** Controllers can be tested independently
3. **Scalability:** Easy to add new features
4. **Reusability:** Controllers can be reused
5. **Clarity:** Clear separation of responsibilities

## Adding New Features

### To add a new feature:

1. **Create Controller Method:**
   ```javascript
   // controllers/featureController.js
   class FeatureController {
       static async doSomething(req, res) {
           // Business logic
       }
   }
   ```

2. **Define Routes:**
   ```javascript
   // routes/feature.js
   router.post('/something', FeatureController.doSomething);
   ```

3. **Create Views (if needed):**
   ```ejs
   <!-- views/feature/index.ejs -->
   <h1>Feature Page</h1>
   ```

4. **Register Routes:**
   ```javascript
   // app.js
   app.use('/api/feature', featureRoutes);
   ```

## Testing

Controllers are tested independently:
- `backend/tests/auth.test.js` - Tests AuthController methods
- `backend/tests/account.test.js` - Tests AccountController methods

## Configuration

- `backend/config/passport.js` - Passport.js configuration
- `backend/config/config.json` - Database configuration
- Environment variables in `.env`

