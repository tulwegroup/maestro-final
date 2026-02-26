#!/bin/bash
# MAESTRO - Force Deployment Update Script
# Use this when the EKS deployment needs to be manually updated

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

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           MAESTRO - Force Deployment Update                  ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Step 1: Update kubeconfig
echo -e "${BLUE}Step 1: Updating kubeconfig...${NC}"
aws eks update-kubeconfig --name $EKS_CLUSTER --region $AWS_REGION
echo -e "${GREEN}✓ Kubeconfig updated${NC}"

# Step 2: Check current deployment status
echo -e "${BLUE}Step 2: Current deployment status...${NC}"
kubectl get pods -n $NAMESPACE -o wide
echo ""
echo -e "${YELLOW}Current image:${NC}"
kubectl get deployment maestro-app -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].image}'
echo ""
echo ""

# Step 3: Force rollout restart
echo -e "${YELLOW}Step 3: Forcing rollout restart...${NC}"
kubectl rollout restart deployment/maestro-app -n $NAMESPACE
echo -e "${GREEN}✓ Rollout restart initiated${NC}"

# Step 4: Wait for rollout
echo -e "${YELLOW}Step 4: Waiting for new pods...${NC}"
kubectl rollout status deployment/maestro-app -n $NAMESPACE --timeout=300s

# Step 5: Verify new deployment
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           ✅ DEPLOYMENT UPDATED!                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}New pods:${NC}"
kubectl get pods -n $NAMESPACE -o wide

echo ""
echo -e "${CYAN}New image:${NC}"
kubectl get deployment maestro-app -n $NAMESPACE -o jsonpath='{.spec.template.spec.containers[0].image}'
echo ""

echo ""
echo -e "${CYAN}Ingress status:${NC}"
kubectl get ingress -n $NAMESPACE

echo ""
echo -e "${CYAN}Test the deployment:${NC}"
echo -e "  Main site:    ${GREEN}https://maestropay.ae${NC}"
echo -e "  Admin panel:  ${GREEN}https://maestropay.ae/admin${NC}"
echo ""
echo -e "${YELLOW}If still showing old version, run:${NC}"
echo -e "  ${BLUE}kubectl logs -f -l app=maestro -n $NAMESPACE --tail=100${NC}"
