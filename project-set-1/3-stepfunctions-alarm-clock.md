# Step Functions Alarm Clock App
## Description
- Services Used:
  - [Step Functions](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)
  - [Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
  - [EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/what-is-amazon-eventbridge.html)
  - [SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
  - [SQS](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/welcome.html)
  - [IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
- Experiment with the [AWS SDK for Python](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
- Create an alarm clock app that repeatedly sends emails to your devices
- Only stops upon login to the AWS Console

## Steps

### . Create SQS Lambda Function
- This will be the Lambda function that populates the SQS queue
- Runtime: Python 3.8
- Copy-paste the code below:
```
# boto3 is the AWS SDK for Python
import boto3

# connect to the SQS service/client
sqsClient = boto3.client('sqs')

def lambda_handler(event, context):
    
    # get the queue URL
    queueURL = event["queueURL"]
    count = int(event["count"])
    
    # construct the message
    message = "Wake up!"
    
    # try to queue messages
    for curMessage in range(1, count+1):
        try:
            response = sqsClient.send_message(
                QueueUrl=queueURL,
                MessageBody=message
            )
        except:
            print("The message failed to queue!")
            break
```

### . SQS Lambda IAM Permissions
- For the SQS Lambda function, on the permissions tab, select the created IAM role (or create one if you haven't already)
- Create and attach this IAM policy to the role to allow this function to send SQS messages:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sqs:SendMessage"
            ],
            "Resource": "*"
        }
    ]
}
```
- [SQS API Permissions](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-api-permissions-reference.html)

### . Create SNS Lambda Function
- This will be the function that sends the alarm notifications via SNS
- Select Python 3.x (latest)
- Create
- Copy-paste the below python code into lambda_function.py
```
# boto3 is the AWS SDK for Python
import boto3

# connect to the SNS & SQS service/client
snsClient = boto3.client('sns')
sqsClient = boto3.client('sqs')

def lambda_handler(event, context):
    
    # get the topic arn from the event
    topicArn = event["topicArn"]
    queueURL = event["queueURL"]
    
    # get message from SQS queue
    subject = "Lambda Alarm Clock"
    
    try:
        queueMessage = sqsClient.receive_message(
            QueueUrl=queueURL,
            MaxNumberOfMessages=1
        )
        messageList = queueMessage["Messages"]
        messageBody = messageList[0]["Body"]
        
        # Publish the message to the topic
        try:
            response = snsClient.publish(
                TopicArn=topicArn,
                Subject=subject,
                Message=messageBody)
            return { "status" : "success" }
            
        except:
            print("Something went wrong when trying to publish the message")
            
    except:
        print("No message could be retrieved from the queue!")
        
    return { "status" : "fail" }
```

### . SNS Lambda IAM Permissions
- For the Lambda function, on the permissions tab, select the created IAM role (or create one if you haven't already)
- Create and attach this IAM policy to the role to allow this function to publish SNS messages:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sns:Publish"
            ],
            "Resource": "*"
        }
    ]
}
```
- Create and attach this IAM policy to allow this function to receive SQS messages:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sqs:ReceiveMessage"
            ],
            "Resource": "*"
        }
    ]
}
```
- [SNS API Permissions](https://docs.aws.amazon.com/sns/latest/dg/sns-access-policy-language-api-permissions-reference.html)

### . Create Stop Lambda Function
- This will be the Lambda function that stops the sending of notifications
- Runtime: Python 3.8
- Copy-paste the code below:
```
# boto3 is the AWS SDK for Python
import boto3

# connect to the SQS service/client
sqsClient = boto3.client('sqs')

def lambda_handler(event, context):
    
    # get the queue URL
    queueURL = event["queueURL"]
    
    # purge the queue
    try:
        response = sqsClient.purge_queue(QueueUrl=queueURL)
    except:
        print("The message queue couldn't be emptied!")
```

### . Stop Lambda IAM Permissions
- For the Stop Lambda function, on the permissions tab, select the created IAM role (or create one if you haven't already)
- Create and attach this IAM policy to the role to allow this function to purge SQS messages:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "sqs:PurgeQueue"
            ],
            "Resource": "*"
        }
    ]
}
```

