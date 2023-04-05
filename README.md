The project is built with the help of aws cdk. The aim is to have all our AWS infrastructure provision programmatically and therefore easy to replicate

### domain info
Easytrip.mu is registered with cloud.mu and points to route53 via nameservers. 

### Some manual configuration/Intervention are required. They include
- Managing host zone via Route53. Since the domain is currently managed via Route53. The app required a hostZoneId which is a done passed via context.

- Managing WAF ipset for developers. This is done seperately from the cdk stack. The ipset arn is passed via cdk context. This is done in order to preserve the list of IPs during a tear or a rebuild process 


The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run test`    perform the jest unit tests (To Implement)
* `npm run deploy`      deploy this stack to your default AWS account/region. (Remember to redeploy code to the newly created infrastructure, usually this can be done by re-running the pipeline which should be linked to the infrastructure)
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template



project author: Ayoola O. (For easytrip.mu)
