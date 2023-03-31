import * as acm from "aws-cdk-lib/aws-certificatemanager";
import {
  CertificateValidation,
  ICertificate,
} from "aws-cdk-lib/aws-certificatemanager";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import isSubDomain from "../helpers/isSubDomain";

interface ISetupSSLCert {
  // TODO Investigate why the below validation isn't working
  /* @TJS-format hostname */
  readonly domainName: string;
}

export default class SetupSSLCert extends Construct {
  public readonly cert: ICertificate;
  constructor(scope: Construct, id: string, props: ISetupSSLCert) {
    super(scope, id);

    const { domainName } = props;

    // initial zone
    const zone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      "hostedZone",
      {
        zoneName: domainName,
        hostedZoneId: this.node.tryGetContext("hostedZoneId"),
      }
    );

    // construct alternate names
    const subjectAlternativeNames = isSubDomain(domainName)
      ? [domainName]
      : [`www.${domainName}`, `*.${domainName}`];
    
    // initialize and validate domain automatically
    this.cert = new acm.Certificate(this, `easytrip-mu-webCert`, {
      domainName,
      subjectAlternativeNames,
      validation: CertificateValidation.fromDns(zone),
    });
  }
}
