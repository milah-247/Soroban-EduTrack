# SorobanEduTrack

Blockchain-based education rewards and performance tracking platform on Stellar, using Soroban smart contracts.

## Architecture

```
┌─────────────┐    ┌─────────────┐    ┌──────────────────┐
│   Frontend  │───▶│   Backend   │───▶│ Soroban Contract │
│  React/Vite │    │  Node/Express│    │   (Stellar)      │
│  port 3000  │    │  port 5000  │    └──────────────────┘
└─────────────┘    └──────┬──────┘
                          │
                   ┌──────▼──────┐
                   │Python/FastAPI│
                   │  port 8000  │
                   └─────────────┘
```

## Quick Start

```bash
# 1. Copy and fill env vars
cp .env.example .env

# 2. Start all services
docker-compose up --build

# Services:
#   Frontend:       http://localhost:3000
#   Backend API:    http://localhost:5000
#   Analytics API:  http://localhost:8000
```

## Smart Contract

### Build & Test
```bash
cd contracts/edu_track
cargo test
cargo build --target wasm32-unknown-unknown --release
```

### Deploy to Testnet
```bash
export ADMIN_SECRET=your_secret_key
./scripts/deploy.sh
```

### Contract Functions

| Function | Caller | Description |
|---|---|---|
| `initialize(admin, token_id, threshold)` | Admin | One-time setup |
| `set_role(caller, target, role)` | Admin | Assign Admin/Teacher/Student role |
| `reward_student(caller, student, activity_id, amount)` | Admin/Teacher | Reward for unique activity |
| `bulk_reward(caller, students, activity_ids, amounts)` | Admin/Teacher | Batch reward distribution |
| `redeem(student, reward_type, amount)` | Student | Redeem tokens |
| `balance(student)` | Anyone | Query EDU balance |
| `propose(proposer, proposal_id, action, amount, target)` | Admin | Create multisig proposal |
| `approve(approver, proposal_id)` | Admin | Approve proposal (executes at threshold) |

## Backend API

### Auth
```
POST /auth/sep10     { publicKey }           → { transaction, nonce }
POST /auth/verify    { signedXdr, publicKey } → { token }
```

### Rewards
```
POST /reward         { studentAddress, activityId, amount }
POST /reward/bulk    { rewards: [...] }
GET  /reward/student/:wallet
```

### Redemption
```
POST /redeem         { studentAddress, rewardType, amount }
```

### Treasury
```
POST /treasury/fund    { proposalId, amount, targetAddress }
POST /treasury/approve { proposalId }
```

## Analytics API (Python)

```
POST /events                          Ingest reward event
GET  /analytics/top-students?n=10     Top earners
GET  /analytics/trends                Token distribution by activity type
GET  /analytics/anomalies             Students exceeding reward threshold
GET  /analytics/student/:address      Per-student metrics
GET  /analytics/summary               Overall stats
```

## Testing

```bash
# Smart contract tests
cd contracts/edu_track && cargo test

# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test

# Python tests
cd python-service && pytest tests/ -v
```

## Roles

| Role | Permissions |
|---|---|
| Admin | Full access, treasury management, role assignment |
| Teacher | Assign rewards to students |
| Student | View balance, redeem tokens |

## Security

- SEP-10 authentication with replay attack prevention
- Role-based access control enforced on-chain and in API
- Duplicate reward prevention via on-chain activity tracking
- Multisig treasury (configurable threshold)
- Rate limiting on all API endpoints
- Helmet.js security headers
- Input validation on all endpoints
