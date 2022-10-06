import { CfnOutput } from "aws-cdk-lib";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import {
  HttpVersion,
  IDistribution,
  OriginAccessIdentity,
  PriceClass,
} from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";
import { IBucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import isSubDomain from "../helpers/isSubDomain";
import { CreateSsmParams } from "./create-ssm-parameter";

interface ICreateCloudfrontDistributionFromS3 {
  readonly s3Bucket: IBucket;
  readonly cfdBucketPath: string;
  readonly cert: ICertificate;
  readonly domainName: string;
  readonly webAclId?: string;
}

export default class CreateCloudfrontDistributionFromS3 extends Construct {
  public readonly cloudFront: IDistribution;
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

    const aliases = isSubDomain(domainName)
      ? [domainName]
      : [`www.${domainName}`, domainName];

    this.cloudFront = new cloudfront.Distribution(this, id, {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket, {
          originPath: cfdBucketPath,
        }),
      },
      certificate: cert,
      domainNames: aliases,
      comment: "CDK Cloudfront Secure S3",
      defaultRootObject: ROOT_INDEX_FILE,
      httpVersion: HttpVersion.HTTP2,
      webAclId: webAclId,
      priceClass: PriceClass.PRICE_CLASS_ALL,
      enableLogging: true,
      logFilePrefix: "cloudfront-",
    });

    const [cfdBuckName, cfdBuckPath, cfdUrl, cfdID] = [
      `${id}-bucketName`,
      `${id}-bucketPath`,
      `${id}-cfdUrl`,
      `${id}-cfdID`,
    ];

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
      description: `SSM parameter key for ${id}`,
    });
  }
}
