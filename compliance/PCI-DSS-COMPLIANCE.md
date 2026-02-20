# MAESTRO - PCI DSS Compliance Documentation

## Payment Card Industry Data Security Standard

### Executive Summary

This document outlines the PCI DSS v4.0 compliance framework for the Maestro platform, which processes, stores, and transmits payment card data as part of its wallet and payment services.

---

## 1. PCI DSS SCOPE

### 1.1 Merchant Level

**Level 1:** >6 million card transactions annually
*(Maestro anticipates Level 1 status within 18 months of launch)*

### 1.2 Cardholder Data Environment (CDE)

The CDE includes:
- Payment processing systems
- Wallet top-up functionality
- Card tokenization services
- Transaction logging systems
- Payment gateway integrations

### 1.3 Cardholder Data Stored

| Data Element | Stored? | Protected? | Retention |
|--------------|---------|------------|-----------|
| Card Number (PAN) | No | N/A | N/A (Token only) |
| Cardholder Name | No | N/A | N/A |
| Expiration Date | No | N/A | N/A |
| Service Code | No | N/A | N/A |
| CVV/CVC | No | N/A | Never stored |
| PIN | No | N/A | Never stored |
| Token | Yes | Encrypted | 7 years |

**Note:** Maestro uses tokenization for all card transactions. Full card numbers are never stored.

---

## 2. PCI DSS REQUIREMENTS COMPLIANCE

### Requirement 1: Install and Maintain Network Security Controls

#### 1.1 Firewall Configuration
- [x] Next-generation firewalls deployed at all CDE boundaries
- [x] Default deny-all policy
- [x] Quarterly firewall rule reviews
- [x] Documented justification for each rule

#### 1.2 Network Segmentation
- [x] CDE isolated in dedicated VPC
- [x] Separate security groups for payment systems
- [x] Network access control lists (NACLs) configured
- [x] No direct internet access to CDE

#### 1.3 Wireless Networks
- [x] No wireless networks in CDE
- [x] Wireless scanning for rogue devices (monthly)

### Requirement 2: Apply Secure Configurations to All System Components

#### 2.1 Default Settings
- [x] All default passwords changed
- [x] Unnecessary services disabled
- [x] Vendor default accounts removed

#### 2.2 Configuration Standards
- [x] CIS benchmarks applied
- [x] Configuration management (Terraform)
- [x] Immutable infrastructure

#### 2.3 Encryption of Cardholder Data
- [x] TLS 1.3 for transmission
- [x] AES-256 for storage
- [x] PGP for file transfers

#### 2.4 SSH and Remote Access
- [x] SSH key-based authentication only
- [x] No password authentication
- [x] SSH access through bastion host only
- [x] Session recording enabled

### Requirement 3: Protect Stored Account Data

#### 3.1 Data Retention
- [x] Data retention policy documented
- [x] Quarterly data purge reviews
- [x] Secure deletion procedures

#### 3.2 Sensitive Authentication Data
- [x] CVV/CVC never stored
- [x] PIN never stored
- [x] Full track data never stored

#### 3.3 Masking
- [x] PAN masking displayed as "**** **** **** XXXX"
- [x] Full PAN only visible when operationally necessary

#### 3.4 Cryptographic Keys
- [x] Key management procedures documented
- [x] Key rotation (annual minimum)
- [x] Split knowledge for key components
- [x] Key storage in HSM or AWS KMS

### Requirement 4: Protect Cardholder Data with Strong Cryptography During Transmission

#### 4.1 Encryption in Transit
- [x] TLS 1.2 minimum (TLS 1.3 preferred)
- [x] Strong cipher suites only
- [x] Certificate management (ACM)
- [x] No fallback to weak protocols

#### 4.2 Wireless Encryption
- [x] N/A (no wireless in CDE)

### Requirement 5: Protect All Systems and Networks from Malicious Software

#### 5.1 Anti-Malware
- [x] EDR deployed on all endpoints
- [x] Automatic updates enabled
- [x] Real-time scanning
- [x] Weekly full scans

#### 5.2 Phishing Protection
- [x] Email security gateway
- [x] URL filtering
- [x] Attachment sandboxing
- [x] User awareness training

### Requirement 6: Develop and Maintain Secure Systems and Software

#### 6.1 Vulnerability Management
- [x] Vulnerability scanning (weekly)
- [x] Patch management process
- [x] Critical patches < 48 hours

#### 6.2 Secure Development
- [x] SDLC documentation
- [x] Security requirements in specifications
- [x] Code review process
- [x] SAST/DAST in CI/CD pipeline

#### 6.3 Change Management
- [x] Change request approval process
- [x] Impact assessment
- [x] Rollback procedures
- [x] Post-change review

#### 6.4 Payment Page Security
- [x] Content Security Policy (CSP)
- [x] Subresource Integrity (SRI)
- [x] No inline scripts
- [x] Input validation and output encoding

### Requirement 7: Restrict Access to System Components and Cardholder Data by Business Need to Know

#### 7.1 Access Control
- [x] Role-Based Access Control (RBAC)
- [x] Least privilege principle
- [x] Access control matrix documented
- [x] Quarterly access reviews

#### 7.2 Privileged Access
- [x] Privileged Access Management (PAM)
- [x] Just-In-Time (JIT) access
- [x] Session recording
- [x] MFA required

### Requirement 8: Identify Users and Authenticate Access to System Components

#### 8.1 User Identification
- [x] Unique user IDs
- [x] No shared accounts
- [x] Account lifecycle management

#### 8.2 Authentication
- [x] Strong password policy
  - Minimum 16 characters
  - Complexity requirements
  - No password reuse (12 generations)
