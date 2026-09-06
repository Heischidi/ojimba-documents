# 🛒 Digital Marketplace

A production-ready digital product marketplace where customers can browse, purchase, and automatically receive secure download access by email after successful Paystack payment.

---

## Architecture

```
Customer → Next.js Frontend → FastAPI Backend → PostgreSQL
                                 ↓
                    Paystack (payment) → Webhook → S3 (files) → Resend (email)
```

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod |
| Backend | Python 3.12, FastAPI, Pydantic v2, SQLAlchemy 2.0, asyncpg |
| Database | PostgreSQL 16 |
| Payments | Paystack |
| File Storage | AWS S3 (private bucket) |
| Email | Resend |
| Auth | JWT in HTTP-only cookies, Argon2 password hashing |
| Infra | Docker, docker-compose |

---

## Folder Structure

```
/
├── frontend/               # Next.js 15 application
│   ├── app/                # App Router pages
│   │   ├── page.tsx        # Homepage
│   │   ├── products/       # Public product pages
│   │   ├── checkout/       # Checkout flow
│   │   ├── payment/        # Success/failed pages
│   │   ├── download/       # Secure download page
│   │   └── admin/          # Admin dashboard
│   ├── lib/api.ts          # Typed API client
│   ├── types/index.ts      # TypeScript types
│   └── Dockerfile
│
├── backend/                # FastAPI application
│   ├── app/
│   │   ├── api/v1/         # Route handlers
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   ├── repositories/   # Data access layer
│   │   ├── core/           # Config, security, DB, logging
│   │   └── main.py
│   ├── alembic/            # Database migrations
│   ├── tests/              # Pytest test suite
│   ├── scripts/            # Admin seed script
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker-compose.yml      # Local development
├── .env.example            # Environment variable template
└── README.md
```

---

## Local Setup

### 1. Clone and configure

```bash
git clone <repo-url>
cd digital-marketplace
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start with Docker (recommended)

```bash
docker-compose up --build
```

This starts:
- PostgreSQL on port 5432
- FastAPI backend on http://localhost:8000
- Next.js frontend on http://localhost:3000

### 3. Or run manually

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Create admin user
python scripts/create_admin.py

# Start server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Long random secret for JWT signing |
| `PAYSTACK_SECRET_KEY` | Paystack secret key (sk_test_... or sk_live_...) |
| `PAYSTACK_PUBLIC_KEY` | Paystack public key |
| `AWS_ACCESS_KEY_ID` | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key |
| `AWS_REGION` | S3 bucket region (e.g. us-east-1) |
| `AWS_S3_BUCKET` | S3 bucket name |
| `RESEND_API_KEY` | Resend API key (re_...) |
| `EMAIL_FROM` | Verified sender email address |
| `APP_URL` | Frontend URL (e.g. https://yourstore.com) |
| `DOWNLOAD_TOKEN_EXPIRY_HOURS` | Default: 48 |
| `MAX_DOWNLOADS` | Default: 5 |
| `MAX_FILE_SIZE_MB` | Default: 500 |

---

## AWS S3 Setup

1. Create an S3 bucket (e.g. `my-marketplace-files`)
2. **Disable all public access** on the bucket
3. Create an IAM user with `AmazonS3FullAccess` (or a scoped policy)
4. Add the IAM credentials to `.env`
5. Thumbnails are uploaded with `public-read` ACL; product files are `private`

### Recommended IAM Policy (least privilege)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject", "s3:PutObjectAcl"],
      "Resource": "arn:aws:s3:::my-marketplace-files/*"
    }
  ]
}
```

---

## Paystack Setup

