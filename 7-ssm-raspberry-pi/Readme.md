# Using a Raspberry Pi with AWS Systems Manager
## Overview
AWS Systems Manager is a multi-featured configuration management service for monitoring and controlling your AWS infrastructure. Some features are highlighted below:

**Automation**
- Automated scripts saved in "Documents" can be used to create, modify, and manage AWS infrastructure
- Special documents in the "Run Command" category can be used to apply commands to EC2 instances on mass
  - These commands have a wide range from executing shell commands, powering on/off instances, installing software, etc.
  - Some commands integrate with popular third-party tools, such as configuring Docker, or running Ansible playbooks
- Many documents are already provided by AWS, but you can create your own documents to fit your infrastructure and application needs

**Patch Manager, State Manager, & Compliance**
- You can create Patch Groups to target specific instances, which can be based on instance tags, or ID
- Patch Groups can then be added to Patch Baselines, which define the software packages that are expected to be on the instances
- If the software isn't installed, the instances are marked as non-compliant on the Compliance Dashboard, with differing levels of severity depending on the missing packages
- Patch baselines can be automatically applied on a schedule with State Manager, to keep your machines in compliance

**Parameter Store**
- The Parameter Store allows for secure storage of configuration data or secrets
  - Secrets could be database passwords, software license keys, access tokens, etc.
- Secrets can be encrypted with [KMS](https://docs.aws.amazon.com/kms/latest/developerguide/overview.html), and have restricted access with IAM policies
- Secrets integrate easily with other AWS services just by referencing the name, instead of using the raw value
- Examples include:
  - Bootstrap scripts in EC2
  - Lambda Functions
  - CloudFormation Templates
  - CodeDeploy AppSpec files

There are many more features of SSM, and they don't only integrate with EC2 instances. SSM can also be used to manage machines outside of the AWS ecosystem, such as on-premises servers or even a Raspberry Pi. This is done through the **Hybrid Activations** feature, named as such since SSM can be used to manage a hybrid environment from one location. This tutorial will go through the process to add a Raspberry Pi as a managed instance of SSM.

## Services Used
- [AWS Systems Manager (SSM)](https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html)
