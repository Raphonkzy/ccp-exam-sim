# AWS CCP CLF-C02 Question Bank � Quality Audit Report

Generated: 08/10/2026, 09.41.52 | Total questions: **550**

---

## 1. Summary

| Metric | Value |
|--------|-------|
| Total questions | **550** |
| Questions with style violations | **4** (0.7%) |
| "Defines service" violations (option texts) | **2** |
| "Too long" option violations | **2** |
| Textbook-style stems | **18** |
| Distractor issues | **2** |
| **Overall Quality Score** | **99/100** |

?? Good

---

## 2. Coverage Analysis

| Domain | Name | Target% | Actual% | Count | Delta | Status |
|--------|------|---------|---------|-------|-------|--------|
| D1 | Cloud Concepts | 24% | 24.0% | 132 | 0.0% | ? |
| D2 | Security & Compliance | 30% | 30.0% | 165 | 0.0% | ? |
| D3 | Cloud Technology & Services | 34% | 34.0% | 187 | 0.0% | ? |
| D4 | Billing, Pricing & Support | 12% | 12.0% | 66 | 0.0% | ? |

---

## 3. Style Violations � Answer Options

**2** options define/explain the service. **2** are too long (>20 words).

Showing first 100 violating questions:

**Qd2-0004** (D2) � *Which component is always an AWS responsibility under the shared responsibility model, regardless of...*
  - Option `A` [wrong]: **DEFINES_SERVICE**
    > "Identity and access management policies"

**Qd2-0129** (D2) � *Which of the following describes an inherited security control that customers receive automatically ...*
  - Option `B` [wrong]: **DEFINES_SERVICE**
    > "Virtual Private Cloud (VPC) subnet IP addressing design"

**Qd3-0061** (D3) � *What is an AWS CloudFormation StackSet?...*
  - Option `B` [CORRECT]: **TOO_LONG**
    > "A feature that lets you create, update, or delete CloudFormation stacks across multiple AWS accounts and Regions with a single operation"

**Qd4-0045** (D4) � *Which statement correctly describes the difference between EC2 Instance Savings Plans and Compute Sa...*
  - Option `B` [CORRECT]: **TOO_LONG**
    > "Instance Savings Plans are locked to a specific instance family in a Region but offer higher discounts; Compute Savings Plans apply flexibly across fa"

---

## 4. Textbook-Style Stems (first 50)

- **Qd1-0043** (D1): *"What is the core definition of cloud computing?..."*
- **Qd2-0018** (D2): *"What is the principle of least privilege as it applies to AWS IAM?..."*
- **Qd2-0042** (D2): *"Which of the following describes the customer's responsibility regarding operating system updates when using Amazon Dyna..."*
- **Qd2-0051** (D2): *"Which of the following describes the division of responsibility for data encryption in transit when accessing an Amazon ..."*
- **Qd2-0074** (D2): *"What is the primary benefit of Service Control Policies (SCPs) when used with AWS Organizations?..."*
- **Qd2-0082** (D2): *"What is the security principle that dictates users and systems should only be granted the minimum permissions necessary ..."*
- **Qd2-0093** (D2): *"What is the function of an IAM User Group in AWS?..."*
- **Qd2-0096** (D2): *"What is an AWS Managed Policy in IAM?..."*
- **Qd2-0108** (D2): *"What is a key difference in how rules are configured in a Security Group compared to a Network ACL (NACL)?..."*
- **Qd2-0119** (D2): *"What is the default configuration of the default Network Access Control List (default NACL) created with an Amazon VPC?..."*
- **Qd2-0129** (D2): *"Which of the following describes an inherited security control that customers receive automatically by using AWS Cloud s..."*
- **Qd2-0143** (D2): *"What is an AWS security best practice regarding the management of the AWS account root user?..."*
- **Qd3-0061** (D3): *"What is an AWS CloudFormation StackSet?..."*
- **Qd3-0069** (D3): *"What is the purpose of an Amazon CloudFront Regional Edge Cache in the AWS Global Infrastructure?..."*
- **Qd3-0074** (D3): *"What is the maximum execution time limit for a single invocation of an AWS Lambda function?..."*
- **Qd3-0091** (D3): *"What is the durability design standard for data stored in the Amazon S3 Standard storage class across multiple Availabil..."*
- **Qd3-0111** (D3): *"What is the function of an Amazon Virtual Private Cloud (Amazon VPC) in AWS?..."*
- **Qd3-0142** (D3): *"What is an advantage of using AWS CloudFormation compared to manually creating AWS resources in the AWS Management Conso..."*

---

## 5. Distractor Issues (first 30)

