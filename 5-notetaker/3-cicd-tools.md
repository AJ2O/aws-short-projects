# CodeBuild & CodePipeline

## CI/CD
CI/CD is short-form for referencing the terms [Continuous Integration](https://aws.amazon.com/devops/continuous-integration/), [Continuous Delivery, & Continuous Deployment](https://aws.amazon.com/devops/continuous-delivery/). These interrelated concepts are [DevOps](https://aws.amazon.com/devops/what-is-devops/) software development practices for creating and deploying applications with speed and consistency.

### Continuous Integration
**Continuous Integration (CI)** is a practice where software developers constantly merge their code changes into a central code repository. With each merge, automated tests are run against it to ensure that the code change that triggered it did not cause any application errors. If an error did occur, the CI tool sends an automated email to the developer who caused the issue. In typical CI workflows, code changes happen multiple times per day.

CI encourages software development teams to frequently merge small, incremental changes. This is to reduce the likelihood of errors occurring, and validates each change with automated tests. If an error did occur, the developer would be notified quickly, and since the change was recent (and small!), they would fix the problem sooner in response.

### Continuous Delivery
**Continuous Delivery (CD)** is a practice where code changes are maintained in a deployable state. This comes after the CI tool has validated that a code change passed the automated tests. Once a code change passes, it can be built and have its artifacts stored, ready for deployment at any time. 

CD doesn't necessarily mean deploying the code change to an environment whenever a code change happens in source control, but since it has passed the validation stage, we can be confident to deploy it whenever we choose to.

### Continuous Deployment
**Continuous Deployment** is the full end-to-end automation of source control -> CI -> CD -> production. Whereas in CD there's a manual step to deploy the code to production, this step is automatic with continuous deployment. In this workflow, code changes pass a standardized process and propagate to production once validated.

## Overview
This tutorial will cover how CI/CD can be achieved on AWS, using the same NoteTaker app example as before. This time, we'll enable automated deployments on our ECS implementation. Note that the similar steps can be achieved for Elastic Beanstalk.

[CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html) is a fully managed build service on AWS. It can compile source code, run automated tests, and export the artifacts needed for deploying the application. It can utilize popular build tools such as Maven or Gradle, or you customize it with the exact commands to run at each step in the build process.

[CodePipeline](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html) is a continuous delivery service used to model and automate the steps required for deploying software. It consists of sequenced stages, and the actions in each stage are customizable by you.

## Prerequisites

### Environment
- Have running environments of the NoteTaker app pn ECS
- Redoing the previous section to set it up will be sufficient
- This environment will be used as the deployment target for the tools in this tutorial

### Source Control
- Todo...

## CodeBuild Steps

### 1. Buildspec.yml
- We are going to use our own build steps for CodeBuild using build specification (buildspec) files
- A buildspec is a collection of build settings and commands which are run in sequence by CodeBuild
- The file can be defined when creating a build project, or included as part of the source code
  - This tutorial will include the file in source code

### 2. Edit Buildspec.yml in branch "docker-codebuild"
- Git clone the [application code](https://github.com/AJ2O/golang-notetaker/tree/docker-codebuild)
  - Make sure the selected branch is "docker-codebuild"
- It is the same as the branch "docker-integration", except it has the new file in the root directory named `buildspec.yml`
- Modify `notetaker.go` to point to your DynamoDB table as before
- Modify `buildspec.yml` to point the image repository to the one in your AWS account
- To summarize `buildspec.yml`, it will execute the same commands we did manually before:
  - Authenticating to ECR
  - Building the image
  - Tagging it with "latest"
  - Pushing the image to ECR
- If commands in a phase fail, commands in other phases may not be run as well
  - Ex. If the `install` phase fails, no commands are run in the `pre_build`, `build`, or `post_build` phases either
  - To read more information about phase transitions, view the [Build Details Documentation](https://docs.aws.amazon.com/codebuild/latest/userguide/view-build-details.html#view-build-details-phases)
- To learn more read the [Buildspec syntax Documentation](https://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html#build-spec-ref-syntax)

### 3. Create CodeBuild Project
- Create build project
- Project name: go-notetaker-bp
- Source:
  - Provider: S3
  - Bucket: Bucket reserved for Docker
  - S3 object key: the name of the zip file in the bucket
- Environment:
  - Environment image: Managed
  - Operating system: Ubuntu
  - Runtime(s): Standard
  - Image: aws/codebuild/standard:4.0 (as of this writing)
  - Environment type: Linux
  - Privileged: Enable 
    - This option must be enabled to build Docker images
- Leave the rest of the configuration as default
- Create Build Project

### 4. Configure CodeBuild IAM Permissions
- The new build project would have automatically created a service role
- Select the IAM role, and attach the following IAM policy:
    ```
    AmazonEC2ContainerRegistryPowerUser
    ```

### 5. Test Build
- Select the project and click "Start build"
  - Name: go-notetaker-bp
  - Leave defaults, and "Start build"
- You can click "Tail logs" to view the build process
- If you run into any errors, they will be displayed in the build logs
- After it successfully builds, check the ECR repository
  - The "Pushed at" date should be minutes ago

## CodePipeline Steps
- Todo...

## Notes
- Todo...
