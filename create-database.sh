#!/bin/bash
# MAESTROPAY - Create AWS RDS Database
# Creates Aurora PostgreSQL Serverless v2 in UAE region

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
AWS_REGION="me-central-1"
DB_CLUSTER_NAME="maestro-cluster"
DB_NAME="maestro"
DB_USERNAME="maestro_admin"

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║        MAESTROPAY - AWS Database Creation                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI not installed. Please install it first:${NC}"
    echo "  brew install awscli  # macOS"
    echo "  sudo apt install awscli  # Ubuntu"
    exit 1
fi

# Check AWS credentials
echo -e "${BLUE}Checking AWS credentials...${NC}"
aws sts get-caller-identity || {
    echo -e "${RED}AWS credentials not configured. Run 'aws configure' first.${NC}"
    exit 1
}

# Generate random password if not provided
if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}Generating database password...${NC}"
    DB_PASSWORD=$(openssl rand -base64 32 | tr -d '=/+')
    echo -e "${GREEN}Generated password: $DB_PASSWORD${NC}"
    echo -e "${YELLOW}Save this password securely!${NC}"
fi

# Create DB subnet group (use default VPC subnets for simplicity)
echo -e "${BLUE}Creating DB subnet group...${NC}"
aws rds create-db-subnet-group \
    --db-subnet-group-name maestro-db-subnet \
    --db-subnet-group-description "MAESTROPAY database subnet group" \
    --subnet-ids $(aws ec2 describe-subnets --filters "Name=default-for-az,Values=true" --query "Subnets[*].SubnetId" --output text --region $AWS_REGION | tr '\t' ' ') \
    --region $AWS_REGION 2>/dev/null || echo "Subnet group already exists"

# Create security group for database
echo -e "${BLUE}Creating database security group...${NC}"
SG_ID=$(aws ec2 create-security-group \
    --group-name maestro-db-sg \
    --description "MAESTROPAY database security group" \
    --region $AWS_REGION \
    --query "GroupId" \
    --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
        --group-names maestro-db-sg \
        --region $AWS_REGION \
        --query "SecurityGroups[0].GroupId" \
        --output text)

echo -e "${GREEN}Security Group ID: $SG_ID${NC}"

# Create Aurora PostgreSQL cluster
echo -e "${BLUE}Creating Aurora PostgreSQL cluster (this takes 5-10 minutes)...${NC}"
aws rds create-db-cluster \
    --db-cluster-identifier $DB_CLUSTER_NAME \
    --database-name $DB_NAME \
    --master-username $DB_USERNAME \
    --master-user-password "$DB_PASSWORD" \
    --engine aurora-postgresql \
    --engine-version 15.10 \
    --db-subnet-group-name maestro-db-subnet \
    --vpc-security-group-ids $SG_ID \
    --storage-encrypted \
    --enable-cloudwatch-logs-exports '["postgresql"]' \
    --region $AWS_REGION \
    --serverless-v2-scaling-configuration MinCapacity=0.5,MaxCapacity=4 \
    2>/dev/null || echo "Cluster already exists or creation in progress"

# Create DB instance
echo -e "${BLUE}Creating DB instance...${NC}"
aws rds create-db-instance \
    --db-cluster-identifier $DB_CLUSTER_NAME \
    --db-instance-identifier maestro-instance-1 \
    --db-instance-class db.serverless \
    --engine aurora-postgresql \
    --region $AWS_REGION \
    2>/dev/null || echo "Instance already exists or creation in progress"

# Wait for cluster to be available
echo -e "${YELLOW}Waiting for cluster to be available (this may take 10-15 minutes)...${NC}"
aws rds wait db-cluster-available \
    --db-cluster-identifier $DB_CLUSTER_NAME \
    --region $AWS_REGION

# Get cluster endpoint
echo -e "${BLUE}Getting cluster endpoint...${NC}"
CLUSTER_ENDPOINT=$(aws rds describe-db-clusters \
    --db-cluster-identifier $DB_CLUSTER_NAME \
    --region $AWS_REGION \
    --query "DBClusters[0].Endpoint" \
    --output text)

# Output connection info
echo ""
echo -e "${GREEN}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║           🎉 Database Created Successfully!                   ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${CYAN}Database Connection Information:${NC}"
echo -e "  Host:     ${GREEN}$CLUSTER_ENDPOINT${NC}"
echo -e "  Port:     ${GREEN}5432${NC}"
echo -e "  Database: ${GREEN}$DB_NAME${NC}"
echo -e "  Username: ${GREEN}$DB_USERNAME${NC}"
echo -e "  Password: ${GREEN}$DB_PASSWORD${NC}"
echo ""
echo -e "${CYAN}Connection String (add to .env):${NC}"
echo -e "${GREEN}DATABASE_URL=\"postgresql://$DB_USERNAME:$DB_PASSWORD@$CLUSTER_ENDPOINT:5432/$DB_NAME?sslmode=require\"${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: Save the password securely! It won't be shown again.${NC}"

# Store in Secrets Manager
echo ""
echo -e "${BLUE}Storing credentials in AWS Secrets Manager...${NC}"
aws secretsmanager create-secret \
    --name maestro/database \
    --secret-string "{\"username\":\"$DB_USERNAME\",\"password\":\"$DB_PASSWORD\",\"host\":\"$CLUSTER_ENDPOINT\",\"port\":5432,\"database\":\"$DB_NAME\"}" \
    --region $AWS_REGION \
    2>/dev/null || \
aws secretsmanager update-secret \
    --secret-id maestro/database \
    --secret-string "{\"username\":\"$DB_USERNAME\",\"password\":\"$DB_PASSWORD\",\"host\":\"$CLUSTER_ENDPOINT\",\"port\":5432,\"database\":\"$DB_NAME\"}" \
    --region $AWS_REGION

echo -e "${GREEN}✓ Credentials stored in AWS Secrets Manager: maestro/database${NC}"