- **Qd2-0033** (D2): DUPLICATE_DISTRACTORS
- **Qd2-0107** (D2): DUPLICATE_DISTRACTORS

---

## 6. Top 20 Worst Offenders

### 1. Qd2-0129 � Severity Score: 5 | D2
**Stem:** *Which of the following describes an inherited security control that customers receive automatically by using AWS Cloud s...*
**Options:**
  - [A] IAM password complexity policies
  - [B] Virtual Private Cloud (VPC) subnet IP addressing design
  - [C] Application software vulnerability scanning
  - [D] Physical data center environmental controls and facility perimeter security
**Rewrite suggestions:**
  - Option `B`: ? *"Virtual Private Cloud subnet IP addressing design"*

### 2. Qd2-0004 � Severity Score: 3 | D2
**Stem:** *Which component is always an AWS responsibility under the shared responsibility model, regardless of the cloud service a...*
**Options:**
  - [A] Identity and access management policies
  - [B] Customer data encryption
  - [C] Physical security of data center facilities
  - [D] Guest operating system configuration
**Rewrite suggestions:**
  - Option `A`: ? *"Identity and access management policies"*

### 3. Qd3-0061 � Severity Score: 3 | D3
**Stem:** *What is an AWS CloudFormation StackSet?...*
**Options:**
  - [A] A tool that automatically writes Python application logic from scratch
  - [B] A feature that lets you create, update, or delete CloudFormation stacks across multiple AWS accounts
  - [C] A physical rack of servers delivered to customer on-premises offices
  - [D] A billing discount applied to bulk EC2 purchases
**Rewrite suggestions:**
  - Option `B`: ? *"A feature that lets you create, update, or delete CloudFormation stacks across m"*

### 4. Qd1-0043 � Severity Score: 2 | D1
**Stem:** *What is the core definition of cloud computing?...*
**Options:**
  - [A] A wireless networking standard
  - [B] A specific hardware product sold by cloud vendors
  - [C] A type of on-premises private data center
  - [D] On-demand delivery of IT resources over the internet with pay-as-you-go pricing

### 5. Qd2-0018 � Severity Score: 2 | D2
**Stem:** *What is the principle of least privilege as it applies to AWS IAM?...*
**Options:**
  - [A] Giving all users administrator access so they can complete any task without requesting more permissi
  - [B] Granting only the permissions required to perform a specific task and no more
  - [C] Rotating IAM access keys every 90 days
  - [D] Enabling MFA on all IAM users regardless of their role

### 6. Qd2-0042 � Severity Score: 2 | D2
**Stem:** *Which of the following describes the customer's responsibility regarding operating system updates when using Amazon Dyna...*
**Options:**
  - [A] The customer must apply monthly OS patches during scheduled maintenance windows
  - [B] The customer must configure AWS Systems Manager to patch the DynamoDB hosts
  - [C] The customer has zero operating system responsibility because DynamoDB is fully managed
  - [D] The customer patches secondary replica hosts while AWS patches primary hosts

### 7. Qd2-0051 � Severity Score: 2 | D2
**Stem:** *Which of the following describes the division of responsibility for data encryption in transit when accessing an Amazon ...*
**Options:**
  - [A] AWS enforces SSL/TLS certificates and configures the client application code automatically
  - [B] AWS provides SSL/TLS root certificates on the database, while the customer configures the client con
  - [C] The customer must physically install custom SSL hardware cards into AWS data center servers
  - [D] Encryption in transit is unsupported on Amazon RDS

### 8. Qd2-0074 � Severity Score: 2 | D2
**Stem:** *What is the primary benefit of Service Control Policies (SCPs) when used with AWS Organizations?...*
**Options:**
  - [A] They automatically replace individual IAM user permissions across all accounts
  - [B] They enforce central permission guardrails without having to modify IAM policies in every individual
  - [C] They eliminate the need for AWS CloudTrail logging
  - [D] They allow cross-account root password sharing

### 9. Qd2-0082 � Severity Score: 2 | D2
**Stem:** *What is the security principle that dictates users and systems should only be granted the minimum permissions necessary ...*
**Options:**
  - [A] Separation of tenancy
  - [B] Principle of least privilege
  - [C] Defense in depth
  - [D] Zero capacity guessing

### 10. Qd2-0093 � Severity Score: 2 | D2
**Stem:** *What is the function of an IAM User Group in AWS?...*
**Options:**
  - [A] To act as an identity that can log in to the AWS Management Console directly
  - [B] To serve as a collection of IAM users, allowing administrators to attach permissions to multiple use
  - [C] To nest groups inside other groups for complex inheritance
  - [D] To provide automatic multi-factor authentication hardware devices

