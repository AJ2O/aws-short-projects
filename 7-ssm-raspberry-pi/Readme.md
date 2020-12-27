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

**Note:** The operating system assumed to be on the Raspberry Pi is Raspian OS.

## Services Used
- [AWS Systems Manager (SSM)](https://docs.aws.amazon.com/systems-manager/latest/userguide/what-is-systems-manager.html)

## Steps

### 1. Install SSM Agent on your Raspberry PI
The SSM agent software must be installed on all machines that will connect with SSM. Some of the EC2 AMIs (such as Amazon Linux 2, Windows Server 2016) have the agent installed already.
- On your Raspberry Pi, run the following commands to install the SSM agent:
    ```
    mkdir /tmp/ssm

    sudo curl https://s3.amazonaws.com/ec2-downloads-windows/SSMAgent/latest/debian_arm/amazon-ssm-agent.deb -o /tmp/ssm/amazon-ssm-agent.deb

    sudo dpkg -i /tmp/ssm/amazon-ssm-agent.deb

    sudo service amazon-ssm-agent stop
    ```

### 2. Create an IAM service role
Servers in a hybrid environment require an IAM role to communicate with SSM. This can be done through the following steps:
- Go to IAM, and create a new role with Systems Manager as the trusted entity
- Attach the following policy to the role:
    ```
    AmazonSSMManagedInstanceCore
    ```
- Name: SSMServiceRole
- Create

### 3. Create a Hybrid Activation
A hybrid activation is what registers machines with SSM. Once started, it generates an **Activation Code** and **ID** for a set time period. Machines with SSM agents installed can connect using these two parameters during the  remainder of the time period. Once registered, it remains registered until you explicitly deregister it. The default expiry date for activations is **24 hours**.
- Go to Systems Manager, and select "Hybrid Activations" under "Node Management"
- Create an Activation
- Instance Limit: 1
- IAM role
  - Select an existing role: SSMServiceRole
- Expiry Date: Leave blank (24 hours default)
- Default Instance Name: My Raspberry Pi
- Create Activation
- Once finished your activation code and ID will be generated and on-screen
  - Save these values as you can't retrieve them again!

### 4. Register Your Raspberry Pi with SSM
Now that we have the activation code and ID, we can register our machine with SSM and start the SSM agent.
- Run the following commands on the Raspberry Pi, replacing the variables with the ones generated in the previous step, and the region that SSM is being used from:
    ```
    sudo amazon-ssm-agent -register -code "<activation-code>" -id "<id>" -region "<region>" 

    sudo service amazon-ssm-agent start
    ```
- Registration should complete successfully with similar output to below:
    ```
    New Seelog Logger Creation Complete
    2020-12-26 22:57:47 WARN Could not read InstanceFingerprint file: InstanceFingerprint does not exist.
    2020-12-26 22:57:47 INFO No initial fingerprint detected, generating fingerprint file...
    2020-12-26 22:57:48 INFO Successfully registered the instance with AWS SSM using Managed instance-id: mi-07041e8ebb0974fa3
    ```
- **Note:** On-premises instances will be given an ID starting with "mi". Regular EC2 instances have IDs starting with "i"

### 5. View Managed Instance
Instances set up with SSM will all be listed under **Managed Instances**, whether they are EC2 or not. Click on "Managed Instances" under "Node Management", and you should see your Raspberry Pi listed. The name, operating system, ping status, and SSM Agent version will be displayed. You can click "View Details" to investigate even more information about your Raspberry Pi.

### 6. Test Functionality
Now that our Raspberry Pi is set up with SSM, let's test some automation against it.
- Select "Run Command" under "Node Management"
- Run Command
- Highlight "AWS-RunShellScript"
  - Command Parameters
    - Command: Copy the following code:
        ```
        echo "This script is running from SSM!" 
        for i in $(ls /home/pi); do echo $i; done
        ```
  - Targets
    - Choose instances manually
    - Select "My Raspberry Pi"
  - Output options:
    - Uncheck "Enable an S3 bucket"
  - **Note:** Expanding the "AWS command line interface command" provides the CLI command to execute this same command (with it's parameters)
  - **Run**
- You will be sent to the command's status page, and it will shortly be "In Progress" before advancing to "Success"
- Click on the instance, and view it's output. It should list all the directories in the Pi user's home directory:
    ```
    This script is running from SSM!

    Bookshelf

    code

    Desktop

    Documents

    Downloads

    Music

    Pictures

    Public

    Templates

    Videos

    workspace
    ```

### 7. Deregister Your Raspberry Pi from SSM (Optional)
If you want to deregister your machine from SSM, here are the steps:
- Select "Managed Instances" and highlight your instance
- Select "Instance actions" -> "Deregister this managed instance"
- Click "Deregister" after reading the prompt
- On your Raspberry Pi, stop the SSM Agent:
    ```
    sudo service amazon-ssm-agent stop
    ```

## Summary
In this tutorial, we set up a server outside of the AWS ecosystem to be managed by SSM, and executed automation against it. This managed instance could integrate with the full suite of features offered by SSM, and be operated on like a regular EC2 instance. On a large scale, SSM can provide a central point of control of your organization's cloud infrastructure, whether part of it is in AWS, your on-premises data centers, or other cloud providers.

## Notes
- [Setting Up Systems Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-setting-up.html)
- [Setting Up Hybrid Environments](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-managedinstances.html)
- [Install SSM Agent for a Hybrid Environment (Linux)](https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-install-managed-linux.html)