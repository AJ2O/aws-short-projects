# Elastic Beanstalk
This tutorial will outline how to deploy and upgrade apps using Elastic Beanstalk, AWS' Platform-as-a-Service (PaaS) solution. All of these steps were performed in the region us-east-1.

## Steps

### 1. Download the application code
- Git clone the [application code](https://github.com/AJ2O/golang-notetaker/tree/elasticbeanstalk-integration)
  - Make sure the selected branch is "elasticbeanstalk-integration"
- Edit the "application.go" file and replace the variable <dynamoDB-table> to the name of the table created by CloudFormation
    - It's near the bottom of the file in the `main` function:
```
// parameterizing the DB allows different note repositories to be used. Ex. Dev, Test, Prod
flag.StringVar(&notes.DDBTable, "db", "<dynamoDB-table>", "dynamoDB table to access")
```
- ZIP the application code
- To make a Go application compatible with Elastic Beanstalk, it needs a few changes:
  - The application starts on port 5000, so the HTTP port needs to be changed from the usual 80 or 8080 to 5000
  - The main application code must be renamed to "application.go" and placed at the root of the directory
  - The included branch already has these changes, so you don't need to change the source code
- For more Go integration notes, [see the AWS Documentation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/create_deploy_go.html)

### 2. Create the IAM role for EC2 to access DynamoDB
- Create a new role, and attach this IAM policy to it
```
AmazonDynamoDBFullAccess
```

### 3. Create the Elastic Beanstalk Application
- On the Elastic Beanstalk console, select "Create Application"
- Name: NoteTaker-EB
- Platforms:
  - Platform: Go
  - Platform Branch: Go running on Amazon Linux 2
  - Platform Version: 3.1.3 (as of this writing)
- Source Code Origin
  - Version label: base
  - Local file: Choose file -> Upload the downloaded zip
- Click "Configure more options"
  - Edit Security
    - Change the IAM instance profile to the IAM role created earlier
- Click "Create application"
- It may take up to 15 minutes for the application to start

### 4. Test Application
- Once started, the page will change to the environment dashboard
- A URL to access the environment will be displayed
- Test the application by registering a new user, logging in, creating, updating and deleting notes

### 5. Elastic Beanstalk Application Components
- In Elastic Beanstalk, there are 2 main components to an application:
  - **Environment**
    - This is the collection of AWS resources used for the application
    - This includes EC2 instances, load balancers, security groups
  - **Application Version**
    - The unique and labeled code for a web application
    - In this tutorial, we created a version named `name` when we uploaded the code
    - The uploaded code is stored in an S3 bucket, and it lets us easily deploy different versions of our application
  - By clicking on your application in the left pane, you are able to view the different versions and environments for it
- [Elastic Beanstalk Concepts Documentation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/concepts.html)

### 6. Deploy a new version of the app
- Copy the included `home.html` file, and replace the file `templates/home.html` in the application code
- ZIP the new application code
- Click on "Application versions"
  - Upload the ZIP, and name the version "v2"
  - Click Upload
- Highlight the new version, and click Actions -> Deploy
  - Select the envrionment and deploy
  - It's also possible to upload and deploy a new version from the environment dashboard

### 7. Test the upgraded app
- Login, and the home page will have a changed CSS style from before

## Notes
- Terminate the environment after completion so that you will not incur charges
- Elastic Beanstalk makes it easy to upload application code and get it running quickly on AWS
  - Just be sure that the application conforms to how [Elastic Beanstalk handles different platforms](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/concepts-all-platforms.html)
- It's easy to maintain multiple versions and multiple environments for each application
  - This also makes it easy to rollback to a previous version if a new deployment doesn't work, since the version code is saved
- You can still have much more granular control over [environment configuration](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/customize-containers.html) if you so choose