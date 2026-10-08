const fs = require('fs');
const path = require('path');

const KNOWLEDGE = {
  // Compute
  'ec2': 'provides scalable virtual compute servers (instances) in the AWS Cloud',
  'amazon ec2': 'provides scalable virtual compute servers (instances) in the AWS Cloud',
  'aws lambda': 'is a serverless compute service that executes code in response to events without provisioning servers',
  'lambda': 'is a serverless compute service that executes code in response to events without provisioning servers',
  'aws fargate': 'is a serverless compute engine for containers that works with ECS and EKS without managing servers',
  'fargate': 'is a serverless compute engine for containers that works with ECS and EKS without managing servers',
  'amazon ecs': 'is a fully managed container orchestration service for running Docker containers',
  'ecs': 'is a fully managed container orchestration service for running Docker containers',
  'amazon eks': 'is a managed Kubernetes service for containerized workloads',
  'eks': 'is a managed Kubernetes service for containerized workloads',
  'amazon lightsail': 'provides easy-to-use virtual private servers with predictable monthly pricing for simpler workloads',
  'lightsail': 'provides easy-to-use virtual private servers with predictable monthly pricing for simpler workloads',
  'aws batch': 'dynamically provisions compute resources to run batch computing workloads at any scale',
  'batch': 'dynamically provisions compute resources to run batch computing workloads at any scale',
  'aws elastic beanstalk': 'is a Platform as a Service (PaaS) that handles deployment, provisioning, and scaling for web applications',
  'elastic beanstalk': 'is a Platform as a Service (PaaS) that handles deployment, provisioning, and scaling for web applications',
  'aws outposts': 'extends AWS infrastructure, services, APIs, and tools to virtually any on-premises datacenter or colocation space',
  'aws wavelength': 'embeds AWS compute and storage services within 5G networks to deliver ultra-low latency applications',
  'aws local zones': 'places compute, storage, and database services close to large population and industry centers',

  // Storage
  'amazon s3': 'is a highly durable, scalable object storage service designed to store and retrieve any amount of data from anywhere',
  's3': 'is a highly durable, scalable object storage service designed to store and retrieve any amount of data from anywhere',
  'amazon ebs': 'provides persistent block storage volumes designed specifically for EC2 instances',
  'ebs': 'provides persistent block storage volumes designed specifically for EC2 instances',
  'amazon efs': 'is a scalable, fully managed Network File System (NFS) shared across multiple instances',
  'efs': 'is a scalable, fully managed Network File System (NFS) shared across multiple instances',
  'amazon s3 glacier': 'is a secure, durable, low-cost storage class optimized for data archiving and long-term backup',
  's3 glacier': 'is a secure, durable, low-cost storage class optimized for data archiving and long-term backup',
  'glacier': 'is a secure, durable, low-cost storage class optimized for data archiving and long-term backup',
  'aws storage gateway': 'connects on-premises environments seamlessly to cloud storage services like S3 and EBS',
  'storage gateway': 'connects on-premises environments seamlessly to cloud storage services like S3 and EBS',
  'aws snowball': 'provides edge computing and physical transport appliances for moving petabyte-scale data into and out of AWS',
  'snowball': 'provides edge computing and physical transport appliances for moving petabyte-scale data into and out of AWS',
  'aws snowcone': 'is an ultra-portable edge computing and data transfer device for remote operations',
  'snowcone': 'is an ultra-portable edge computing and data transfer device for remote operations',
  'aws snowmobile': 'is an exabyte-scale physical data transfer service utilizing a 45-foot shipping container',
  'snowmobile': 'is an exabyte-scale physical data transfer service utilizing a 45-foot shipping container',
  'aws backup': 'is a centralized backup service to automate and manage data protection across AWS services',

  // Databases
  'amazon rds': 'is a managed relational database service supporting PostgreSQL, MySQL, MariaDB, Oracle, and SQL Server',
  'rds': 'is a managed relational database service supporting PostgreSQL, MySQL, MariaDB, Oracle, and SQL Server',
  'amazon aurora': 'is a cloud-native relational database compatible with MySQL and PostgreSQL offering high performance and multi-AZ replication',
  'aurora': 'is a cloud-native relational database compatible with MySQL and PostgreSQL offering high performance and multi-AZ replication',
  'amazon dynamodb': 'is a fully managed serverless NoSQL database service delivering single-digit millisecond latency at any scale',
  'dynamodb': 'is a fully managed serverless NoSQL database service delivering single-digit millisecond latency at any scale',
  'amazon elasticache': 'is an in-memory data store supporting Redis and Memcached for low-latency caching',
  'elasticache': 'is an in-memory data store supporting Redis and Memcached for low-latency caching',
  'amazon redshift': 'is a fully managed cloud data warehouse designed for fast SQL analytics and reporting',
  'redshift': 'is a fully managed cloud data warehouse designed for fast SQL analytics and reporting',
  'amazon neptune': 'is a purpose-built graph database engine for applications with highly connected datasets',
  'neptune': 'is a purpose-built graph database engine for applications with highly connected datasets',
  'amazon documentdb': 'is a managed JSON document database compatible with MongoDB workloads',
  'documentdb': 'is a managed JSON document database compatible with MongoDB workloads',
  'aws dms': 'is the Database Migration Service that helps migrate databases to AWS securely with minimal downtime',
  'aws database migration service': 'helps migrate databases to AWS securely with minimal downtime',

  // Networking
  'amazon vpc': 'provides an isolated virtual network within AWS for launching and securing resources',
  'vpc': 'provides an isolated virtual network within AWS for launching and securing resources',
  'amazon cloudfront': 'is a global Content Delivery Network (CDN) service that accelerates content delivery through edge locations',
  'cloudfront': 'is a global Content Delivery Network (CDN) service that accelerates content delivery through edge locations',
  'amazon route 53': 'is a scalable cloud Domain Name System (DNS) web service offering domain registration and health checks',
  'route 53': 'is a scalable cloud Domain Name System (DNS) web service offering domain registration and health checks',
  'aws direct connect': 'establishes a dedicated private fiber network connection between on-premises data centers and AWS',
  'direct connect': 'establishes a dedicated private fiber network connection between on-premises data centers and AWS',
  'aws transit gateway': 'acts as a central cloud router connecting multiple VPCs and on-premises networks together',
  'transit gateway': 'acts as a central cloud router connecting multiple VPCs and on-premises networks together',
  'internet gateway': 'enables communication between VPC resources and the public internet',
  'nat gateway': 'allows resources in private subnets to reach the internet while blocking inbound connections',
  'network acl': 'is a stateless subnet-level firewall controlling traffic into and out of subnets',
  'nacl': 'is a stateless subnet-level firewall controlling traffic into and out of subnets',
  'security group': 'is a stateful virtual firewall controlling inbound and outbound traffic at the instance level',
  'virtual private gateway': 'is the VPN concentrator on the Amazon VPC side of a Site-to-Site VPN connection',
  'aws global accelerator': 'improves the availability and performance of applications with local or global users using the AWS global network',

  // Security & Identity
  'aws iam': 'controls authentication and access permissions to AWS resources via users, groups, roles, and policies',
  'iam': 'controls authentication and access permissions to AWS resources via users, groups, roles, and policies',
  'iam role': 'is an IAM identity that you can create in your account that has specific permissions, intended to be assumed temporarily',
  'iam user': 'is an identity with long-term credentials representing a person or service interacting with AWS',
  'iam policy': 'is a JSON document that explicitly defines permissions to allow or deny actions on AWS resources',
  'aws shield': 'provides managed Distributed Denial of Service (DDoS) protection for AWS workloads',
  'aws shield standard': 'provides automatic DDoS protection for all AWS customers at no additional charge',
  'aws shield advanced': 'provides enhanced DDoS protection and mitigation with 24/7 access to the Shield Response Team',
  'shield': 'provides managed Distributed Denial of Service (DDoS) protection for AWS workloads',
  'aws waf': 'is a web application firewall protecting web applications against web exploits like SQL injection and XSS',
  'waf': 'is a web application firewall protecting web applications against web exploits like SQL injection and XSS',
  'amazon guardduty': 'is an intelligent threat detection service continuously monitoring accounts for suspicious activity',
  'guardduty': 'is an intelligent threat detection service continuously monitoring accounts for suspicious activity',
  'amazon inspector': 'is an automated vulnerability management service scanning EC2 instances and containers for security flaws',
  'inspector': 'is an automated vulnerability management service scanning EC2 instances and containers for security flaws',
  'amazon macie': 'uses machine learning to discover and protect sensitive data (such as PII) stored in Amazon S3',
  'macie': 'uses machine learning to discover and protect sensitive data (such as PII) stored in Amazon S3',
  'aws kms': 'is a managed service to create and control cryptographic keys used to encrypt data across AWS services',
  'kms': 'is a managed service to create and control cryptographic keys used to encrypt data across AWS services',
  'aws secrets manager': 'protects database credentials and API keys by rotating and retrieving them securely',
  'secrets manager': 'protects database credentials and API keys by rotating and retrieving them securely',
  'aws artifact': 'provides on-demand access to AWS security and compliance reports (such as SOC and PCI certifications) and agreements',
  'artifact': 'provides on-demand access to AWS security and compliance reports (such as SOC and PCI certifications) and agreements',
  'aws security hub': 'provides a single view of security alerts and compliance posture across AWS accounts',
  'security hub': 'provides a single view of security alerts and compliance posture across AWS accounts',
  'aws firewall manager': 'centralizes administration of firewall rules across all accounts in an organization',
  'aws cloudhsm': 'provides dedicated hardware security module appliances inside the AWS cloud for cryptographic operations',

  // Management & Monitoring
  'amazon cloudwatch': 'monitors operational metrics, logs, and alarms for AWS resources in real time',
  'cloudwatch': 'monitors operational metrics, logs, and alarms for AWS resources in real time',
  'cloudwatch alarms': 'watches single CloudWatch metrics and triggers automated actions when thresholds are crossed',
  'cloudwatch logs': 'monitors, stores, and accesses log files from Amazon EC2 instances, CloudTrail, and other sources',
  'aws cloudtrail': 'records, tracks, and retains AWS account API activity and user actions for governance and auditing',
  'cloudtrail': 'records, tracks, and retains AWS account API activity and user actions for governance and auditing',
  'aws config': 'tracks and audits resource configurations against compliance rules over time',
  'config': 'tracks and audits resource configurations against compliance rules over time',
  'aws trusted advisor': 'provides real-time recommendations across cost optimization, security, performance, and quotas',
  'trusted advisor': 'provides real-time recommendations across cost optimization, security, performance, and quotas',
  'aws organizations': 'centrally governs, manages billing, and applies Service Control Policies across multiple AWS accounts',
  'organizations': 'centrally governs, manages billing, and applies Service Control Policies across multiple AWS accounts',
  'service control policies': 'are a type of organization policy that you can use to manage permissions in your organization',
  'scps': 'are organizational policies used to centrally manage the maximum available permissions for member accounts',
  'aws control tower': 'sets up and governs a secure, multi-account environment based on best practice blueprints',
  'control tower': 'sets up and governs a secure, multi-account environment based on best practice blueprints',
  'aws cloudformation': 'allows modeling and provisioning AWS resources through Infrastructure as Code (IaC) templates',
  'cloudformation': 'allows modeling and provisioning AWS resources through Infrastructure as Code (IaC) templates',
  'aws systems manager': 'provides visibility and operational control of your infrastructure on AWS and on-premises',
  'systems manager': 'provides visibility and operational control of your infrastructure on AWS and on-premises',
  'aws health dashboard': 'provides alerts and remediation guidance when AWS is experiencing issues that may affect your account',

  // Cost, Billing & Support
  'aws cost explorer': 'visualizes, tracks, and forecasts AWS spending and usage patterns over time',
  'cost explorer': 'visualizes, tracks, and forecasts AWS spending and usage patterns over time',
  'aws budgets': 'sets custom cost and usage limits that trigger automated alerts when thresholds are reached',
  'budgets': 'sets custom cost and usage limits that trigger automated alerts when thresholds are reached',
  'aws pricing calculator': 'estimates costs for planned AWS architectures and workloads',
  'pricing calculator': 'estimates costs for planned AWS architectures and workloads',
  'aws cost and usage report': 'delivers the most detailed, granular hourly cost and usage data directly to S3',
  'cost and usage report': 'delivers the most detailed, granular hourly cost and usage data directly to S3',
  'consolidated billing': 'combines payment across all member accounts in an organization to qualify for volume pricing discounts',
  'aws support concierge': 'is a dedicated team of billing and account experts available on Enterprise Support plans',
  'support concierge': 'is a dedicated team of billing and account experts available on Enterprise Support plans',
  'technical account manager': 'is a dedicated technical advisor providing architectural and proactive guidance on Enterprise plans',
  'tam': 'is a dedicated technical advisor providing architectural and proactive guidance on Enterprise plans',
  'basic support': 'is included free of charge with all AWS accounts, providing 24/7 access to customer service, documentation, and core Trusted Advisor checks',
  'developer support': 'provides business-hours email access to Cloud Support Associates for testing and development environments',
  'business support': 'provides 24/7 phone, chat, and email support from Cloud Support Engineers for production workloads with 1-hour critical response',
  'enterprise support': 'provides 24/7 support with 15-minute response times for business-critical events, a dedicated TAM, and Concierge assistance',
  'enterprise on-ramp': 'provides 24/7 support with 30-minute response times for business-critical events and access to a pool of TAMs',
  'aws marketplace': 'is a curated digital catalog of third-party software, data, and services that run on AWS',

  // Cloud Principles
  'elasticity': 'dynamically adjusts compute capacity to match workload demand, eliminating idle resource costs',
  'implement elasticity': 'dynamically provisions and deprovisions compute resources to match demand, avoiding idle costs',
  'scalability': 'is the ability to increase or decrease system capacity to handle workload growth',
  'horizontal scaling': 'involves adding or removing resource instances (such as EC2 instances) to handle changing demand',
  'vertical scaling': 'involves increasing or decreasing the compute, memory, or storage capacity of an existing individual instance',
  'high availability': 'ensures applications remain continuously operational by deploying across multiple Availability Zones',
  'fault tolerance': 'enables systems to continue operating normally even when components experience failures',
  'agility': 'allows organizations to quickly innovate by provisioning infrastructure in minutes rather than weeks',
  'economies of scale': 'aggregates large customer usage to lower per-unit infrastructure costs and pass savings to customers',
  'benefit from massive economies of scale': 'aggregates usage from hundreds of thousands of customers to achieve higher economies of scale and lower pay-as-you-go prices',
  'trade capital expense for variable expense': 'replaces large upfront data center investments (CapEx) with low pay-as-you-go operating expenses (OpEx)',
  'stop guessing capacity': 'eliminates the risk of paying for idle infrastructure or under-provisioning during peak traffic by scaling on demand',
  'increase speed and agility': 'reduces time to make resources available to developers from weeks to just minutes',
  'stop spending money running and maintaining data centers': 'allows businesses to focus on core projects and applications rather than maintaining physical data center infrastructure',
  'go global in minutes': 'easily deploys applications in multiple Regions around the world with just a few clicks'
};