### 11. Qd2-0096 � Severity Score: 2 | D2
**Stem:** *What is an AWS Managed Policy in IAM?...*
**Options:**
  - [A] A policy created and maintained by AWS that covers common job functions and cannot be modified by cu
  - [B] A policy that can only be written in Python code
  - [C] A policy that only applies to hardware firewalls
  - [D] A policy that automatically grants full administrator access to all users

### 12. Qd2-0108 � Severity Score: 2 | D2
**Stem:** *What is a key difference in how rules are configured in a Security Group compared to a Network ACL (NACL)?...*
**Options:**
  - [A] Security Groups support explicit Deny rules, while NACLs only support Allow rules
  - [B] Security Groups only support Allow rules, while NACLs support both Allow and Deny rules evaluated in
  - [C] Security Groups operate at the subnet level, while NACLs operate at the instance level
  - [D] Security Groups can only inspect UDP traffic

### 13. Qd2-0119 � Severity Score: 2 | D2
**Stem:** *What is the default configuration of the default Network Access Control List (default NACL) created with an Amazon VPC?...*
**Options:**
  - [A] It allows all inbound and outbound IPv4 traffic
  - [B] It denies all inbound and outbound traffic completely
  - [C] It only allows SSH port 22
  - [D] It only allows traffic from AWS documentation websites

### 14. Qd2-0143 � Severity Score: 2 | D2
**Stem:** *What is an AWS security best practice regarding the management of the AWS account root user?...*
**Options:**
  - [A] Generate access keys for the root user and embed them in CI/CD pipelines
  - [B] Share the root user password across members of the security operations team
  - [C] Use the root user for everyday administrative tasks instead of creating IAM users
  - [D] Enable multi-factor authentication (MFA) and lock away the root user credentials

### 15. Qd3-0069 � Severity Score: 2 | D3
**Stem:** *What is the purpose of an Amazon CloudFront Regional Edge Cache in the AWS Global Infrastructure?...*
**Options:**
  - [A] To permanently store cold archival data for 10 years
  - [B] To act as a larger cache situated between origin servers and Edge Locations to keep unpopular conten
  - [C] To replace the need for Amazon S3 storage entirely
  - [D] To perform database SQL query executions directly on edge routers

### 16. Qd3-0074 � Severity Score: 2 | D3
**Stem:** *What is the maximum execution time limit for a single invocation of an AWS Lambda function?...*
**Options:**
  - [A] 1 minute
  - [B] 5 minutes
  - [C] 15 minutes
  - [D] 1 hour

### 17. Qd3-0091 � Severity Score: 2 | D3
**Stem:** *What is the durability design standard for data stored in the Amazon S3 Standard storage class across multiple Availabil...*
**Options:**
  - [A] 99.9% (three nines)
  - [B] 99.99% (four nines)
  - [C] 99.999% (five nines)
  - [D] 99.999999999% (eleven nines)

### 18. Qd3-0111 � Severity Score: 2 | D3
**Stem:** *What is the function of an Amazon Virtual Private Cloud (Amazon VPC) in AWS?...*
**Options:**
  - [A] To provide a logically isolated virtual network dedicated to your AWS account
  - [B] To generate automated sales invoices for customer billing
  - [C] To act as a physical data center building rented to multiple companies
  - [D] To automatically transcode video files into multiple formats

### 19. Qd3-0142 � Severity Score: 2 | D3
**Stem:** *What is an advantage of using AWS CloudFormation compared to manually creating AWS resources in the AWS Management Conso...*
**Options:**
  - [A] CloudFormation provides free unlimited compute resources for all stacks
  - [B] CloudFormation automatically writes application business logic and backend code
  - [C] CloudFormation guarantees zero data transfer charges between AWS Regions
  - [D] CloudFormation allows version-controlled, repeatable, and automated infrastructure deployments

### 20. Qd2-0033 � Severity Score: 2 | D2
**Stem:** *A company migrates its relational database to Amazon RDS. How does the customer's operational responsibility change comp...*
**Options:**
  - [A] The customer is no longer responsible for database user access permissions
  - [B] The customer is relieved of operating system and database engine patching
  - [C] The customer is no longer responsible for encrypting sensitive customer data
  - [D] The customer delegates all database schema design to AWS

---

## 7. Recommendations

1. **Strip service definitions from all answer options** � "AWS IAM" not "AWS IAM, which is the Identity and Access Management service..."
2. **Rewrite textbook stems to scenario-based** � "A company needs to..." instead of "What is..."
3. **Ensure all distractors are plausible in-scope AWS services** from the blueprint
4. **Rebalance domain coverage** to match 24/30/34/12% blueprint weights (�3%)
5. **Remove any out-of-scope service references** from the blueprint outOfScopeServices list