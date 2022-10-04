import * as acm from "aws-cdk-lib/aws-certificatemanager";
import {
  CertificateValidation,
  ICertificate,
} from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";

interface ISetupSSLCert {
  // TODO Investigate why the below validation isn't working
  /* @TJS-format hostname */
  readonly domainName: string;
}

export default class SetupSSLCert extends Construct {
  public readonly cert: ICertificate;
  constructor(scope: Construct, id: string, props: ISetupSSLCert) {
    super(scope, id);
    this.cert = new acm.Certificate(
      this,
      `easytrip-mu-webCert`,
      {
        domainName: props.domainName,
        validation: CertificateValidation.fromDns(),
      }
    );
  }
}
