# ECR & ECS
This tutorial will outline how to deploy and upgrade apps using containers. The two key services being used are Elastic Container Service (ECS), and Elastic Container Registry (ECR).

[ECR](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html) is simply a registry to store and manage images used for containers. It supports [Docker](https://docs.docker.com/get-started/overview/) images and integrates with other AWS container services such as [ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html) and [EKS](https://docs.aws.amazon.com/eks/latest/userguide/what-is-eks.html).

[ECS](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html) is a managed container orchestration service similar to the open source tool [Kubernetes](https://kubernetes.io/docs/concepts/overview/what-is-kubernetes/). ECS integrates with the AWS cloud, so it is aware of availability zones, IAM permissions, and elastic load balancers.

We'll construct a Docker image for the NoteTaker app and store it in ECR. Then we'll deploy it to a container using ECS clusters.

## Steps

### 1. Install Docker on your local machine
- This machine must also have the AWS CLI configured
- The official steps to install Docker are [linked here](https://docs.docker.com/get-docker/)

### 2. Create ECR Repository
- Open the ECR console
- Repositories -> Create Repository
  - Visibility: Private
  - Repository Name: go-notetaker
  - Leave all the defaults
  - Create repository

### 3. Create and Push Application Image to ECR
- Git clone the [application code](https://github.com/AJ2O/golang-notetaker/tree/elasticbeanstalk-integration)
  - Make sure the selected branch is "docker-integration"
  - It should contain a Dockerfile to build the image
- Edit the "notetaker.go" file and replace the variable <dynamoDB-table> to the name of the table created by CloudFormation
    - It's near the bottom of the file in the `main` function:
        ```
        // parameterizing the DB allows different note repositories to be used. Ex. Dev, Test, Prod
        flag.StringVar(&notes.DDBTable, "db", "<dynamoDB-table>", "dynamoDB table to access")
        ```
- Select the ECR repository in the console, and click on "View push commands"
  - Ensure that your CLI is configured to access ECR
    - Either configure a user or attach an IAM role for EC2 (if you're using an EC2 instance) with this attached policy:
        ```
        AmazonEC2ContainerRegistryPowerUser
        ```
  - The 4 commands needed to push this image to ECR will be displayed for you
    - `docker login` : authenticate to the image registry, in this case it is ECR in your AWS account
    - `docker build` : build the image from the Dockerfile
    - `docker tag` : tag the built image (essentially versioning) 
    - `docker push` : push the tagged image into the repository
- After a couple of minutes, the image will be displayed in your created repository with the tag "latest"

### 4. ECS Architecture
- The Elastic Container Service (ECS) architecture consists of 5 major components:
  - **EC2 Instances**
    - The underlying infrastructure that the containers run on are EC2 instances
    - Instances can be managed in 2 ways:
      - EC2
        - The instance AMIs and Auto Scaling Groups are managed by you
      - Fargate
        - Underlying instances are automatically handled by AWS
  - **Clusters**
    - A logical collection of ECS resources:
      - Services
      - Underlying EC2 instances
      - [Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/clusters.html)
  - **Task Definitions**
    - Configuration parameters to run containers in ECS
    - Parameters include:
      - The Docker image to use for each container in a task
      - Allocated CPU and memory for each task (or each container in a task)
      - IAM role for tasks to use
      - Logging configuration
    - [Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definitions.html)
  - **Tasks**
    - A task is a running instance of a task definition
  - **Services**
    - Enables maintaining a desired number of running tasks
    - Sets the minimum and maximum amount of running tasks
    - Handles update strategies for tasks
      - Ex. Rolling update, Blue/Green deployment
    - [Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/ecs_services.html)
- We'll start by creating the cluster for our app

### 5. Create ECS Task IAM Role
- The created tasks will need IAM permissions to access DynamoDB for the app to function
- Create Role
  - Entity: AWS Service -> Elastic Container Service -> Elastic Container Service Task
  - Attach the following policies:
    ```
    AmazonECSTaskExecutionRolePolicy
    AmazonDynamoDBFullAccess
    ```
  - Create

### 6. Create ECS Cluster
- On the ECS console, click Clusters -> Create Clusters
  - Cluster template: EC2 Linux + Networking
  - Cluster name: go-notetaker-cluster
  - Provisioning Model: On-Demand Instance
  - EC2 instance type: t2.micro
  - Number of instances: 3
  - Create
- You can monitor the instances from the cluster's dashboard
- They can also be seen on the EC2 console

### 7. Create ECS Task Definition
- Click Task Definitions -> Create new Task Definition
  - Launch type compatibility: EC2
  - Task Definition Name: go-notetaker-task
  - Task Role: use the ECS task role created earlier
  - Task memory: 512 MB
  - Task CPU: 512 units
  - Add Container:
    - Container name: notetaker-server
    - Image: copy the URI of the image in ECR
    - Port Mappings:
      - Host port: 80
      - Container port: 80
    - Click "Add"
  - Click "Create"

### 8. Create ECS Service
- Go back to your ECS Cluster, and highlight the "Services" tab
- Click "Create"
  - Launch type: EC2
  - Task Definition: your created task definition
  - Service type: Replica
  - Number of tasks: 3
  - Mininum healthy percent: 50%
  - Deployment type: Rolling update
  - Leave the rest of the options as default
  - Click "Create Service"

### 9. Test Application
- On the cluster dashboard, click on the Tasks tab
- Select a task in the list
  - Expand the details
  - There will be a public URL
  - Open it, and you'll be able to access the app

### 10. Update and Push Application Image
- Replace the `templates/home.html` file with the file included in this folder
- Rebuild, tag, and push the Docker image to ECR
- On the cluster dashboard, select the service
  - Click Update
  - Check the "Force new deployment" box
  - Leave all the other options
  - Click "Update Service"

### 11. Test Updated Application
- Login, and the home page will have a changed CSS style from before
- Note: If the update did not occur, try running the `docker build` command with the `--no-cache` option, and then redo the rest of the commands in Step 10
  - Docker doesn't take timestamp into account when caching build layers, so the html change may not be detected

## Notes
- ECS services can integrate with Elastic Load Balancers, similar to EC2 instances, so it's possible to evenly distribute traffic among them
  - [ECS Load Balancing Documentation](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-load-balancing.html)
- While updating the code in both Elastic Beanstalk and ECS is relatively simple, it's still a manual process
  - The next and final part of this tutorial will explore [CI/CD](https://www.atlassian.com/continuous-delivery/principles/continuous-integration-vs-delivery-vs-deployment) tools CodeBuild, CodeDeploy, and CodePipeline, which will automate deployments whenever a change to source code is detected
