import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import * as cdk from '@aws-cdk/core';
import { EksCreateFargateProfile, EksDeleteFargateProfile, EksCreateCluster, FargateProfileSelector } from '../../lib';

/*
 * Create a state machine with a task state to create a cluster and create a fargate profile, and then delete the profile
 *
 * Stack verification steps:
 * The generated State Machine can be executed from the CLI (or Step Functions console)
 * and runs with an execution status of `Succeeded`.
 *
 * Stack verification steps:
 * aws stepfunctions start-execution --state-machine-arn <deployed state machine arn> : should return execution arn
 * aws stepfunctions describe-execution --execution-arn <exection-arn generated before> : should return status as SUCCEEDED and a query-execution-id
 * -- aws eks describe-fargate-profile --cluster-name <value> --fargate-profile-name <value> : should return status of Fargate Profile
 * -- aws eks list-fargate-profile --cluster-name <value> --fargate-profile-name <value> : should not return Fargate Profile
 */


const app = new cdk.App();
const stack = new cdk.Stack(app, 'aws-stepfunctions-tasks-eks-delete-fargate-profile-integ', {
  env: {
    account: process.env.CDK_INTEG_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_INTEG_REGION || process.env.CDK_DEFAULT_REGION,
  },
});

const vpc = new ec2.Vpc(stack, 'eks', {
  subnetConfiguration: [
    {
      cidrMask: 24,
      name: 'ingress',
      subnetType: ec2.SubnetType.PUBLIC,
    },
    {
      cidrMask: 24,
      name: 'application',
      subnetType: ec2.SubnetType.PRIVATE,
    },
  ],
});

const eksRole = new iam.Role(stack, 'eksRole', {
  assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSWorkerNodePolicy'),
    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKS_CNI_Policy'),
  ],
});

const podExecutionRole = new iam.Role(stack, 'podExecutionRole', {
  assumedBy: new iam.ServicePrincipal('eks-fargate-pods.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSFargatePodExecutionRolePolicy'),
  ],
});

const fargateProfileSelector : FargateProfileSelector = {
  namespace: 'default',
  labels: { 'my-ExampleLabel': 'ExampleValue' },
};

const createClusterJob = new EksCreateCluster(stack, 'Create a Cluster', {
  integrationPattern: sfn.IntegrationPattern.RUN_JOB,
  clusterName: 'myEksCluster',
  eksRole: eksRole,
  vpc: vpc,
  kubernetesVersion: eks.KubernetesVersion.V1_18,
});

const createFargateProfileJob = new EksCreateFargateProfile(stack, 'Create a Fargate Profile', {
  integrationPattern: sfn.IntegrationPattern.RUN_JOB,
  fargateProfileName: 'fargateProfileName',
  clusterName: 'myEksCluster',
  podExecutionRole: podExecutionRole,
  selectors: [fargateProfileSelector],
});

const deleteFargateProfileJob = new EksDeleteFargateProfile(stack, 'Delete a Fargate Profile', {
  clusterName: 'myEksCluster',
  fargateProfileName: 'fargateProfileName',
});


const chain = sfn.Chain.start(createClusterJob).next(createFargateProfileJob).next(deleteFargateProfileJob);

const sm = new sfn.StateMachine(stack, 'StateMachine', {
  definition: chain,
  timeout: cdk.Duration.seconds(1200),
});

new cdk.CfnOutput(stack, 'stateMachineArn', {
  value: sm.stateMachineArn,
});


app.synth();
