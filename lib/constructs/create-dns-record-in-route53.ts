import { IDistribution } from "aws-cdk-lib/aws-cloudfront";
import * as route53 from "aws-cdk-lib/aws-route53";
import { AaaaRecord, ARecord, CnameRecord } from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import isSubDomain from "../helpers/isSubDomain";

interface ICreateDNS {
  domainName: string;
  cloudFront: IDistribution;
}

export default class CreateDNS extends Construct {
  constructor(scope: Construct, id: string, props: ICreateDNS) {
    super(scope, id);

    const { domainName, cloudFront } = props;

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
    });

    new AaaaRecord(this, `_aliasRecord`, {
      zone,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(cloudFront)
      ),
    });
    
    // for apex domain, add a cname record that points for example domain.com to www.domain.com 
    isSubDomain(domainName) === false && new CnameRecord(this, `_cname`, {
      zone,
      domainName,
      recordName: `www.${domainName}`,
    })
  }
}
