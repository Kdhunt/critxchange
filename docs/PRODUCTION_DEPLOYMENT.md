# Production Deployment Checklist

This guide provides a comprehensive checklist for deploying CritXChange to production.

## Pre-Deployment Checklist

### 1. Environment Configuration

- [ ] Set `NODE_ENV=production`
- [ ] Configure production database (PostgreSQL recommended)
- [ ] Set strong, unique `JWT_SECRET` (minimum 32 characters)
- [ ] Set strong, unique `SESSION_SECRET` (different from JWT_SECRET)
- [ ] Configure production domain in CORS settings
- [ ] Set up environment variables securely (not in code)

### 2. Database Setup

- [ ] Set up PostgreSQL database
- [ ] Configure database connection string
- [ ] Run migrations: `pnpm run migrate`
- [ ] Verify all tables created correctly
- [ ] Set up database backups
- [ ] Configure connection pooling
- [ ] Test database connection

### 3. Security Configuration

- [ ] Enable HTTPS (SSL/TLS certificate)
- [ ] Configure secure cookies (secure: true)
- [ ] Set up CORS with specific allowed origins
- [ ] Configure Helmet security headers
- [ ] Set up rate limiting
- [ ] Configure session store (Redis recommended)
- [ ] Review and update password requirements
- [ ] Enable MFA for admin accounts

### 4. OAuth Configuration

- [ ] Create production OAuth app in Google Cloud Console
- [ ] Add production redirect URI
- [ ] Set OAuth app to production mode
- [ ] Add production credentials to environment
- [ ] Test OAuth flow in production

### 5. Email Configuration

- [ ] Set up production SMTP service
- [ ] Configure email credentials
- [ ] Test email delivery
- [ ] Set up SPF/DKIM records
- [ ] Configure bounce handling
- [ ] Set up email monitoring

### 6. Application Configuration

- [ ] Update `backend/index.js` to not use `sync()` in production
- [ ] Configure proper logging
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure request logging
- [ ] Set up health check endpoint
- [ ] Configure graceful shutdown

### 7. Server Configuration

- [ ] Set up process manager (PM2, systemd, etc.)
- [ ] Configure auto-restart on crash
- [ ] Set up log rotation
- [ ] Configure resource limits
- [ ] Set up monitoring and alerts
- [ ] Configure firewall rules
- [ ] Set up reverse proxy (Nginx, etc.)

## Deployment Steps

### Step 1: Prepare Codebase

```bash
# Ensure all changes are committed
git status

# Create production branch (optional)
git checkout -b production

# Install only production dependencies from the lockfile
pnpm install --prod --frozen-lockfile
```

### Step 2: Database Migration

```bash
# Set production environment
export NODE_ENV=production

# Run migrations
pnpm run migrate

# Verify migration success
# Check database tables
```

### Step 3: Environment Variables

Create production `.env` file:

```env
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgres://user:password@host:5432/dbname

# Security
JWT_SECRET=your_very_strong_secret_min_32_chars
SESSION_SECRET=your_different_strong_secret

# OAuth (if using)
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_client_secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/auth/google/callback

# Email
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your_email@domain.com
SMTP_PASS=your_app_password

# CORS (adjust for your domain)
CORS_ORIGIN=https://yourdomain.com
```

### Step 4: Build and Deploy

```bash
# Install dependencies
pnpm install --prod --frozen-lockfile

# Start application
pnpm start
```

### Step 5: Process Manager Setup (PM2 Example)

```bash
# Install PM2 globally
pnpm add -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'critxchange',
    script: './backend/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
EOF

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
```

## Nginx Configuration Example

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Security Hardening

### 1. Update CORS Configuration

```javascript
// backend/app.js
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'https://yourdomain.com',
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
```

### 2. Add Rate Limiting

```bash
pnpm add express-rate-limit
```

```javascript
// backend/app.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Configure Session Store

```bash
pnpm add connect-redis redis
```

```javascript
// backend/app.js
const RedisStore = require('connect-redis')(session);
const redis = require('redis');
const redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
});

app.use(session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // HTTPS only
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: 'strict'
    }
}));
```

## Monitoring and Logging

### 1. Health Check Endpoint

Add to `backend/routes/api.js`:

```javascript
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});
```

### 2. Error Tracking (Sentry Example)

```bash
pnpm add @sentry/node
```

```javascript
// backend/index.js
const Sentry = require('@sentry/node');

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV
});
```

## Post-Deployment Verification

- [ ] Test user registration
- [ ] Test user login
- [ ] Test password reset
- [ ] Test OAuth login (if configured)
- [ ] Test MFA setup and login
- [ ] Verify HTTPS is working
- [ ] Check security headers
- [ ] Test API endpoints
- [ ] Verify email delivery
- [ ] Check error logs
- [ ] Monitor server resources
- [ ] Test database connections
- [ ] Verify backups are running

## Maintenance Tasks

### Regular Tasks

- [ ] Monitor error logs daily
- [ ] Review security logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate secrets quarterly
- [ ] Review and update security patches
- [ ] Monitor database performance
- [ ] Check disk space
- [ ] Review user activity logs

### Backup Strategy

- [ ] Database backups (daily)
- [ ] Configuration backups (weekly)
- [ ] Test restore procedures (monthly)
- [ ] Store backups off-site
- [ ] Encrypt backups

## Troubleshooting

### Application Won't Start

1. Check environment variables
2. Verify database connection
3. Check port availability
4. Review error logs
5. Verify file permissions

### Database Connection Issues

1. Verify DATABASE_URL is correct
2. Check firewall rules
3. Verify database is running
4. Check connection limits
5. Review database logs

### High Memory Usage

1. Enable clustering (PM2)
2. Review memory leaks
3. Optimize database queries
4. Add caching layer
5. Scale horizontally

## Scaling Considerations

- **Horizontal Scaling**: Use load balancer with multiple instances
- **Database**: Consider read replicas for high traffic
- **Caching**: Implement Redis for sessions and caching
- **CDN**: Use CDN for static assets
- **Monitoring**: Set up APM (Application Performance Monitoring)

## Support and Resources

- Application logs: Check PM2 logs or system logs
- Database logs: Check PostgreSQL logs
- Server monitoring: Use tools like New Relic, Datadog, or Grafana
- Security monitoring: Set up alerts for suspicious activity

## Emergency Procedures

### Rollback Plan

1. Keep previous version tagged in git
2. Document rollback steps
3. Test rollback procedure
4. Have database backup ready

### Incident Response

1. Identify the issue
2. Check logs and monitoring
3. Isolate affected systems if needed
4. Apply fix or rollback
5. Document incident
6. Post-mortem review

---

**Remember**: Security is an ongoing process. Regularly review and update your security measures.

