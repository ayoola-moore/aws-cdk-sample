import { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import * as route53 from "aws-cdk-lib/aws-route53";
import {
  AaaaRecord,
  ARecord,
  CnameRecord,
  IHostedZone,
} from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";

interface ICreateDNS {
  domainName: string;
  cloudFront: IDistribution;
}

export default class CreateDNS extends Construct {
  public readonly dns: IHostedZone;

  constructor(scope: Construct, id: string, props: ICreateDNS) {
    super(scope, id);

    const { domainName, cloudFront } = props;

    this.dns = new route53.HostedZone(this, id, {
      zoneName: domainName,
    });

    const zone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "hostedZone",
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
      deleteExisting: false,
      recordName: domainName,
    });

    new AaaaRecord(this, `_aliasRecord`, {
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(cloudFront)
      ),
      deleteExisting: false,
      recordName:
        domainName.split(".").length > 2 ? domainName : `www.${domainName}`,
    });

  }
}
