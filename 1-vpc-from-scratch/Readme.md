# Create a Virtual Private Cloud By Hand
## Description
- Services Used:
  - [VPC](https://docs.aws.amazon.com/vpc/latest/userguide/what-is-amazon-vpc.html)
  - [EC2 - Linux Instances](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html)
- Create a typical VPC without the VPC wizard
- 3 Availability Zones (AZs)
- Public and Private subnet in each AZ
- NAT Gateway so that private instances can update packages
- Lock down SSH access to VPC to only by our personal PC
- Create a public instance that will be a web server
- Create a private instance that is only accessible via SSH by public instances
- Supplementary documentation for further reading

### 1. Create Virtual Private Cloud (VPC)
- Name = "Custom VPC"
- CIDR Block = 10.0.0.0/16
  - 2^16 available IPs starting from 10.0.0.0
  - 2^16 - 5 IPs, since AWS reserves some:
    - First IP (10.0.0.0) - Network Address
    - Second IP (10.0.0.1) - VPC Router
    - Third IP (10.0.0.2) - DNS Server
    - Fourth IP (10.0.0.3) - Future Use
    - Last IP (10.0.255.254) - Network Broadcast Address
  - An awesome tool for experimenting with CIDR Blocks is [cidr.xyz](https://cidr.xyz/)
  - [Subnet Sizing Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Subnets.html#VPC_Sizing)
- Tenancy = Default
  - Shared, multi-tenant hardware for instances by default
  - Dedicated means single-tenant, and overrides tenancy settings at the instance level
- On Creation
  - Route Table generated
    - No Internet Gateway, so instance communication stays in the VPC
  - NACL generated
    - Inbound/Outbound ALLOW for all traffic
  - Security Group (SG) generated
    - Inbound/Outbound allowed for all traffic
  - No Subnets, Internet Gateway, or NAT Gateway generated, we'll have to make those

### 2. Create Internet Gateway (IGW)
- Attach it to the VPC
- [Internet Gateway Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Internet_Gateway.html)

### 3. Create Subnets in each AZ for the new VPC
- Public & Private Subnets for each AZ
- I used a 4:1 ratio for Public:Private
  - Ex. Public A - 10.0.0.0/24 = 256 IPs
  - Ex. Private A - 10.0.1.0/26 = 64 IPs
  - Ex. Public B - 10.0.2.0/24 = 256 IPs
  - ...
- [Subnet Basics Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Subnets.html#vpc-subnet-basics)

### 4. Route Tables for the new VPC
- Create Public Route Table
  - Associate all Public Subnets
  - Attach IGW to this table
  - Create route from 0.0.0.0/0 to IGW
  - Go back to each public subnet and enable Auto-Assign Public IPv4 Addresses
- Create Private Route Table
  - Associate all Private Subnets
- [Route Table Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_Route_Tables.html)

### 5. Create NAT Gateway and attach to the Private Route Table
- Select a public subnet to create the NAT Gateway in
    - Currently if the AZ the NAT Gateway is in goes down, all private instances can't connect
    - Best practice is to use a NAT Gateway in each AZ, so that AZs are independent
- Allocate Elastic IP for NAT Gateway
- [NAT Gateway Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-nat-gateway.html)
- [Elastic IP Addresses Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-eips.html)

### 6. NACLs for the new VPC
- Create NACL
  - Inbound/Outbound SSH on my personal IP
    - Google "whats my ip"
  - Inbound/Outbound SSH on VPC subnet
  - Inbound/Outbound HTTP/HTTPS to all
  - Inbound/Outbound Ephemeral Ports (ex. 1024 - 65535)
    - Inbound to allow for yum updates
    - Outbound range as different operating systems use different ranges
    - [Ephemeral Ports Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-network-acls.html#nacl-ephemeral-ports)

### 7. Security Groups
- Create an SG for the public web server instances:
  - Inbound ports 22, 80, 443 from anywhere
  - Outbound all
- Create an SG for private instances
  - Inbound port 22 from Public Instance SG
  - Outbound all
- [Security Groups Documentation](https://docs.aws.amazon.com/vpc/latest/userguide/VPC_SecurityGroups.html)
        
### 8. Launch Instance(s) in Public Subnet(s)
- Bootstrap to be web server
```
#!/bin/bash
yum update -y
yum install -y httpd
cd /var/www/html
echo "<html><h1>This is a test web-server</h1></html>" > index.html
service httpd start
chkconfig httpd on
```

### 9. Launch Instance(s) in Private Subnet(s)
- Bootstrap to run yum update
```
#!/bin/bash
yum update -y > /tmp/update.log
```

### 10. Complete / Verification
- Put in public instance IP into browser, and there should be our website
- SSH to private instance from your PC, it should fail
- SSH to public instance from your PC, it should work
- SSH to private instance from public instance, it should work
- Read the updates log from the private instance. Updates should have run successfully:
```
[ec2-user@ip-10-0-1-18 ~]$ cat /tmp/update.log
Loaded plugins: extras_suggestions, langpacks, priorities, update-motd
Resolving Dependencies
--> Running transaction check
---> Package amazon-linux-extras.noarch 0:1.6.12-1.amzn2 will be updated
---> Package amazon-linux-extras.noarch 0:1.6.13-1.amzn2 will be an update
---> Package amazon-linux-extras-yum-plugin.noarch 0:1.6.12-1.amzn2 will be updated
---> Package amazon-linux-extras-yum-plugin.noarch 0:1.6.13-1.amzn2 will be an update
...

...
  libgcc.x86_64 0:7.3.1-11.amzn2
  libgomp.x86_64 0:7.3.1-11.amzn2
  libstdc++.x86_64 0:7.3.1-11.amzn2
  system-release.x86_64 1:2-13.amzn2

Complete!
```

## Notes:
- Tagging resources is a good practice
  - I tagged all resources made in this project with "Project" : "VPC By Hand"
- Remember to delete the following resources when finished. You will incur costs if they aren't being used!
  - NAT Gateway
  - Elastic IP Address
  - EC2 Instances
