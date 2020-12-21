# CodeBuild, CodeDeploy, & CodePipeline

## CI/CD
CI/CD are short-form for referencing the terms [Continuous Integration](https://aws.amazon.com/devops/continuous-integration/), [Continuous Delivery, & Continuous Deployment](https://aws.amazon.com/devops/continuous-delivery/). These 3 concepts are [DevOps](https://aws.amazon.com/devops/what-is-devops/) software development practices for creating and deploying applications with rapid velocity.

### Continuous Integration
**Continuous Integration (CI)** is a practice where software developers constantly merge their code changes into a central code repository. With each merge, automated tests are run against it to ensure that the code change that triggered it did not cause any application errors. If an error did occur, the CI tool sends an automated email to the developer who caused the issue. In typical CI workflows, code changes happen multiple times per day.

CI encourages software development teams to frequently merge small, incremental changes. This is to reduce the likelihood of errors occurring, and validates each change with automated tests. If an error did occur, the developer would be notified quickly, and since the change was recent (and small!), they would fix the problem sooner in response.

### Continuous Delivery
**Continuous Delivery (CD)** is a practice where code changes are maintained in a deployable state. This comes after the CI tool has validated that a code change passed the automated tests. Once a code change passes, it can be built and have its artifacts stored, ready for deployment at any time. 

CD doesn't necessarily mean deploying the code change to an environment whenever a code change happens in source control, but since it has passed the validation stage, we can be confident to deploy it whenever we choose to.

### Continuous Deployment
**Continuous Deployment** is the full end-to-end automation of source control -> CI -> CD -> production. Whereas in CD there's a manual step to deploy the code to production, this step is automatic with continuous deployment. In this workflow, code changes pass a standardized process and propagate to production once validated.

## Overview
This tutorial will cover how CI/CD can be achieved on AWS, using the same NoteTaker app example as before. This time, we'll enable automated deployments on both implementations, Elastic Beanstalk and ECS, at the same time.

[CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html) is a fully managed build service on AWS. It can compile source code, run automated tests, and export artifacts for deploying the application. It can utilize popular build tools such as Maven or Gradle, or you customize it with the exact commands to run at each step in the build process.

[CodeDeploy](https://docs.aws.amazon.com/codedeploy/latest/userguide/welcome.html) is a service that automates application deployment to EC2 instances, Lambda functions, ECS clusters, and even on-premises instances.

[CodePipeline](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html) is a continuous delivery service to model and automate the steps required for deploying software. 

## Prerequisites

## CodeBuild Steps

## CodeDeploy Steps

## CodePipeline Steps

## Notes
- 