function cleanKey(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findMatch(text) {
  const k = cleanKey(text);
  if (KNOWLEDGE[k]) return { name: text.replace(/\.$/, ''), def: KNOWLEDGE[k] };
  for (const [key, def] of Object.entries(KNOWLEDGE)) {
    if (k === key || k.startsWith(key + ' ') || k.endsWith(' ' + key)) {
      return { name: text.replace(/\.$/, ''), def };
    }
  }
  return null;
}

function processQuestion(q) {
  const optExps = {};
  const correctTexts = q.options.filter(o => q.correctOptionIds.includes(o.id)).map(o => o.text.replace(/\.$/, ''));
  
  for (const o of q.options) {
    const isRight = q.correctOptionIds.includes(o.id);
    const match = findMatch(o.text);
    const cleanO = o.text.replace(/\.$/, '').trim();
    
    if (match) {
      if (isRight) {
        optExps[o.id] = `${match.name} ${match.def}.`;
      } else {
        optExps[o.id] = `${match.name} ${match.def}, which does not satisfy the specific requirement in this question.`;
      }
    } else {
      if (isRight) {
        optExps[o.id] = `${cleanO} directly fulfills the objective required by this scenario.`;
      } else {
        optExps[o.id] = `${cleanO} does not fulfill the specific objective required in this scenario.`;
      }
    }
  }

  // Explanation
  let exp = q.explanation || '';
  if (exp.startsWith('Option ') || exp.includes('does not address this requirement') || exp.length < 20) {
    if (correctTexts.length === 1) {
      const match = findMatch(correctTexts[0]);
      if (match) {
        exp = `${correctTexts[0]} is the correct answer because ${correctTexts[0].toLowerCase().startsWith('aws') || correctTexts[0].toLowerCase().startsWith('amazon') ? correctTexts[0] : 'it'} ${match.def}.`;
      } else {
        exp = `${correctTexts[0]} is the correct answer. This option directly satisfies the criteria outlined in the question.`;
      }
    } else {
      exp = `${correctTexts.join(' and ')} are the correct answers. These options directly satisfy the requirements specified in the question.`;
    }
  }

  // Clean keyConcept
  let kc = q.keyConcept || '';
  kc = kc.replace(/^Cloud Benefits:\s*/i, 'Cloud Benefits: ').replace(/—/g, ': ').trim();

  return {
    ...q,
    explanation: exp.replace(/—/g, ' - ').trim(),
    optionExplanations: optExps,
    keyConcept: kc
  };
}

const qDir = 'src/data/questions';
const files = ['d1.json', 'd2.json', 'd3.json', 'd4.json'];
let totalProcessed = 0;

for (const file of files) {
  const filePath = path.join(qDir, file);
  const qs = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const updated = qs.map(q => {
    totalProcessed++;
    return processQuestion(q);
  });
  fs.writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8');
  console.log(`Updated ${file}: ${updated.length} questions`);
}

console.log(`Finished processing all ${totalProcessed} questions.`);
