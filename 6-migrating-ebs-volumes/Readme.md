# Migrating EBS Volumes
## Overview
Elastic Block Store (EBS) volumes provide block-level storage for EC2 instances. They can be freely attached and detached from running instances, and can persist independently from the life of an instance. Their use cases include file systems, databases, and throughput-intensive applications.

There are 4 major types of EBS volumes:
- **General Purpose SSD (gp2, gp3)**
  - Useful for most applications, or as a root device
  - Max IOPS: 16 000
- **Provisioned IOPS SSD (io1, io2)**
  - The highest performance SSD volume
  - Useful for I/O intensive workloads, such as databases
  - Max IOPS: 64 000
- **Throughput Optimized HDD (st1)**
  - Low cost, but optimized for frequently accessed / throughput-intensive workloads
  - Use cases include Big Data processing, Data warehousing, log processing
  - Max IOPS: 500
- **Cold HDD (sc1)**
  - Lowest cost designed for less frequently accessed workloads
  - Use cases include basic file servers

EBS volumes can have their attributes and volume types switched on the fly, even while attached to a running instance. 

However, a limit to EBS volumes is that they can only be attached to EC2 instances in the same availability zone. In this tutorial, we'll create EBS volumes and migrate them between instances in different availability zones and regions.

## Services Used
- [EC2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html)
- [EBS](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/AmazonEBS.html)

## Copying Volumes Between Availability Zones

### 1. Launch EC2 Instance with an additional EBS Volume
- While creating the instance, modify the storage step
- Add new volume: io1
- Add new volume: st1
- Add new volume: sc1

### 2. Launch an EC2 Instance in a different AZ

### 3. Create an EBS Snapshot
- Select one of the EBS volumes attached to the first instance
- Create a snapshot of it

### 4. Create a Volume from the Snapshot
- Select the snapshot
- Click Actions -> Create Volume
- Select the same AZ as the other instance
- Notice that it's possible to create any other type of EBS Volume from the snapshot

### 5. Attach the new volume to the other Instance
- Select the new volume
- Click Actions -> Attach Volume
- Select the instance to attach

### 6. Complete 

## Copying Volumes Between Regions

### 1. Launch an EC2 Instance in a different Region

### 2. Create and Copy an EBS Snapshot
- Select one of the EBS volumes attached to the first instance
- Create a snapshot of it
- Copy the snapshot to the same region in Step 1.
  - Notice that it's also possible to encrypt an unencrypted snapshot at this step as well

### 3. Create a Volume from the Snapshot in the second Region
- Switch to the new region
- Select the snapshot
- Create a volume from the snapshot, in the same AZ as your instance

### 4. Attach the new volume to the other Instance
- Select the new volume
- Click Actions -> Attach Volume
- Select the instance to attach

### 5. Complete 

## Notes
- When instances are deleted, additional EBS volumes persist
- Root devices are deleted by default, but can be persisted by choice