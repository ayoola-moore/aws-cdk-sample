import * as ssm from "aws-cdk-lib/aws-ssm";
import { IStringParameter } from "aws-cdk-lib/aws-ssm";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

interface ICreateSsmParams {
  parameterName: string;
  stringValue: string;
  description: string;
}

export class CreateSsmParams extends Construct {
  public readonly SsmParams: IStringParameter;

  constructor(scope: Construct, id: string, props: ICreateSsmParams) {
    super(scope, id);

    const {
      parameterName,
      stringValue,
      description,
    } = props;

    this.SsmParams = new ssm.StringParameter(this, parameterName, {
      parameterName,
      stringValue,
      description,
    });
  }
}
