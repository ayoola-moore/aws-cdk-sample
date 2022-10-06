import { Stack, StackProps } from "aws-cdk-lib";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { Construct } from "constructs";
import SetupSSLCert from "../constructs/setup-domain-ssl-certificate";

export default class CreateSSL extends Stack {
  public readonly ssl: ICertificate;
  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    const {cert} = new SetupSSLCert(this, `_cert`, {
      domainName: "easytrip.mu",
	});
	  
	this.ssl = cert
  }
}
