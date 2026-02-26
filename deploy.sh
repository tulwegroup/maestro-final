#!/bin/bash
# MAESTRO - Simple Deploy Script
# Run this locally to deploy, or let GitHub Actions do it automatically

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="me-central-1"
ECR_REPO="368331615566.dkr.ecr.me-central-1.amazonaws.com/maestro"
EKS_CLUSTER="maestro-cluster"
NAMESPACE="maestro"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║               MAESTRO - Quick Deploy                         ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if we have the secrets
if [ -z "$DB_PASSWORD" ] || [ -z "$NEXTAUTH_SECRET" ] || [ -z "$ENCRYPTION_KEY" ]; then
    echo -e "${YELLOW}Loading secrets from .credentials.txt...${NC}"
    source .credentials.txt 2>/dev/null || {
        echo -e "${RED}Error: Set DB_PASSWORD, NEXTAUTH_SECRET, ENCRYPTION_KEY environment variables${NC}"
        exit 1
    }
fi

# Login to ECR
echo -e "${BLUE}Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO

# Build image
echo -e "${BLUE}Building Docker image...${NC}"
docker build -t $ECR_REPO:latest -t $ECR_REPO:$(git rev-parse --short HEAD 2>/dev/null || echo "v1") .

# Push image
echo -e "${BLUE}Pushing to ECR...${NC}"
docker push $ECR_REPO:latest

# Update kubeconfig
echo -e "${BLUE}Updating kubeconfig...${NC}"
aws eks update-kubeconfig --name $EKS_CLUSTER --region $AWS_REGION

# Deploy
echo -e "${BLUE}Deploying to EKS...${NC}"
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Create secrets
kubectl create secret generic maestro-secrets \
  --namespace=$NAMESPACE \
  --from-literal=DATABASE_URL="postgresql://maestro_admin:$DB_PASSWORD@maestro-cluster.cluster-c1m0cmy8agx9.me-central-1.rds.amazonaws.com:5432/maestro?sslmode=require" \
  --from-literal=NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
  --from-literal=NEXTAUTH_URL="https://maestro.app" \
  --from-literal=ENCRYPTION_KEY="$ENCRYPTION_KEY" \
  --dry-run=client -o yaml | kubectl apply -f -

# Create ECR secret
kubectl create secret docker-registry ecr-secret \
  --namespace=$NAMESPACE \
  --docker-server=$ECR_REPO \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region $AWS_REGION) \
  --dry-run=client -o yaml | kubectl apply -f -

# Apply deployment
export IMAGE_TAG=latest
envsubst < k8s/deployment.yaml | kubectl apply -f -

# Wait for rollout
echo -e "${YELLOW}Waiting for deployment...${NC}"
kubectl rollout status deployment/maestro-app -n $NAMESPACE --timeout=300s

# Get URL
LB_URL=$(kubectl get svc maestro-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              🎉 DEPLOYMENT SUCCESSFUL! 🎉                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "${GREEN}Application URL: http://$LB_URL${NC}"
echo ""
kubectl get pods -n $NAMESPACE
