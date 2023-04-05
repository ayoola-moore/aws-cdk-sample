import { Stack, StackProps } from "aws-cdk-lib";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";
import CreateCloudfrontDistributionFromS3 from "./constructs/create-cloudfront-distribution";
import CreateDNS from "./constructs/create-dns-record-in-route53";
import CreateStaticHostBucket from "./constructs/create-host-bucket";
import SetIpRestrictionWithWAF from "./constructs/setup-firewall-for-ip-restrictions";

interface IEasytripInfrastructureStack extends StackProps {
  domainName: string;
  deployTo: string;
  cert: ICertificate;
}
export class EasytripFrontendStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: IEasytripInfrastructureStack
  ) {
    super(scope, id, props);

    const { domainName, deployTo, cert } = props;

    // set up s3 bucket
    const { s3Bucket } = new CreateStaticHostBucket(this, `easytrip-mu-bucket`);

    if (deployTo === "dev") {
      // set up Ip restriction using AWS WAF
      const { WAF } = new SetIpRestrictionWithWAF(this, `easytrip-mu-waf`, {
        ipSetId: `ipSet`,
        webAclId: `webAcl`,
        description:
          "These set of ips will be granted access to staging endpoint. This strategy is adopted to prevent unathorised access",
      });

      // set up cloudfront
      const { cloudFront } = new CreateCloudfrontDistributionFromS3(
        this,
        `easytrip-mu-dev-cfd` /* ⚠️ apply caution if refactoring. The name is used in ssm parameter as a dependency */,
        {
          s3Bucket,
          cfdBucketPath: "dev",
          cert,
          domainName,
          webAclId: WAF.attrArn,
        }
      );

      // set route53
      new CreateDNS(this, "dns-dev", {
        domainName,
        cloudFront,
      });
    }

    if (deployTo === "prod") {
      // set up cloudfront
      const { cloudFront } = new CreateCloudfrontDistributionFromS3(
        this,
        `easytrip-mu-prod-cfd` /* ⚠️ apply caution if refactoring. The name is used in ssm parameter as a dependency */,
        {
          s3Bucket,
          cfdBucketPath: "prod",
          cert,
          domainName,
        }
      );

      // set route53
      new CreateDNS(this, "dns-prod", {
        domainName,
        cloudFront,
        txtRecords: [
          '"zoho-verification=zb27735349.zmverify.zoho.com"',
          '"v=spf1 include:zoho.com ~all"',
        ], // All @ txt records
        mxRecords: ["10 mx.zoho.com", "20 mx2.zoho.com", "50 mx3.zoho.com"],
        dkimRecordName: "zmail._domainkey",
        dkimRecordValue: [
          '"v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCYX25mkD4G4YRCqGQ+g8Qkcgmc5ET5RU4g/kQgjkhfzTysBgniAfykev3pclzc91pnRTn3fOvMTIwOimlTFl9NcMhoCiSp+RUJZgH9fiVdo6KuAWKsqyLykWdzMI3KBOejT6cBxKdcvPwFau+v+K7ZnhHnbksAn5H9kMGD+lYHuwIDAQAB"',
        ]
      });
    }
  }
}
