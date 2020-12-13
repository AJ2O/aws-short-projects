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
- [Cloud9](https://docs.aws.amazon.com/cloud9/latest/user-guide/welcome.html)
- [IAM](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html)

## Steps

### 1. Create Source S3 Bucket
- This bucket will kick off the Lambda function whenever an image is uploaded to it

### 2. Create Target S3 Bucket
- This bucket will be where the result image is deposited after processing
- Make this bucket public so that we can quickly view the thumbnails after

### 3. Create Lambda Function
- Runtime: Python 3.7
- Copy-paste the code below
```
# boto3 is the AWS SDK for Python
import boto3

# for error handling
import sys

# import Image from the Python Imaging Library (PIL)
from PIL import Image

# import IO library to handle manipulating bytes
from io import BytesIO

# connect to the S3 service/client
client = boto3.client('s3')

# standard YouTube thumbnail dimensions
thumbnailDimensions = 1280, 720

# cannot format images that aren't one of the listed types
supported_image_types = ["jpg", "png"]
image_type_map = {
    "jpg" : 'JPEG',
    "png" : "PNG"
}

# the name of the target bucket
target_bucket = "<target-bucket>"

def lambda_handler(event, context):
    
    # loop through all uploaded items
    records = event["Records"]
    for record in records:
        
        # parsing the source image key
        image_key = record["s3"]["object"]["key"]
        image_key_without_path = image_key.split('/')[-1]
        split_image_key = image_key_without_path.split('.')
        extension = split_image_key[len(split_image_key) - 1]
        image_key_stripped = "".join(split_image_key[:-1])
        
        # stop if the file is unsupported
        if extension not in supported_image_types:
            print("This file type is unsupported")
            sys.exit(1)
        
        # parsing the source bucket
        source_bucket = record["s3"]["bucket"]["name"]
        if source_bucket == target_bucket:
            print("Cannot reupload the new image to the same bucket")
            sys.exit(1)
        
        # download the source image file
        try:
            source_response = client.get_object(
                Bucket=source_bucket,
                Key=image_key
            )
            body_string = source_response['Body'].read()
            
            # load the image
            image = Image.open(BytesIO(body_string))
            
        except Error:
            print("The source image could not be downloaded")
            sys.exit(1)
            
        
        # apply image processing
        image.thumbnail(thumbnailDimensions)
        
        ''' 
        Other Transformations with PIL
        
        Flip Image
        image = image.transpose(Image.FLIP_LEFT_RIGHT)
        
        Greyscale
        image = image.convert('L')
        
        Image Enhance
        - need to import ImageEnhance from PIL to work
        
        Brightness
        image = ImageEnhance.Brightness(image)
        image = image.enhance(1.5)
        
        Contrast
        image = ImageEnhance.Contrast(image)
        image = image.enhance(1.5)
        
        '''
    
        # constructing the new thumbnail object key
        new_image_key = image_key_stripped + "-thumbnail." + extension
    
        # upload the processed image to the target bucket
        try:
            # convert to bytes
            buf = BytesIO()
            image.save(buf, format=image_type_map[extension])
            
            client.put_object(
                Bucket=target_bucket,
                Key=new_image_key,
                Body=buf.getvalue(),
                ContentType="image"
            )
        except:
            print("The formatted image could not be uploaded")
            sys.exit(1)
        
    return
```
- [PIL Image Documentation](https://pillow.readthedocs.io/en/stable/reference/Image.html)

### 4. Add S3 Trigger
- Select Trigger: S3
- Bucket: The source bucket
- Event Type: PUT
  - Note that this will also trigger on item updates/overwrites
- Prefix:
- Suffix: .jpg

### 5. Add additional S3 Triggers
- Repeat the last step except with the suffix ".png"

### 6. Configure IAM Permissions
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
- [S3 Actions Documentation](https://docs.aws.amazon.com/AmazonS3/latest/dev/list_amazons3.html)

### 7. Lambda Layers Considerations
- Lambda does not have the `PIL` library necessary for image manipulation, so we'll have to use Lambda Layers to import it to the function
  - [Lambda Layers Documentation](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html)
- The simplest way to do this is to use Cloud9:
  - Create a Cloud9 Environment
  - `pip install` the necessary python libraries
  - Package them into a ZIP file to use as a layer
  - Export the ZIP
- [AWS Compute Blog - Lambda Layers](https://aws.amazon.com/blogs/compute/using-lambda-layers-to-simplify-your-development-process/)

### 8. Create a Cloud9 Environment
- The environment used in [this tutorial](https://docs.aws.amazon.com/cloud9/latest/user-guide/tutorial-create-environment.html) will be sufficient for this project

### 9. Package Python Libraries
- Open the Cloud9 environment terminal
- Install/Upgrade these utilities if they aren't already
```
sudo yum install -y python3 python3-pip zip
sudo python3 -m pip install --upgrade pip virtualenv
```
- Create a virtual environment to isolate the python environment from the Cloud9 environment, and activate it:
```
python3 -m venv myenv
source myenv/bin/activate
```
- Install the necessary packages to a folder, then deactivate the environment. In our case, we only need PIL:
```
python3 -m pip install --upgrade Pillow -t ./python
deactivate
```
- ZIP the created `./python` folder:
```
zip -r python.zip ./python/
```
- You can now download the folder directly from your Cloud9 environment for the next step
  - If the Cloud9 user has Lambda `PublishLayerVersion` IAM permissions, this CLI command can directly upload the layer:
    ```
    aws lambda publish-layer-version --layer-name pillow-layer --compatible-runtimes python3.6 python3.7 --zip-file fileb://python.zip
    ```
    - The output JSON will contain the layer ARN (including layer version), which is needed for the next command
  - If the Cloud9 user also has Lambda `UpdateFunctionConfiguration` IAM Permissions, this CLI command adds the layer directly to the function. :
    ```
    aws lambda update-function-configuration --function-name s3-process-image --layers <layer-arn>
    ```
  - If the 2 CLI commands were run successfully, skip the next step
  - [Lambda Actions Documentation](https://docs.aws.amazon.com/service-authorization/latest/reference/list_awslambda.html#awslambda-actions-as-permissions)

### 10. Add Layer to Function
- On the Lambda console, expand the left pane and click on the "Layers" section
- Create layer
  - Select "Upload a .zip file"
  - Select compatible runtimes (as of this writing): Python 3.6, Python 3.7
  - Create
- Go back to the Lambda function
  - On the Designer canvas, highlight the "Layers" element
  - Add Layer
    - Select Custom Layers
    - Select your new layer
    - Select the layer version (on first time, should be 1)
    - Add

### 11. Complete / Verification
- Upload an image (extension .jpg or .png) to the source S3 bucket
  - After a few seconds there will be a generated thumbnail for that image in the target bucket
- Upload a file with no .jpg or .png extension
  - There will be no new file in the target bucket

## Notes
- If the function isn't working, consult the function's CloudWatch logs, as they will detail any function issues. Likely issues are:
  - IAM Permissions for Lambda for the S3 buckets
  - No layers for PIL
- We needed to use Lambda Layers because Pillow doesn't come with Python, so we needed a way to access that library
  - The simplest and fastest way to do that was with the help of Cloud9
    - Cloud9 is a useful tool for software development on the AWS cloud
    - [Get Started With Cloud9 Here](https://docs.aws.amazon.com/cloud9/latest/user-guide/tutorials-basic.html)
- For a real use case, this app could be part of larger media platform such YouTube, Netflix, etc.
  - When uploading a video, the user can choose their video thumbnail
  - The source image would be stored in the main bucket, and be Infrequently-Accessed because we use thumbnails for every video
  - The target image would be stored in a huge thumbnail bucket, and be Standard class because we serve these images constantly
  - We could instantly format thumbnails for our platform for every video uploaded