- [x] MFA for all access
- [x] Biometric authentication for UAE Pass

#### 8.3 Multi-Factor Authentication
- [x] MFA for CDE access
- [x] MFA for remote access
- [x] MFA for administrative access
- [x] Hardware tokens for privileged users

#### 8.4 Session Management
- [x] Automatic timeout (15 minutes inactive)
- [x] Concurrent session limits
- [x] Session termination on logout

#### 8.5 Third-Party Access
- [x] Documented third-party access
- [x] Time-limited access
- [x] Activity logging

### Requirement 9: Restrict Physical Access to Cardholder Data

#### 9.1 Physical Access Controls
- [x] Badge access to data centers
- [x] Biometric authentication
- [x] Visitor logs
- [x] Video surveillance (90-day retention)

#### 9.2 Media Protection
- [x] Media classification
- [x] Secure storage
- [x] Destruction procedures

#### 9.3 Point of Interaction (POI) Devices
- [x] N/A (no physical POI devices)

### Requirement 10: Log and Monitor All Access to System Components and Cardholder Data

#### 10.1 Audit Logs
- [x] All user activities logged
- [x] All administrative actions logged
- [x] All access to cardholder data logged
- [x] Log integrity protection

#### 10.2 Log Retention
- [x] Minimum 1 year online
- [x] Minimum 3 years archived
- [x] Chronological timestamping

#### 10.3 Log Review
- [x] Daily automated review
- [x] Weekly manual review
- [x] Alert thresholds configured

### Requirement 11: Test Security Systems and Networks Regularly

#### 11.1 Wireless Analysis
- [x] Quarterly wireless scanning
- [x] Rogue device detection

#### 11.2 Vulnerability Scanning
- [x] Internal scanning (weekly)
- [x] External scanning (quarterly by ASV)
- [x] Remediation tracking

#### 11.3 Penetration Testing
- [x] Annual penetration test
- [x] After significant changes
- [x] Segmentation testing
- [x] Remediation verification

#### 11.4 Intrusion Detection
- [x] IDS/IPS deployed
- [x] Signature updates (daily)
- [x] Anomaly detection

### Requirement 12: Support Information Security with Organizational Policies and Operating Procedures

#### 12.1 Security Policy
- [x] Information security policy
- [x] Annual review
- [x] Executive sign-off

#### 12.2 Security Roles
- [x] Security officer designated
- [x] Job descriptions include security
- [x] Background checks

#### 12.3 Personnel Risk Assessment
- [x] Background verification
- [x] Periodic re-verification
- [x] Termination procedures

#### 12.4 Security Awareness
- [x] Training upon hire
- [x] Annual refresher
- [x] Phishing simulations
- [x] Acknowledgment required

#### 12.5 Third-Party Agreements
- [x] PCI DSS requirements in contracts
- [x] Written agreements
- [x] Annual attestation

#### 12.6 Incident Response
- [x] Incident response plan
- [x] Response team designated
- [x] Annual testing
- [x] Reporting procedures

#### 12.7 Service Providers
- [x] Service provider list maintained
- [x] PCI DSS compliance verified
- [x] Annual re-verification

---

## 3. THIRD-PARTY SERVICE PROVIDERS

| Provider | Service | PCI DSS Level | Attestation Date |
|----------|---------|---------------|------------------|
| Stripe | Payment Gateway | Level 1 | Annual |
| PayTabs | Payment Gateway | Level 1 | Annual |
| AWS | Cloud Infrastructure | Level 1 | Annual |
| Wio Bank | Banking Services | Level 1 | Annual |

---

## 4. PCI DSS ASSESSMENT

### 4.1 Self-Assessment Questionnaire (SAQ)

**SAQ Type:** D (Merchant with CDE)

### 4.2 Report on Compliance (ROC)

For Level 1 merchants, annual ROC by QSA required.

### 4.3 Assessment Schedule

| Activity | Frequency | Next Due |
|----------|-----------|----------|
| Internal scan | Weekly | Ongoing |
| External ASV scan | Quarterly | Mar 2026 |
| Penetration test | Annual | Aug 2026 |
| QSA assessment | Annual | Oct 2026 |

---

## 5. INCIDENT RESPONSE

### 5.1 Payment Incident Classification

| Severity | Description | Response Time |
|----------|-------------|---------------|
| Critical | Confirmed breach of card data | 15 minutes |
| High | Suspected breach or fraud | 1 hour |
| Medium | Policy violation | 4 hours |
| Low | Minor incident | 24 hours |

### 5.2 Notification Requirements

- Card brands: Within 24 hours of confirmed breach
- Acquiring bank: Immediately
- Affected customers: As required by law
- Regulators: Per UAE Central Bank requirements

---

## 6. PCI DSS CERTIFICATION CHECKLIST

### Pre-Assessment
- [ ] Gap analysis completed
- [ ] Remediation plan documented
- [ ] Resources allocated

### Assessment
- [ ] QSA engagement
- [ ] Evidence collection
- [ ] Technical testing
- [ ] Policy review

### Post-Assessment
- [ ] Remediation of findings
- [ ] Attestation of Compliance (AOC)
- [ ] Report submission
- [ ] Certificate issuance

---

## 7. CONTACTS

- **Compliance Officer:** compliance@maestro.ae
- **Security Team:** security@maestro.ae
- **QSA Firm:** [To be selected]
- **Card Brand Contacts:**
  - Visa: fpsd@visa.com
  - Mastercard: data_security@mastercard.com

---

## 8. DOCUMENT CONTROL

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Feb 2026 | CISO | Initial version |

*Next Review: February 2027*

---

**ATTENTION:** This document contains confidential information security procedures. Distribution is limited to authorized personnel only.
