The project is built with the help of aws cdk. The aim is to have all our AWS infrastructure provision programmatically and therefore easy to replicate

### domain info
Easytrip.mu is registered with cloud.mu and points to route53 via nameservers. 

### Some manual configuration/Intervention are required. They include
- Managing redundant certificates from certificate manager eg deletion
- Managing WAF ipset for developers. 

### Resources that a retained during tear down
- WAF Ipset
- 


The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

* `npm run test`    perform the jest unit tests (To Implement)
* `cdk deploy --all`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template


project author: Ayoola O. (For easytripm.mu)
