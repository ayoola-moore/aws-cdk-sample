import { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import * as route53 from "aws-cdk-lib/aws-route53";
import {
  ARecord,
  AaaaRecord,
  CfnRecordSet,
  CnameRecord,
} from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import isSubDomain from "../helpers/isSubDomain";

interface ICreateDNS extends IZohomailRecord {
  domainName: string;
  cloudFront: IDistribution;
}

interface IZohomailRecord {
  txtRecords?: string[]; // Useful to verify the domain
  mxRecords?: string[];
  spfRecord?: string[];
  dkimRecordName?: string;
  dkimRecordValue?: string[];
}
export default class CreateDNS extends Construct {
  constructor(scope: Construct, id: string, props: ICreateDNS) {
    super(scope, id);

    const HOSTED_ZONE_NAME = "hostedZone";

    const {
      domainName,
      cloudFront,
      txtRecords,
      mxRecords,
      dkimRecordName,
      dkimRecordValue
    } = props;

    const zone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      HOSTED_ZONE_NAME,
      {
        zoneName: domainName,
        hostedZoneId: this.node.tryGetContext("hostedZoneId"),
      }
    );

    new ARecord(this, `_aRecord`, {
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(cloudFront)
      ),
    });

    new AaaaRecord(this, `_aliasRecord`, {
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(cloudFront)
      ),
    });

    // Mx Record: Provided and required by Zohomail
    mxRecords &&
      new CfnRecordSet(this, "_mxRecords", {
        name: domainName,
        type: route53.RecordType.MX,
        hostedZoneId: zone.hostedZoneId,
        ttl: "300",
        resourceRecords: mxRecords,
      });

    // All text records who do not require a specify name and defaults to @
    txtRecords && new CfnRecordSet(this, "_textRecords", {
      name: domainName,
      type: "TXT",
      hostedZoneId: zone.hostedZoneId,
      ttl: "300",
      resourceRecords: txtRecords,
    });

    // Txt Records specifically for dkim
    dkimRecordName &&
      new CfnRecordSet(this, "dkimTxtRecord", {
        name: `${dkimRecordName}.${domainName}`,
        type: "TXT",
        hostedZoneId: zone.hostedZoneId,
        ttl: "300",
        resourceRecords: dkimRecordValue,
      });

    // for apex domain, add a cname record that points for example domain.com to www.domain.com
    isSubDomain(domainName) === false &&
      new CnameRecord(this, `_cname`, {
        zone,
        domainName,
        recordName: `www.${domainName}`,
      });
  }
}
