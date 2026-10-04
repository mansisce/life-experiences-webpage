# Droplet runbook: Rewards BFF and dashboard

These steps take the Rewards backend (BFF) and the Streamlit dashboard live on the existing DigitalOcean droplet, next to Beegle. Run them **as root on the droplet**, in order. Each step says what you should see. Stop and ask if you see something else.

| What | Where |
|---|---|
| Code | `/opt/rewards` (git checkout, owned by the `rewards` user) |
| Data | `/var/lib/rewards`: `rewards.db`, `photos/`, `files/`, `backups/` |
| Secrets | `/etc/rewards/bff.env`, `/etc/rewards/dashboard.env` (root only) |
| API | https://rewards-api.64-227-167-131.nip.io → nginx → uvicorn on `127.0.0.1:8000` |
| Dashboard | https://rewards-dash.64-227-167-131.nip.io → nginx → Streamlit on `127.0.0.1:8501` |

Beegle isn't touched: its nginx site, its container and port 3000 stay as they are.

---

## 1. Firewall (once)

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable          # answer y; your SSH session stays connected
ufw status
```

✅ You should see `OpenSSH` and `Nginx Full` listed as `ALLOW`.

## 2. Tools (once)

```bash
apt update && apt install -y git curl certbot python3-certbot-nginx
curl -LsSf https://astral.sh/uv/install.sh | env UV_INSTALL_DIR=/usr/local/bin sh
uv --version
```

✅ You should see `uv 0.x.y`.

## 3. User and folders (once)

```bash
useradd --system --create-home --home-dir /home/rewards --shell /usr/sbin/nologin rewards
install -d -o rewards -g rewards -m 750 /var/lib/rewards /var/lib/rewards/backups
install -d -o rewards -g rewards -m 755 /opt/rewards
install -d -o root -g root -m 700 /etc/rewards
```

## 4. Get the code (once)

**If the GitHub repo is public:**

```bash
sudo -u rewards -H git clone https://github.com/mansisce/life-experiences-webpage.git /opt/rewards
```

**If it's private,** give the droplet a read-only deploy key first:

```bash
sudo -u rewards -H ssh-keygen -t ed25519 -N "" -f /home/rewards/.ssh/id_ed25519 -C rewards-droplet
cat /home/rewards/.ssh/id_ed25519.pub
```

Then in GitHub, go to the repo's **Settings → Deploy keys → Add deploy key**, paste the key, and leave **Allow write access** off. Then run:

```bash
sudo -u rewards -H git clone git@github.com:mansisce/life-experiences-webpage.git /opt/rewards
```

**Either way,** use the deployment branch until it's merged to `main`:

```bash
cd /opt/rewards && sudo -u rewards -H git checkout feature/rewards-mfe-bff
```

## 5. Install the Python apps

```bash
cd /opt/rewards/services/bff        && sudo -u rewards -H uv sync --frozen --no-dev
cd /opt/rewards/apps/rewards-dashboard && sudo -u rewards -H uv sync --frozen
```

✅ Each command ends without errors. The first run downloads Python packages and takes a minute or two.

## 6. Secrets

Generate two random values and keep them in your password manager:

```bash
python3 -c "import secrets; print('TOKEN', secrets.token_urlsafe(32)); print('KEY  ', secrets.token_urlsafe(32))"
```

Create the two settings files from the templates, then edit them:

```bash
cp /opt/rewards/deploy/env/bff.env.example       /etc/rewards/bff.env
cp /opt/rewards/deploy/env/dashboard.env.example /etc/rewards/dashboard.env
chmod 600 /etc/rewards/*.env
nano /etc/rewards/bff.env
```

In `bff.env`, set:
- `BFF_DEMO_TOKEN` to the TOKEN value;
- `BFF_SIGNING_KEY` to the KEY value;
- the `<mfe-project>` part of `BFF_CORS_ORIGINS` to your Rewards Vercel project name.

Keep the single quotes around the `BFF_CORS_ORIGINS` value.

Then run `nano /etc/rewards/dashboard.env` and set `BFF_TOKEN` to the **same** TOKEN value.

The same TOKEN also goes into Vercel later, as `VITE_BFF_TOKEN`.

## 7. Start the services

```bash
cp /opt/rewards/deploy/systemd/rewards-* /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now rewards-bff rewards-dashboard rewards-snapshot.timer rewards-export.timer
sleep 3 && curl -s http://127.0.0.1:8000/health
```

✅ You should see `{"status":"ok"}`.

If not, run `journalctl -u rewards-bff -n 50 --no-pager`. A line like `BFF_DEMO_TOKEN must be a random value…` means step 6 wasn't saved.

```bash
systemctl list-timers 'rewards-*'
```

✅ You should see both timers (`rewards-snapshot` and `rewards-export`) with a NEXT time.

## 8. nginx and HTTPS

```bash
cp /opt/rewards/deploy/nginx/rewards-api.conf  /etc/nginx/sites-available/rewards-api
cp /opt/rewards/deploy/nginx/rewards-dash.conf /etc/nginx/sites-available/rewards-dash
ln -s /etc/nginx/sites-available/rewards-api  /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/rewards-dash /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx --redirect -d rewards-api.64-227-167-131.nip.io -d rewards-dash.64-227-167-131.nip.io
```

✅ `nginx -t` says `syntax is ok` and `test is successful`, and certbot ends with `Congratulations!`. Certificates renew automatically.

## 9. Check from anywhere

```bash
curl -s https://rewards-api.64-227-167-131.nip.io/health
```

✅ You should see `{"status":"ok"}`. Also:
- https://rewards-dash.64-227-167-131.nip.io opens the dashboard; it's empty until data exists.
- https://rewards-api.64-227-167-131.nip.io/docs gives **404**, because docs are hidden in production.

---

## Everyday commands

| To | Run |
|---|---|
| See BFF logs | `journalctl -u rewards-bff -f` |
| Restart | `systemctl restart rewards-bff rewards-dashboard` |
| Update to the latest code | `install -m 755 /opt/rewards/deploy/deploy.sh /usr/local/sbin/rewards-deploy`, then `rewards-deploy origin/feature/rewards-mfe-bff`. It checks health and rolls back automatically if the new version won't start |
| Take a snapshot now | `systemctl start rewards-snapshot.service && ls -t /var/lib/rewards/backups \| head -1` |
| List backups | `ls -lh /var/lib/rewards/backups` |

## Restore from a backup

```bash
systemctl stop rewards-bff
cp /var/lib/rewards/backups/<snapshot>.db /var/lib/rewards/rewards.db
rm -f /var/lib/rewards/rewards.db-wal /var/lib/rewards/rewards.db-shm
chown rewards:rewards /var/lib/rewards/rewards.db
systemctl start rewards-bff
```

## Still to come

These are covered in [docs/rewards/DEPLOY.md](../docs/rewards/DEPLOY.md):
- the home-computer backup pull (`home-pull-backup.sh`, A13);
- the GitHub Actions deploy user (A19);
- moving your laptop data (A18).
