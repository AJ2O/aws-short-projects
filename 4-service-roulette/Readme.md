# Service Roulette
## Overview
The Service Roulette is a web application that once spun,  chooses a random AWS service to learn. 
- The web application runs on a website on **S3**, so we don't need to create an underlying web server 
- The service list will be retrieved from **DynamoDB**, so we don't need to create an underlying database server
- **Lambda** will run the code to access DynamoDB and get a random service
- **API Gateway** will be the link between the application and Lambda
## Services Used
  - [API Gateway](https://docs.aws.amazon.com/apigateway/latest/developerguide/welcome.html)
  - [DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
  - [Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
  - [S3](https://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html)

## Steps
### 1. Create a DynamoDB Table to store Services
- Name: ServiceCatalog
- Partition Key: Name
- Disable Autoscaling
  - Set Provisioned Read Capacity Units: 5
  - Set Provisioned Write Capacity Units: 5
- Create

### 2. Add Table Items
- Select the table
- Add some sample items
  - Create Item
    - Set the service name
    - Add a new attribute "Category", and set the service category
  - Repeat the process for the following items:
<table>
    <tr>
        <th>Service</th>
        <th>Category</th>
        <th>Documentation</th>
    </tr>
    <tr>
        <td>EC2</td>
        <td>Compute</td>
        <td>https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/concepts.html</td>
    </tr>
    <tr>
        <td>Lambda</td>
        <td>Compute</td>
        <td>https://docs.aws.amazon.com/lambda/latest/dg/welcome.html</td>
    </tr>
    <tr>
        <td>S3</td>
        <td>Storage</td>
        <td>https://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html</td>
    </tr>
    <tr>
        <td>DynamoDB</td>
        <td>Database</td>
        <td>https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html</td>
    </tr>
    <tr>
        <td>CloudFormation</td>
        <td>Management & Governance</td>
        <td>https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html</td>
    </tr>
    <tr>
        <td>CloudWatch</td>
        <td>Management & Governance</td>
        <td>https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/WhatIsCloudWatch.html</td>
    </tr>
    <tr>
        <td>Sagemaker</td>
        <td>Machine Learning</td>
        <td>https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html</td>
    </tr>
</table>

### 3. Create Lambda Function
- Author from scratch
  - Name: ServiceRoulette
  - Runtime: Node.js 12.x (as of this writing)
  - Create
- ZIP the included file index.js
- Upload the ZIP file to Lambda to update the code

### 4. Create IAM Permissions for Lambda
- Lambda will need permissions to access the DynamoDB table
  - It only needs to scan the database, so we'll apply the principle of least privilege
- Find the function's execution role under the 'Permissions' tab
- Edit the Lambda execution role in the IAM console, and add a new policy to it, replacing `<dynamoDB-table-ARN>` with the ARN of the DynamoDB table:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "dynamodb:Scan",
            "Resource": "<dynamoDB-table-ARN>"
        }
    ]
}
```

### 5. Test the Function
- On the function, configure a new test event, using any event template
- Click Test
- The output should be similar to below, listing all the services, and the selected random service:
```
{
  "statusCode": 200,
  "body": {
    "serviceList": [
      {
        "Service": "Lambda",
        "Category": "Compute",
        "Documentation": "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html"
      },
      {
        "Service": "Sagemaker",
        "Category": "Machine Learning",
        "Documentation": "https://docs.aws.amazon.com/sagemaker/latest/dg/whatis.html"
      },
      ...
      ...
      ...
      {
        "Service": "CloudFormation",
        "Category": "Management & Governance",
        "Documentation": "https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html"
      }
    ],
    "randomService": {
      "Service": "Lambda",
      "Category": "Compute",
      "Documentation": "https://docs.aws.amazon.com/lambda/latest/dg/welcome.html"
    }
  },
  "headers": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true
  }
}
```

### 6. Configure API Gateway
- Now we need to configure an API that will invoke the Lambda function and return it's result
- On the API Gateway console, build a REST API
  - Select "New API"
  - Give it a name and description
  - Endpoint Type: Regional
- Once created select the API, and click on "Actions"
  - Create Method -> Get, and click the checkmark icon
  - Integration type: Lambda Function
  - Enter the name of the Lambda function
  - Click Save
- Enables CORS so that our website will be able to access this resource
  - Click Actions -> Enable CORS
  - Click "Enable CORS and replace existing CORS headers"
- Now we have to deploy the API to a stage to generate the URL
  - Make sure the GET method is highlighted, and click Actions -> Deploy API
  - Deployment stage -> New Stage
  - Give the stage a name and description
  - Deploy
- Under stages, the new stage will be listed, and it's invocation URL will be generated

### 7. Create S3 Website
- Create an S3 bucket with public access
- Go to Properties -> Static website hosting
  - Edit -> Enable
  - Hosting type: Host a static website
  - Index document: index.html
  - Error document: error.html
- Before you upload the included index.html, modify it by replacing `<api-gateway-url>` with the URL from your API's stage. The line needing modification is below:
```
// send the HTTP request to the API's invocation URL
xhttp.open("GET", "<api-gateway-url>", true);
xhttp.send();
```
- Upload the index.html and error.html files included
- Give both files Public Read permissions

### 8. Test it out!
- Click on the static website link, and spin the wheel for a random service!