### . Create SQS Queue
- Create Queue
- Type: Standard
- Message Retention: 30 minutes (or however long you desire)
  - Shouldn't be longer than a day since it is just an alarm

### . Create SNS Topic
- Topic Type: Standard
  - FIFO queue not required
  - Can use many more types of subscription protocols:
    - SMS
    - Emails
    - Lambda
  - ...
- Display Name: Alarm-Clock
- [Publish SNS Message Documentation](https://docs.aws.amazon.com/sns/latest/dg/sms_publish-to-topic.html#sms_publish-to-topic_console)
    
### . Create SNS Subscriptions
- Topic: Created in previous step
- Protocol: SMS
- Phone Number: Your Phone Number
- Finish, and add any other subscriptions if you want
- [Subscriptions Documentation](https://docs.aws.amazon.com/sns/latest/dg/sns-create-subscribe-endpoint-to-topic.html)

### . Test SNS Publishing
- Select your topic and click "Publish Message"
- Message Structure: Identical Payload
- Message Body: "This is a test message for the alarm clock"
- Publish, and you should receive the message on your device(s)

### . Create Step Functions Application
- Copy-paste the code below for the function definition replacing:
  - <queue-URL> with the URL for the SQS queue created earlier
  - <topic-arn> with the ARN for the SNS topic created earlier
  - <SNS-Lambda-arn> with the ARN for the notification Lambda
  - <SQS-Lambda-arn> with the ARN for the SQS Lambda
```
{
  "Comment": "An Alarm Clock App using State Machines",
  "StartAt": "Populate SQS Queue",
  "States": {
    "Populate SQS Queue": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "<SQS-Lambda-arn>",
        "Payload": {
          "queueURL": "<queue-URL>",
          "count": "$.count"
        }
      },
      "Next": "Send Notification"
    },
    "Send Notification": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "<SNS-Lambda-arn>",
        "Payload": {
          "topicArn": "<topic-arn>",
          "queueURL": "<queue-URL>"
        }
      },
      "ResultPath" : "$",
      "Next": "Verification"
    },
    "Verification": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.status",
          "StringEquals": "success",
          "Next": "Complete"
        }
      ],
      "Default": "Wait"
    },
    "Wait": {
      "Type": "Wait",
      "Seconds": 60,
      "Next": "Send Notification"
    },
    "Complete": {
      "Type": "Pass",
      "Result": "Complete",
      "End": true
    }
  }
}
```
- [Step Functions Processing](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-input-output-filtering.html)

### . Step Functions Permissions
- Edit the Step Functions role, and edit the policy to be like below so that it can execute the Lambda functions:
```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lambda:InvokeFunction"
            ],
            "Resource": [
                "<SNS-Lambda-arn>",
                "<SQS-Lambda-arn>",
                "<SNS-Lambda-arn>:*",
                "<SQS-Lambda-arn>:*"
            ]
        }
    ]
}
```

### . Manually Test App
- Start an execution with the JSON input as below: 
```
{
  "count": "5"
}
```
- You should get notified 5 times over the course of 5 minutes
- During this time, you can try out the Stop Lambda function to stop notifications

### . Create EventBridge event
- This event is what will trigger the Lambda function on a schedule
- Create rule
- Pattern: Scheduled
- Select "Cron Expression"
  - Enter cron expression for when this event fires
    - All cron expressions all evaluated in UTC, no matter the region
  - Ex: Every weekday at 5AM EST - `0 5 ? * MON-FRI *`
  - [Cron Expressions Documentation](https://docs.aws.amazon.com/eventbridge/latest/userguide/scheduled-events.html#cron-expressions)
- Select Targets
  - Add the Step Functions app created earlier
  - Configure Inputs
    - Select Constant (JSON text)
    - Copy the below snippet into the text box, with however long you want to get notifications
    - `{ "count" : "15" }`
  - [EventBridge Targets Documentation](https://docs.aws.amazon.com/eventbridge/latest/userguide/eventbridge-targets.html)


### . Complete
- With the trigger enabled, the notification will run automatically according to your cron expression

## Notes
- SMS subscriptions may stop working after a while due to [Amazon's SMS monthly quota](https://aws.amazon.com/premiumsupport/knowledge-center/sns-sms-spending-limit-increase/)
- There are many ways to build this kind of app, but this method makes extreme use of decoupling app components


