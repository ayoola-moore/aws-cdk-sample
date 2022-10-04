#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { EasytripFrontendStack } from "../lib/easytrip-frontend-stack";

const App = new cdk.App();

new EasytripFrontendStack(App, "frontend-dev", {
  stackName: "frontend-dev",
  domainName: "dev.easytrip.mu",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1", //us-east 1 is hard-coded as a requirement for ssl certificate in AWS
  },
  deployTo: "dev",
  description: "Infrastructure for easytrip frontend dev"
});

new EasytripFrontendStack(App, "frontend-prod", {
  stackName: "frontend-prod",
  domainName: "easytrip.mu",
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1", //us-east 1 is hard-coded as a requirement for ssl certificate in AWS
  },
  deployTo: "prod",
  description: "Infrastructure for easytrip frontend prod"
});
