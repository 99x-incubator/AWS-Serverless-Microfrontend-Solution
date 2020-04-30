# AWS-Serverless-Microfrontend-Solution

The purpose of this template is to implement severless Microfrontend using an AWS CloudFormation template. This template will create following resources.

- Two **S3** buckets for hosting websites.
- CloudFront Distribution.
- Lambda Function (Deployed to edge).

## Parameters

### `reactBucketName` - valid **S3** name for the react bucket

### `angularBucketName` - valid **S3** name for the angular bucket

### `CodeBucket` - The name of the **S3** bucket that holds the code for Lambda fucntion

_CodeBucket should have correct permissions and the code should be zipped as lambda.zip._

## Output values

### `ReactURL` - URL for website hosted on ReactBucket

### `AngularURL` - URL for the website hosted on AngularBucket

_These values are needed inside the lambdafunction._
_Note: Need to update the cloudfront's origin to ReactURl as it default set to the S3 bucket not the Static endpoint._

## Example

Example lambda function code can be found inside the example_code/ 

```yaml
AWSTemplateFormatVersion: 2010-09-09
Resources:

  CloudFrontDistribution:
    Type: 'AWS::CloudFront::Distribution'
    Properties:
      DistributionConfig:
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          AllowedMethods:
            - GET
            - HEAD
          CachedMethods:
            - GET
            - HEAD
          LambdaFunctionAssociations:
            - EventType: origin-request
              LambdaFunctionARN: !Ref LambdaVersion
          ForwardedValues:
            # This approch uses cookies. State whitelistedNames below.
            Cookies:
              Forward: whitelist
              WhitelistedNames:
                - version
            QueryString: false
          TargetOriginId: s3origin
          ViewerProtocolPolicy: allow-all
        Enabled: true
        HttpVersion: http2
        Origins:
          # Default, it is set to the ReactBucket
          - DomainName: !GetAtt 
              - ReactBucket
              - DomainName
            Id: s3origin
            S3OriginConfig:
              OriginAccessIdentity: !Sub >-
                origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}
    DependsOn:
      - ReactBucket

  LambdaFunction:
    Type: 'AWS::Lambda::Function'
    Properties:
      Description: |
        Lambda@edge Function.
      Code:
        # Hosting Code in an S3 bucket. can use InLine or ZipFile also.
        S3Bucket: !Ref CodeBucket
        S3Key: lambda.zip
      Handler: index.handler
      Role: !GetAtt 
        - iamrole
        - Arn
      Runtime: nodejs12.x

  LambdaVersion:
    Type: 'AWS::Lambda::Version'
    Properties:
      FunctionName: !Ref LambdaFunction
    DependsOn:
      - LambdaFunction

  IndexLambdaVersion:
    Type: 'Custom::LatestLambdaVersion'
    Properties:
      ServiceToken: !GetAtt PublishLambdaVersion.Arn
      FunctionName: !Ref LambdaFunction

  iamrole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - edgelambda.amazonaws.com
                - lambda.amazonaws.com
            Action:
              - 'sts:AssumeRole'

  ReactBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      AccessControl: PublicRead
      BucketName: !Ref ReactBucketName
      WebsiteConfiguration:
        ErrorDocument: index.html
        IndexDocument: index.html
      VersioningConfiguration:
        Status: Enabled

  ReactBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref ReactBucket
      PolicyDocument:
        Version: 2012-10-17
        Statement:
          - Sid: PublicRead
            Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
            Resource:
              - !Sub '${ReactBucket.Arn}/*'
    DependsOn:
      - ReactBucket

  AngularBucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      AccessControl: PublicRead
      BucketName: !Ref AngularBucketName
      WebsiteConfiguration:
        ErrorDocument: index.html
        IndexDocument: index.html
      VersioningConfiguration:
        Status: Enabled

  AngularBucketPolicy:
    Type: 'AWS::S3::BucketPolicy'
    Properties:
      Bucket: !Ref AngularBucket
      PolicyDocument:
        Version: 2012-10-17
        Statement:
          - Sid: PublicRead
            Effect: Allow
            Principal: '*'
            Action:
              - 's3:GetObject'
            Resource:
              - !Sub '${AngularBucket.Arn}/*'
    DependsOn:
      - AngularBucket

  IAMP41UKQ:
    Type: 'AWS::IAM::Policy'
    Properties:
      Roles:
        - !Ref iamrole
      PolicyName: AmazonS3FullAccess
      PolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Action: 's3:*'
            Resource:
              - '*'
              - !Sub 'arn:aws:s3:::${CodeBucket}'
              - !Sub 'arn:aws:s3:::${CodeBucket}/*'
    DependsOn:
      - iamrole

  PublishLambdaVersionRole:
    Type: 'AWS::IAM::Role'
    Properties:
      AssumeRolePolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'

  PublishLambdaVersionRolePolicy:
    Type: 'AWS::IAM::Policy'
    Properties:
      Roles:
        - !Ref PublishLambdaVersionRole
      PolicyName: PublishVersion
      PolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Action: 'lambda:PublishVersion'
            Resource: '*'

  PublishLambdaVersion:
    Type: 'AWS::Lambda::Function'
    Properties:
      Description: |
        Publishing Function.
      Handler: index.handler
      Runtime: nodejs12.x
      Role: !GetAtt PublishLambdaVersionRole.Arn
      Code:
        ZipFile: |
          const {Lambda} = require('aws-sdk')
          const {send, SUCCESS, FAILED} = require('cfn-response')
          const lambda = new Lambda()
          exports.handler = (event, context) => {
            const {RequestType, ResourceProperties: {FunctionName}} = event
            if (RequestType == 'Delete') return send(event, context, SUCCESS)
            lambda.publishVersion({FunctionName}, (err, {FunctionArn}) => {
              err
                ? send(event, context, FAILED, err)
                : send(event, context, SUCCESS, {FunctionArn})
            })
          }

  IAMP3F4DZ:
    Type: 'AWS::IAM::Policy'
    Properties:
      Roles:
        - !Ref iamrole
      PolicyName: CloudWatch
      PolicyDocument:
        Version: 2012-10-17
        Statement:
          - Effect: Allow
            Action:
              - 'logs:CreateLogGroup'
              - 'logs:CreateLogStream'
              - 'logs:PutLogEvents'
            Resource:
              - 'arn:aws:logs:*:*:*'

  CloudFrontOriginAccessIdentity:
    Type: 'AWS::CloudFront::CloudFrontOriginAccessIdentity'
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Ref ReactBucket
    DependsOn:
      - ReactBucket

  IAMP7EMI:
    Type: 'AWS::IAM::Policy'
    Properties:
      Roles:
        - !Ref PublishLambdaVersionRole
      PolicyName: passRole
      PolicyDocument:
        Version: 2012-10-17
        Statement:
          - Action:
              - 'iam:PassRole'
              - 'iam:CreateServiceLinkedRole'
            Effect: Allow
            Resource:
              - !GetAtt 
                - iamrole
                - Arn

  IAMP12P6X:
    Type: 'AWS::IAM::Policy'
    Properties:
      Roles:
        - !Ref PublishLambdaVersionRole
      PolicyName: AllowManagingLambdas
      PolicyDocument:
        Version: 2012-10-17
        Statement:
          - Action:
              - 'iam:CreateServiceLinkedRole'
              - 'lambda:CreateFunction'
              - 'lambda:ListTags'
              - 'lambda:TagResource'
              - 'lambda:UntagResource'
              - 'lambda:UpdateFunctionConfiguration'
              - 'lambda:GetFunction'
              - 'lambda:EnableReplication'
            Effect: Allow
            Resource:
              - '*'

Parameters:
  ReactBucketName:
    Type: String
    Default: reactbucket
  AngularBucketName:
    Type: String
    Default: angularbucket
  CodeBucket:
    Type: String

Outputs:
  ReactURL:
    Value: !GetAtt 
      - ReactBucket
      - WebsiteURL
    Description: URL for website hosted on ReactBucket
  AngularURL:
    Value: !GetAtt 
      - AngularBucket
      - WebsiteURL
    Description: URL for website hosted on AngularBucket

```
