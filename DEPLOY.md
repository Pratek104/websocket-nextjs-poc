# VPS Deployment Guide (Contabo with Nginx + PM2)

## Prerequisites
- Node.js 18+ installed
- Nginx installed
- PM2 installed globally: `npm install -g pm2`
- Domain pointing to your VPS IP

## 1. Clone and Setup

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Create app directory
mkdir -p /var/www/websocket-poc
cd /var/www/websocket-poc

# Clone your repo (or upload files)
git clone https://github.com/yourusername/websocket-nextjs-poc.git .

# Install dependencies
npm install

# Build Next.js
npm run build
```

## 2. Environment Variables

```bash
# Create production env file
cp .env.production .env

# Edit with your domain
nano .env
```

Set these values:
```
NODE_ENV=production
PORT=3000
WS_PORT=3001
NEXT_PUBLIC_WS_URL=wss://yourdomain.com/ws
```

## 3. Nginx Setup

```bash
# Copy nginx config
sudo cp nginx.conf.example /etc/nginx/sites-available/yourdomain.com

# Edit and replace 'yourdomain.com' with your actual domain
sudo nano /etc/nginx/sites-available/yourdomain.com

# Enable the site
sudo ln -s /etc/nginx/sites-available/yourdomain.com /etc/nginx/sites-enabled/

# Test nginx config
sudo nginx -t

# Get SSL certificate (if not already done)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Reload nginx
sudo systemctl reload nginx
```

## 4. PM2 Setup

```bash
cd /var/www/websocket-poc

# Start both apps with PM2
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 5. Useful PM2 Commands

```bash
# View logs
pm2 logs

# View status
pm2 status

# Restart apps
pm2 restart all

# Stop apps
pm2 stop all

# Reload after code changes
cd /var/www/websocket-poc
git pull
npm install
npm run build
pm2 restart all
```

## 6. Firewall (if using UFW)

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

## Environment Variables Summary

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Next.js server port |
| `WS_PORT` | `3001` | WebSocket server port |
| `NEXT_PUBLIC_WS_URL` | `wss://yourdomain.com/ws` | Client WebSocket URL |

## Troubleshooting

**WebSocket not connecting:**
- Check nginx config has `/ws` location block
- Verify PM2 shows both apps running: `pm2 status`
- Check logs: `pm2 logs websocket-server`

**502 Bad Gateway:**
- Apps not running: `pm2 restart all`
- Check ports: `netstat -tlnp | grep -E '3000|3001'`

**SSL issues:**
- Renew cert: `sudo certbot renew`
- Check cert path in nginx config
