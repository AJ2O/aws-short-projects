# Image Processing with S3 & Lambda

## Overview
- When an image is uploaded to a specific S3 bucket, it will instantly trigger a Lambda function
- This function will process the newly uploaded image
- When processing an image, the use cases vary:
  - Create a thumbnail-sized version
    - This is what we'll be doing
  - Image effects (colorize, blur, overlay text)
  - Watermark
  - Clone to a backup location
  - Send to machine learning model for evaluation
  - much more...

## Services Used
- [S3](https://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html)
  - [AWS Python SDK for S3](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html)
- [Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
  - [Using Lambda with S3](https://docs.aws.amazon.com/lambda/latest/dg/with-s3.html)
  - [Lambda Layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)

## Steps

### . Create Source S3 Bucket
- This bucket will kick off the Lambda function whenever an image is uploaded to it

### . Create Target S3 Bucket
- This bucket will be where the result image is deposited after processing
- Make this bucket public so that we can quickly view the thumbnails after

### . Create Lambda Function
- Runtime: Python 3.8
- Copy-paste the code below
```
```
- [PIL Image Documentation](https://pillow.readthedocs.io/en/stable/reference/Image.html)

### . Add S3 Trigger
- Select Trigger: S3
- Bucket: The source bucket
- Event Type: PUT
  - Note that this will also trigger on item updates/overwrites
- Prefix:
- Suffix: .jpg

### . Add additional S3 Triggers
- Repeat the last step except with the suffix ".png"

### . Configure IAM Permissions
- Lambda will need S3 Get Object permissions to read the object data from the source bucket
- Lambda will need S3 Put Object permissions to upload the formatted image to the target bucket
- Add the following statement into the Lambda function's role's policy:
```
{
    "Effect": "Allow",
    "Action": [
        "s3:GetObject"
    ],
    "Resource": "arn:aws:s3:::<source-bucket>/*"
},
{
    "Effect": "Allow",
    "Action": [
        "s3:PutObject"
    ],
    "Resource": "arn:aws:s3:::<target-bucket>/*"
}
```

## Notes
- S3 API calls are asynchronous, so they are handled with `async` Python calls
  - [Asynchronous AWS Invocations](https://docs.aws.amazon.com/lambda/latest/dg/invocation-async.html)
- We needed to use Lambda Layers because Pillow doesn't come with Python, so we needed a way to access that library
- For a real use case, this app could be part of larger media platform such YouTube, Netflix, etc.
  - When uploading a video, the user can choose their video thumbnail
  - The source image would be stored in the main bucket, and be Infrequently-Accessed because we use thumbnails for every video
  - The target image would be stored in a huge thumbnail bucket, and be Standard class because we serve these images constantly
  - We could instantly format thumbnails for our platform for every video uploaded
