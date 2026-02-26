#!/bin/bash
# MAESTROPAY - Complete AWS Deployment Script
# Deploys to EKS cluster in UAE (me-central-1)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
AWS_REGION="me-central-1"
AWS_ACCOUNT="368331615566"
ECR_REPO="${AWS_ACCOUNT}.dkr.ecr.${AWS_REGION}.amazonaws.com/maestro"
EKS_CLUSTER="maestro-cluster"
NAMESPACE="maestro"
DOMAIN="maestropay.ae"
IMAGE_TAG="${1:-latest}"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           MAESTROPAY - AWS Deployment                        ║"
echo "║              UAE Region (me-central-1)                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Check prerequisites
echo -e "${BLUE}Step 1: Checking prerequisites...${NC}"
command -v aws >/dev/null 2>&1 || { echo -e "${RED}AWS CLI required${NC}"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker required${NC}"; exit 1; }
command -v kubectl >/dev/null 2>&1 || { echo -e "${RED}kubectl required${NC}"; exit 1; }

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Step 2: Configure AWS
echo -e "${BLUE}Step 2: Configuring AWS...${NC}"
aws configure set region $AWS_REGION
aws sts get-caller-identity >/dev/null || { echo -e "${RED}AWS credentials not configured${NC}"; exit 1; }
echo -e "${GREEN}✓ AWS configured${NC}"

# Step 3: Login to ECR
echo -e "${BLUE}Step 3: Logging into ECR...${NC}"
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO
echo -e "${GREEN}✓ ECR login successful${NC}"

# Step 4: Build Docker image
echo -e "${BLUE}Step 4: Building Docker image...${NC}"
docker build \
  --platform linux/amd64 \
  -t $ECR_REPO:$IMAGE_TAG \
  -t $ECR_REPO:latest \
  --build-arg NEXT_TELEMETRY_DISABLED=1 \
  .
echo -e "${GREEN}✓ Docker image built${NC}"

# Step 5: Push to ECR
echo -e "${BLUE}Step 5: Pushing to ECR...${NC}"
docker push $ECR_REPO:$IMAGE_TAG
docker push $ECR_REPO:latest
echo -e "${GREEN}✓ Image pushed to ECR${NC}"

# Step 6: Update kubeconfig
echo -e "${BLUE}Step 6: Updating kubeconfig...${NC}"
aws eks update-kubeconfig --name $EKS_CLUSTER --region $AWS_REGION
echo -e "${GREEN}✓ Kubeconfig updated${NC}"

# Step 7: Create namespace
echo -e "${BLUE}Step 7: Creating namespace...${NC}"
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Namespace ready${NC}"

# Step 8: Create/update secrets
echo -e "${BLUE}Step 8: Creating secrets...${NC}"
# Load secrets from environment or .credentials.txt
if [ -f ".credentials.txt" ]; then
    source .credentials.txt 2>/dev/null || true
fi

# Create secrets (values from environment)
kubectl create secret generic maestro-secrets \
  --namespace=$NAMESPACE \
  --from-literal=DATABASE_URL="${DATABASE_URL:-postgresql://maestro:password@postgres:5432/maestro}" \
  --from-literal=NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-$(openssl rand -hex 32)}" \
  --from-literal=NEXTAUTH_URL="https://${DOMAIN}" \
  --from-literal=ENCRYPTION_KEY="${ENCRYPTION_KEY:-$(openssl rand -hex 32)}" \
  --dry-run=client -o yaml | kubectl apply -f -

# Create ECR image pull secret
kubectl create secret docker-registry ecr-secret \
  --namespace=$NAMESPACE \
  --docker-server=$ECR_REPO \
  --docker-username=AWS \
  --docker-password=$(aws ecr get-login-password --region $AWS_REGION) \
  --dry-run=client -o yaml | kubectl apply -f -

echo -e "${GREEN}✓ Secrets created${NC}"

# Step 9: Deploy application
echo -e "${BLUE}Step 9: Deploying application...${NC}"
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Update image if specific tag provided
if [ "$IMAGE_TAG" != "latest" ]; then
    kubectl set image deployment/maestro-app maestro=$ECR_REPO:$IMAGE_TAG -n $NAMESPACE
fi

echo -e "${GREEN}✓ Deployment applied${NC}"

# Step 10: Wait for rollout
echo -e "${YELLOW}Step 10: Waiting for rollout (this may take a few minutes)...${NC}"
kubectl rollout status deployment/maestro-app -n $NAMESPACE --timeout=300s

# Step 11: Get deployment info
echo -e "${BLUE}Step 11: Getting deployment info...${NC}"

# Wait for LoadBalancer
echo -e "${YELLOW}Waiting for LoadBalancer...${NC}"
sleep 10

LB_HOSTNAME=$(kubectl get svc maestro-service -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "pending")
INGRESS_HOSTNAME=$(kubectl get ingress maestro-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "pending")

# Step 12: Summary
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🎉 DEPLOYMENT SUCCESSFUL! 🎉                       ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}Deployment Information:${NC}"
echo -e "  Namespace:    ${GREEN}$NAMESPACE${NC}"
echo -e "  Image:        ${GREEN}$ECR_REPO:$IMAGE_TAG${NC}"
echo -e "  Replicas:     ${GREEN}$(kubectl get deployment maestro-app -n $NAMESPACE -o jsonpath='{.spec.replicas}')${NC}"
echo ""
echo -e "${CYAN}Access URLs:${NC}"
echo -e "  LoadBalancer: ${GREEN}http://$LB_HOSTNAME${NC}"
echo -e "  Domain:       ${GREEN}https://$DOMAIN${NC}"
echo -e "  API:          ${GREEN}https://api.$DOMAIN${NC}"
echo ""
echo -e "${CYAN}Pods Status:${NC}"
kubectl get pods -n $NAMESPACE -o wide
echo ""
echo -e "${CYAN}Next Steps:${NC}"
echo -e "  1. Verify Route53 DNS records point to ALB"
echo -e "  2. Check SSL certificate is valid"
echo -e "  3. Test the application at https://$DOMAIN"
echo ""
echo -e "${YELLOW}Useful Commands:${NC}"
echo -e "  View logs:    ${BLUE}kubectl logs -f -l app=maestro -n $NAMESPACE${NC}"
echo -e "  Scale up:     ${BLUE}kubectl scale deployment maestro-app --replicas=5 -n $NAMESPACE${NC}"
echo -e "  Rollback:     ${BLUE}kubectl rollout undo deployment/maestro-app -n $NAMESPACE${NC}"
