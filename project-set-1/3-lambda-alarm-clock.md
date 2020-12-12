# Lambda Alarm Clock App
## Description
- Services Used:
  - [Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
  - [SNS](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
  - [EventBridge](https://docs.aws.amazon.com/eventbridge/latest/userguide/what-is-amazon-eventbridge.html)
  - [IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)
- Experiment with the [AWS SDK for Python](https://boto3.amazonaws.com/v1/documentation/api/latest/index.html)
- Create an alarm clock app that repeatedly sends emails to your devices
- Only stops when logged in to AWS console

## Steps

### 1. Create Lambda Function
- Select Python 3.x (latest)
- Create
- Copy-paste the below python code into lambda_function.py
```
# boto3 is the AWS SDK for Python
import boto3

# connect to the SNS service/client
snsClient = boto3.client('sns')

def lambda_handler(event, context):
    
    # Get the topic arn from the event
    topicArn = event["topicArn"]
    
    # Wake up message
    subject = "Lambda Alarm Clock"
    message = "It's time to wake up!"
    
    # Publish the message to the topic
    try:
        response = snsClient.publish(
            TopicArn=topicArn,
            Subject=subject,
            Message=message)
        print("Message ID: " + response["MessageId"])
    except:
        print("Something went wrong when trying to publish the message")
```

### 2. Lambda IAM Permissions
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
- [SNS API Permissions](https://docs.aws.amazon.com/sns/latest/dg/sns-access-policy-language-api-permissions-reference.html)

### 3. Create SNS Topic
- Topic Type: Standard
  - FIFO queue not required
  - Can use many more types of subscription protocols:
    - SMS
    - Emails
    - Lambda
  - ...
- Display Name: Alarm-Clock
- [Publish SNS Message Documentation](https://docs.aws.amazon.com/sns/latest/dg/sms_publish-to-topic.html#sms_publish-to-topic_console)
    
### 4. Create SNS Subscriptions
- Topic: Created in previous step
- Protocol: SMS
- Phone Number: Your Phone Number
- Finish, and add any other subscriptions if you want
- [Subscriptions Documentation](https://docs.aws.amazon.com/sns/latest/dg/sns-create-subscribe-endpoint-to-topic.html)

### 5. Test SNS Publishing
- Select your topic and click "Publish Message"
- Message Structure: Identical Payload
- Message Body: "This is a test message for the alarm clock"
- Publish, and you should receive the message on your device(s)

### 6. Create EventBridge event
- This event is what will trigger the Lambda function on a schedule
- Create rule
- Pattern: Scheduled
- Select "Cron Expression"
  - Enter cron expression for when this event fires
    - All cron expressions all evaluated in UTC, no matter the region
  - Ex: Every weekday at 5AM EST - `0 5 ? * MON-FRI *`
  - [Cron Expressions Documentation](https://docs.aws.amazon.com/eventbridge/latest/userguide/scheduled-events.html#cron-expressions)
- Select Targets
  - Add the Lambda function created earlier
  - Configure Inputs
    - Select Constant (JSON text)
    - Copy the below snippet into the text box, and replace <topic-arn> with the ARN from the topic created earlier
    - `{ "topicArn" : "<topic-arn>" }`
  - [EventBridge Targets Documentation](https://docs.aws.amazon.com/eventbridge/latest/userguide/eventbridge-targets.html)

### 7. Test Lambda Function
- Create a test event with the following JSON, replacing the topic arn: 
```
{
  "topicArn": "<topic-arn>"
}
```
- Execute the test, and you should get notified

### 8. Complete
- With the trigger enabled, the notification will run automatically according to your cron expression

## Notes
- SMS subscriptions may stop working after a while due to [Amazon's SMS quota](https://aws.amazon.com/premiumsupport/knowledge-center/sns-sms-spending-limit-increase/)
  - Will start working again in the next month


