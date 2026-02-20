# MAESTRO - AWS UAE Deployment Guide

## Overview

This document provides comprehensive instructions for deploying the Maestro platform to AWS infrastructure in the UAE region, ensuring data residency compliance with UAE Central Bank regulations.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         AWS UAE Infrastructure                       │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │   Route 53   │───▶│  CloudFront  │───▶│    ALB (Dubai)       │  │
│  │   (DNS)      │    │   (CDN)      │    │                      │  │
│  └──────────────┘    └──────────────┘    └──────────┬───────────┘  │
│                                                     │              │
│  ┌─────────────────────────────────────────────────▼───────────┐  │
│  │                    ECS Fargate Cluster                        │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │  │
│  │  │  Next.js    │  │  Next.js    │  │  Next.js    │          │  │
│  │  │  Instance 1 │  │  Instance 2 │  │  Instance 3 │          │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘          │  │
│  └─────────────────────────────────────────────────┬───────────┘  │
│                                                     │              │
│  ┌─────────────────────────────────────────────────▼───────────┐  │
│  │                    RDS PostgreSQL                            │  │
│  │            (Primary: Dubai, Standby: Abu Dhabi)              │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────┐    ┌──────────────────────────────────┐ │
│  │  ElastiCache Redis   │    │     S3 (Encrypted Buckets)       │ │
│  │  (Session Cache)     │    │     (Document Storage)           │ │
│  └──────────────────────┘    └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## AWS Region Configuration

### Primary Region: me-south-1 (Bahrain - Closest to UAE)
### Alternative: me-central-1 (UAE - When Available)

**Note:** As of 2024, AWS has announced the UAE region. Use Bahrain (me-south-1) as the primary until UAE region is fully available.

## Prerequisites

### 1. AWS Account Setup
```bash
# Install AWS CLI
brew install awscli  # macOS
# or
sudo apt-get install awscli  # Ubuntu

# Configure AWS credentials
aws configure
# Region: me-south-1
# Output format: json
```

### 2. Required AWS Services
- **ECS Fargate** - Container orchestration
- **RDS PostgreSQL** - Primary database
- **ElastiCache Redis** - Session management
- **S3** - Document storage
- **CloudFront** - CDN
- **Route 53** - DNS management
- **ACM** - SSL certificates
- **Secrets Manager** - API keys and secrets
- **CloudWatch** - Monitoring and logging
- **WAF** - Web application firewall

## Deployment Steps

### Step 1: Create VPC and Networking

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --region me-south-1 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=maestro-vpc}]'

# Create public subnets
aws ec2 create-subnet \
  --vpc-id vpc-xxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone me-south-1a

aws ec2 create-subnet \
  --vpc-id vpc-xxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone me-south-1b

# Create private subnets for RDS
aws ec2 create-subnet \
  --vpc-id vpc-xxx \
  --cidr-block 10.0.3.0/24 \
  --availability-zone me-south-1a

aws ec2 create-subnet \
  --vpc-id vpc-xxx \
  --cidr-block 10.0.4.0/24 \
  --availability-zone me-south-1b
```

### Step 2: Create RDS PostgreSQL Instance

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name maestro-db-subnet \
  --db-subnet-group-description "Maestro DB Subnet Group" \
  --subnet-ids subnet-xxx subnet-yyy

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier maestro-db \
  --db-instance-class db.r6g.xlarge \
  --engine postgres \
  --engine-version 15.4 \
  --master-username maestro_admin \
  --master-user-password <secure-password> \
  --allocated-storage 100 \
  --storage-encrypted \
  --kms-key-id <kms-key-arn> \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name maestro-db-subnet \
  --backup-retention-period 30 \
  --multi-az \
  --region me-south-1
```

### Step 3: Create ElastiCache Redis Cluster

```bash
# Create Redis subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name maestro-redis-subnet \
  --cache-subnet-group-description "Maestro Redis Subnet" \
  --subnet-ids subnet-xxx subnet-yyy

# Create Redis cluster
aws elasticache create-replication-group \
  --replication-group-id maestro-redis \
  --replication-group-description "Maestro Session Cache" \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.r6g.large \
  --num-cache-clusters 2 \
  --cache-subnet-group-name maestro-redis-subnet \
  --security-group-ids sg-xxx \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled
```

### Step 4: Create ECS Cluster

```bash
# Create ECS cluster
aws ecs create-cluster \
  --cluster-name maestro-cluster \
  --region me-south-1

# Create ECR repository
aws ecr create-repository \
  --repository-name maestro-app \
  --image-scanning-configuration scanOnPush=true \
  --region me-south-1
```

