#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EasytripFrontendStack } from "../lib/easytrip-frontend-stack";
import CreateSSL from "../lib/shared-ssl-stack";

const App = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: "us-east-1", //us-east 1 is hard-coded as a requirement for ssl certificate in AWS
};

const domainName = `easytrip.mu`

const { ssl } = new CreateSSL(App, "share-cert", {
  stackName: "shared-ssl",
  env,
  domainName: domainName
});

new EasytripFrontendStack(App, "frontend-dev", {
  stackName: "frontend-dev",
  domainName: `***redacted.${domainName}`,
  cert: ssl,
  env,
  deployTo: "dev",
  description: "Infrastructure for easytrip frontend dev",
});

new EasytripFrontendStack(App, "frontend-prod", {
  stackName: "frontend-prod",
  domainName,
  cert: ssl,
  env,
  deployTo: "prod",
  description: "Infrastructure for easytrip frontend prod",
});