1. Create a [Paystack](https://paystack.com) account
2. Copy your **Test** secret and public keys from the dashboard
3. Set them in `.env` as `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY`
4. In Paystack dashboard → Settings → API Keys & Webhooks:
   - Set webhook URL to: `https://your-backend.com/api/payments/webhook`
5. Webhooks are verified using HMAC-SHA512 signature

**Test cards:**
- `4084084084084081` with CVV `408`, any future expiry

---

## Resend Setup

1. Create a [Resend](https://resend.com) account
2. Add and verify your sending domain
3. Create an API key
4. Set `RESEND_API_KEY` and `EMAIL_FROM` (must match verified domain) in `.env`

---

## Database Migrations

```bash
cd backend

# Run all pending migrations
alembic upgrade head

# Create a new migration (after model changes)
alembic revision --autogenerate -m "describe your change"

# Rollback one migration
alembic downgrade -1
```

---

## Creating an Admin User

```bash
cd backend
python scripts/create_admin.py
```

Follow the prompts to enter email, name, and password. The password is hashed with Argon2id.

---

## Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v --cov=app --cov-report=term-missing
```

Tests use an in-memory SQLite database — no external dependencies needed.

---

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend URL
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` = your Paystack public key

### Backend → Railway / Render

**Railway:**
```bash
railway login
railway init
railway up
```

Set all backend environment variables in the Railway dashboard.

**Render:**
1. Create a Web Service from your GitHub repo
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set environment variables in the dashboard

### Database → Managed PostgreSQL

Use Railway PostgreSQL, Render PostgreSQL, Supabase, or Neon.
Set `DATABASE_URL` to the connection string.
Run migrations on deploy: `alembic upgrade head`

---

## Security

| Feature | Implementation |
|---|---|
| Password hashing | Argon2id via passlib |
| Admin auth | JWT in HTTP-only, Secure, SameSite=Lax cookie |
| Webhook verification | HMAC-SHA512 checked before processing |
| Download tokens | Cryptographically random (32 bytes), SHA-256 stored in DB |
| File storage | Private S3 bucket, files never publicly accessible |
| Download URLs | Short-lived (60s) presigned S3 URLs, S3 key never exposed |
| Input validation | Pydantic v2 on all API inputs |
| SQL injection | SQLAlchemy ORM with parameterized queries |
| Price trust | Backend always reads price from DB, never from frontend |
| Rate limiting | slowapi on auth and payment endpoints |
| CORS | Strict origin allowlist via env var |
| Audit logging | All admin actions logged to database |

---

## Payment Flow

```
Customer selects product
  ↓
POST /api/payments/initialize
  - Backend validates product exists and is_active
  - Backend reads price from DB (ignores any frontend price)
  - Creates PENDING order
  - Calls Paystack to initialize transaction
  - Returns authorization_url
  ↓
Customer pays on Paystack
  ↓
Paystack sends POST /api/payments/webhook
  - HMAC-SHA512 signature verified
  - Finds order by reference
  - Checks order not already PAID (idempotency)
  - Verifies amount matches DB price
  - Marks order as PAID
  - Generates secure download token (hash stored in DB)
  - Sends email via Resend with download link
  ↓
Customer clicks link in email → /download/{raw_token}
  ↓
GET /api/download/{token}
  - Hash token
  - Find in DB
  - Check: not expired, not revoked, count < max, order is PAID
  - Increment download count
  - Generate 60-second S3 presigned URL
  - Redirect (302) to presigned URL
  ↓
File downloads — S3 key never exposed
```

---

## Admin Workflow

1. Go to `/admin/login` and sign in
2. Navigate to **Products → Add Product**
3. Enter name, description, price
4. Upload digital file (stored privately on S3)
5. Upload thumbnail (optional)
6. Click **Publish**

The product is now live at `/products/{slug}`.

---

## Acceptance Test

1. ✅ Start: `docker-compose up`
2. ✅ Login to `/admin`
3. ✅ Create product "Test PDF" at ₦1,000
4. ✅ Upload `test.pdf`
5. ✅ Publish product
6. ✅ Open `/products/test-pdf`
7. ✅ Click Buy → enter email → redirect to Paystack
8. ✅ Complete Paystack test payment
9. ✅ Webhook received → HMAC verified → order PAID
10. ✅ Download token created (hash in DB)
11. ✅ Email sent via Resend
12. ✅ Customer clicks download link
13. ✅ Token validated → S3 presigned URL → file downloads
14. ✅ Direct S3 access impossible
15. ✅ Token expires after DOWNLOAD_TOKEN_EXPIRY_HOURS
16. ✅ Download limit enforced
17. ✅ Admin sees completed order at `/admin/orders`
18. ✅ Admin can resend email (revokes old token, creates new)
19. ✅ Duplicate webhook → idempotent (order stays PAID, no duplicate email)
20. ✅ Failed payment → no file access