### Step 5: Build and Push Docker Image

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
# Build and push
docker build -t maestro-app .
docker tag maestro-app:latest <account-id>.dkr.ecr.me-south-1.amazonaws.com/maestro-app:latest
docker push <account-id>.dkr.ecr.me-south-1.amazonaws.com/maestro-app:latest
```

### Step 6: Create ECS Task Definition

```json
{
  "family": "maestro-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::<account>:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::<account>:role/maestroTaskRole",
  "containerDefinitions": [
    {
      "name": "maestro-app",
      "image": "<account-id>.dkr.ecr.me-south-1.amazonaws.com/maestro-app:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_URL",
          "value": "postgresql://maestro:<password>@maestro-db.xxx.me-south-1.rds.amazonaws.com:5432/maestro"
        }
      ],
      "secrets": [
        {
          "name": "ENCRYPTION_KEY",
          "valueFrom": "arn:aws:secretsmanager:me-south-1:<account>:secret:maestro/encryption-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/maestro",
          "awslogs-region": "me-south-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Step 7: Create Application Load Balancer

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name maestro-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx \
  --region me-south-1

# Create target group
aws elbv2 create-target-group \
  --name maestro-targets \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxx \
  --target-type ip \
  --health-check-path /api/health

# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn <alb-arn> \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=<acm-cert-arn> \
  --default-actions Type=forward,TargetGroupArn=<target-group-arn>
```

### Step 8: Configure CloudFront

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

### Step 9: Configure WAF (Web Application Firewall)

```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
  --name maestro-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json \
  --region me-south-1
```

## Environment Variables

Store all sensitive configuration in AWS Secrets Manager:

```bash
# Create secrets
aws secretsmanager create-secret \
  --name maestro/database-url \
  --secret-string "postgresql://..."

aws secretsmanager create-secret \
  --name maestro/encryption-key \
  --secret-string "<256-bit-encryption-key>"

aws secretsmanager create-secret \
  --name maestro/uae-pass-client-secret \
  --secret-string "<uae-pass-secret>"

aws secretsmanager create-secret \
  --name maestro/rta-api-key \
  --secret-string "<rta-api-key>"

# ... repeat for all API keys
```

## Auto-Scaling Configuration

```bash
# Configure ECS auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/maestro-cluster/maestro-service \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/maestro-cluster/maestro-service \
  --policy-name maestro-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Backup and Disaster Recovery

### Database Backups
- Automated daily backups with 30-day retention
- Point-in-time recovery enabled
- Cross-region replication to eu-south-1 (backup region)

### S3 Cross-Region Replication
```bash
# Enable CRR
aws s3api put-bucket-replication \
  --bucket maestro-documents \
  --replication-configuration file://replication-config.json
```

## Monitoring and Alerting

### CloudWatch Alarms
- CPU utilization > 80%
- Memory utilization > 80%
- Database connections > 80%
- 5XX error rate > 1%
- Response time > 2 seconds

### CloudWatch Dashboard
Create a dashboard with:
- ECS service metrics
- RDS metrics
- ElastiCache metrics
- ALB metrics
- CloudFront metrics

## Security Configuration

### Security Groups
```yaml
# ALB Security Group
Inbound:
  - Port 443 (HTTPS) from 0.0.0.0/0
  - Port 80 (HTTP) from 0.0.0.0/0 (redirect to HTTPS)
Outbound:
  - Port 3000 to ECS Security Group

# ECS Security Group
Inbound:
  - Port 3000 from ALB Security Group
Outbound:
  - Port 5432 to RDS Security Group
  - Port 6379 to ElastiCache Security Group
  - Port 443 to 0.0.0.0/0 (for external APIs)

# RDS Security Group
Inbound:
  - Port 5432 from ECS Security Group
Outbound: None

# ElastiCache Security Group
Inbound:
  - Port 6379 from ECS Security Group
Outbound: None
```

### KMS Key Configuration
```bash
# Create KMS key for encryption
aws kms create-key \
  --description "Maestro encryption key" \
  --key-usage ENCRYPT_DECRYPT \
  --origin AWS_KMS

# Key policy for automatic rotation
aws kms enable-key-rotation --key-id <key-id>
```

## Compliance Checklist

- [ ] All data stored in UAE region (me-south-1 or me-central-1)
- [ ] Encryption at rest enabled (KMS)
- [ ] Encryption in transit enabled (TLS 1.3)
- [ ] VPC flow logs enabled
- [ ] CloudTrail enabled
- [ ] AWS Config enabled
- [ ] WAF enabled
- [ ] Security Hub enabled
- [ ] GuardDuty enabled
- [ ] Penetration testing scheduled

## Cost Estimation

### Monthly AWS Costs (Production)
- ECS Fargate (3 instances): $300
- RDS PostgreSQL (db.r6g.xlarge, Multi-AZ): $800
- ElastiCache Redis: $200
- ALB: $50
- CloudFront: $100
- S3 (100GB): $5
- CloudWatch: $50
- Other services: $100

**Total estimated monthly cost: ~$1,600 USD**

## Support Contacts

- AWS Enterprise Support: [Your AWS TAM]
- 24/7 Emergency: +971-XXX-XXXX
- Security Team: security@maestro.ae
