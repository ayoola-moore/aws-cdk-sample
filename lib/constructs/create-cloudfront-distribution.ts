import { CfnOutput } from "aws-cdk-lib";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import {
  HttpVersion,
  IDistribution,
  OriginAccessIdentity,
  PriceClass,
  ViewerCertificate,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { CreateSsmParams } from "./create-ssm-parameter";

interface ICreateCloudfrontDistributionFromS3 {
  readonly s3Bucket: IBucket;
  readonly cfdBucketPath: string;
  readonly cert: ICertificate;
  readonly domainName: string;
  readonly webAclId?: string;
}

export default class CreateCloudfrontDistributionFromS3 extends Construct {
  public readonly cloudFront: IDistribution
  constructor(
    scope: Construct,
    id: string,
    props: ICreateCloudfrontDistributionFromS3
  ) {
    super(scope, id);

    const { cert, s3Bucket, domainName, webAclId, cfdBucketPath } = props;

    // provision s3 resource
    const accessIdentity = new OriginAccessIdentity(this, "CloudfrontAccess");
    const cloudfrontUserAccessPolicy = new PolicyStatement();
    cloudfrontUserAccessPolicy.addActions("s3:GetObject");
    cloudfrontUserAccessPolicy.addPrincipals(accessIdentity.grantPrincipal);
    cloudfrontUserAccessPolicy.addResources(s3Bucket.arnForObjects("*"));
    s3Bucket.addToResourcePolicy(cloudfrontUserAccessPolicy);

    const ROOT_INDEX_FILE = "index.html";

    this.cloudFront = new cloudfront.CloudFrontWebDistribution(this, id, {
      comment: "CDK Cloudfront Secure S3",
      viewerCertificate: ViewerCertificate.fromAcmCertificate(cert, {
        aliases: [domainName, `www.${domainName}`],
      }),
      defaultRootObject: ROOT_INDEX_FILE,
      viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      httpVersion: HttpVersion.HTTP2,
      webACLId: webAclId,
      priceClass: PriceClass.PRICE_CLASS_100, // the cheapest
      originConfigs: [
        {
          s3OriginSource: {
            originAccessIdentity: accessIdentity,
            s3BucketSource: s3Bucket,
            originPath: `/${cfdBucketPath}`,
          },
          behaviors: [
            {
              compress: true,
              isDefaultBehavior: true,
            },
          ],
        },
      ],
      // Allows React to handle all errors internally
      errorConfigurations: [
        {
          errorCachingMinTtl: 300, // in seconds
          errorCode: 403,
          responseCode: 200,
          responsePagePath: `/${ROOT_INDEX_FILE}`,
        },
        {
          errorCachingMinTtl: 300, // in seconds
          errorCode: 404,
          responseCode: 200,
          responsePagePath: `/${ROOT_INDEX_FILE}`,
        },
      ],
    });

    (this.cloudFront.node.defaultChild as cloudfront.CfnDistribution).overrideLogicalId('cfDistOverridenId')

    const [cfdBuckName, cfdBuckPath, cfdUrl, cfdID] = [`${id}-bucketName`, `${id}-bucketPath` ,`${id}-cfdUrl`, `${id}-cfdID`];

    /* Initialize ssm parameter to store output values. This has a couple of use cases eg. To be used with gitlab ci  */
    new CreateSsmParams(this, cfdBuckName, {
      parameterName: cfdBuckName,
      stringValue: s3Bucket.bucketName,
      description: `s3 bucket name for ${id}`,
    });
    
    new CreateSsmParams(this, cfdBuckPath, {
      parameterName: cfdBuckPath,
      stringValue: cfdBucketPath,
      description: `s3 bucket name for ${id}`,
    });

    new CreateSsmParams(this, cfdUrl, {
      parameterName: cfdUrl,
      stringValue: this.cloudFront.distributionDomainName,
      description: `Cloudfront URL for ${id} eg something.cloudfront.net`,
    });

    new CreateSsmParams(this, cfdID, {
      parameterName: cfdID,
      stringValue: this.cloudFront.distributionId,
      description: `Cloudfront distribution ID for ${id}`,
    });

    new CfnOutput(this, `cfnOutput-${id}`, {
      value: JSON.stringify({ cfdBuckName, cfdUrl, cfdID }),
      description: `SSM parameter key for ${id}`
    })

  }
}
