import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import { Construct } from "constructs";

interface ISetIpRestrictionWithWAF {
  ipSetId: string;
  webAclId: string;
  description?: string;
}

/* Block all ips by default and only allow enlisted ips */
export default class SetIpRestrictionWithWAF extends Construct {
  public readonly WAF: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: ISetIpRestrictionWithWAF) {
    super(scope, id);

    const { ipSetId, webAclId } = props;

    // get Ipset arn
    const arn = this.node.tryGetContext("IpsetArn");

    this.WAF = new wafv2.CfnWebACL(this, webAclId, {
      defaultAction: {
        allow: {},
      },
      description: `Allow IP addresses specify in ${id} to access cloudfront`,
      scope: "CLOUDFRONT",
      visibilityConfig: {
        cloudWatchMetricsEnabled: false,
        metricName: `${webAclId}-metric`,
        sampledRequestsEnabled: false,
      },
      rules: [
        {
          name: `${ipSetId}-block-ips`,
          priority: 0,
          statement: {
            notStatement: {
              statement: {
                ipSetReferenceStatement: {
                  arn,
                },
              },
            },
          },
          action: {
            block: {
              customResponse: {
                responseCode: 403,
              },
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: false,
            cloudWatchMetricsEnabled: false,
            metricName: `${ipSetId}-metric`,
          },
        },
      ],
    });
  }
}
