# MAESTROPAY Deployment Guide

## Quick Deploy

```bash
# From your local machine with AWS credentials configured
./deploy-aws.sh
```

## Prerequisites

### 1. AWS CLI & Tools
```bash
# Install AWS CLI
brew install awscli  # macOS
# or
sudo apt install awscli  # Ubuntu

# Install kubectl
brew install kubectl  # macOS
# or
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install Docker
brew install docker  # macOS
```

### 2. AWS Credentials
```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region (me-central-1)
```

### 3. Required Secrets

Set these in your environment or `.credentials.txt`:

```bash
export DATABASE_URL="postgresql://maestro_admin:PASSWORD@maestro-cluster.cluster-c1m0cmy8agx9.me-central-1.rds.amazonaws.com:5432/maestro?sslmode=require"
export NEXTAUTH_SECRET="your-secret-key-min-32-chars"
export ENCRYPTION_KEY="your-encryption-key-32-chars"
```

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Route 53      │────▶│  ALB Ingress     │────▶│  EKS Cluster    │
│ maestropay.ae   │     │  (SSL/HTTPS)     │     │  (3 replicas)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                          │
                        ┌─────────────────────────────────┼─────────────────────────────────┐
                        │                                 │                                 │
                        ▼                                 ▼                                 ▼
                ┌───────────────┐               ┌───────────────┐               ┌───────────────┐
                │   RDS         │               │     ECR       │               │   Secrets     │
                │  PostgreSQL   │               │   Docker      │               │   Manager     │
                └───────────────┘               └───────────────┘               └───────────────┘
```

## Deployment Methods

### Method 1: GitHub Actions (Recommended)

1. Push to main branch
2. GitHub Actions automatically:
   - Builds Docker image
   - Pushes to ECR
   - Deploys to EKS

### Method 2: Manual Deploy

```bash
# Build and push
docker build -t 368331615566.dkr.ecr.me-central-1.amazonaws.com/maestro:latest .
docker push 368331615566.dkr.ecr.me-central-1.amazonaws.com/maestro:latest

# Deploy
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

### Method 3: Using deploy script

```bash
./deploy-aws.sh [image-tag]
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check pods
kubectl get pods -n maestro

# Check services
kubectl get svc -n maestro

# Check ingress
kubectl get ingress -n maestro

# View logs
kubectl logs -f -l app=maestro -n maestro
```

### 2. DNS Configuration

In Route 53, create A records pointing to ALB:

| Record | Type  | Value |
|--------|-------|-------|
| maestropay.ae | A | ALIAS to ALB |
| www.maestropay.ae | CNAME | maestropay.ae |
| api.maestropay.ae | CNAME | maestropay.ae |

### 3. SSL Certificate

Certificate should be created in ACM for `*.maestropay.ae` and `maestropay.ae`

## Scaling

```bash
# Manual scale
kubectl scale deployment maestro-app --replicas=5 -n maestro

# The HPA will auto-scale based on CPU/Memory
kubectl get hpa -n maestro
```

## Rollback

```bash
# View rollout history
kubectl rollout history deployment/maestro-app -n maestro

# Rollback to previous version
kubectl rollout undo deployment/maestro-app -n maestro

# Rollback to specific revision
kubectl rollout undo deployment/maestro-app --to-revision=2 -n maestro
```

## Monitoring

```bash
# Pod status
kubectl get pods -n maestro -w

# Resource usage
kubectl top pods -n maestro

# Events
kubectl get events -n maestro --sort-by='.lastTimestamp'
```

## Troubleshooting

### Pod not starting
```bash
kubectl describe pod <pod-name> -n maestro
kubectl logs <pod-name> -n maestro
```

### Service not accessible
```bash
kubectl describe svc maestro-service -n maestro
kubectl describe ingress maestro-ingress -n maestro
```

### Database connection issues
```bash
kubectl get secrets maestro-secrets -n maestro -o yaml
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| NEXTAUTH_SECRET | NextAuth.js secret (32+ chars) | Yes |
| NEXTAUTH_URL | Application URL (https://maestropay.ae) | Yes |
| ENCRYPTION_KEY | Data encryption key (32 chars) | Yes |
| BINANCE_API_KEY | Binance API key | No |
| RAIN_API_KEY | Rain Exchange API key | No |
| RAKBANK_API_KEY | RAKBANK API key | No |
| MASHREQ_API_KEY | Mashreq API key | No |
| WIO_API_KEY | Wio Bank API key | No |
