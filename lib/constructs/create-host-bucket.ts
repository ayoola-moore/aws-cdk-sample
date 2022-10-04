import { RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import {
  BlockPublicAccess,
  BucketAccessControl,
  BucketEncryption,
  IBucket,
} from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

export default class CreateStaticHostBucket extends Construct {
  public readonly s3Bucket: IBucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    /* 
		- Destroy bucket on tear down. This is because code will be retained in git repo for free
		- Block all public access to the bucket, and make bucket private as the bucket is intended for use with cloudfront distribution
	*/
    this.s3Bucket = new s3.Bucket(this, id, {
      encryption: BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      accessControl: BucketAccessControl.PRIVATE,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });
  }
}
