# Web Applications on AWS
## Overview
This web application allows registered users to create, view, and delete notes 
in their account. The focus of this project isn't the application itself,
but on the different ways of deploying and managing apps on AWS. This includes building, deploying, and updating apps in the cloud.

The GitHub link for the app itself is [here](https://github.com/AJ2O/golang-notetaker).

## Services Used
- [CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/welcome.html)
- [CodeDeploy](https://docs.aws.amazon.com/codedeploy/latest/userguide/welcome.html)
- [CodePipeline](https://docs.aws.amazon.com/codepipeline/latest/userguide/welcome.html)
- [Elastic Beanstalk](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/Welcome.html)
- [Elastic Container Registry (ECR)](https://docs.aws.amazon.com/AmazonECR/latest/userguide/what-is-ecr.html)
- [Elastic Container Service (ECS)](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/Welcome.html)

## Prerequisites
- All steps were completed in the region us-east-1
- Build the CloudFormation template [linked here](https://github.com/AJ2O/exp-cloudformation/blob/main/databases/dynamodb-notetaker-app.yaml) to create the DynamoDB table used by the app

## Deployment Methods
The 3 sets of deployment tools explored in this tutorial are:
1. Elastic Beanstalk
2. ECR & ECS
3. CodeBuild & CodePipeline
