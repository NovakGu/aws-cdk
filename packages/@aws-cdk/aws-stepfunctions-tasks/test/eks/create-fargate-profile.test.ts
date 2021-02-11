import * as iam from '@aws-cdk/aws-iam';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { Stack } from '@aws-cdk/core';
import { EksCreateFargateProfile, FargateProfileSelector } from '../../lib/eks/create-fargate-profile';

//TODO add more coverage test

let stack: Stack;
let fargateProfileSelector: FargateProfileSelector[];
let podExecutionRole: iam.IRole;

beforeEach(() => {
  //GIVEN
  stack = new Stack();

  fargateProfileSelector = [{
    labels: { ExampleLabel: 'label' },
    namespace: 'default',
  }];

  podExecutionRole = new iam.Role(stack, 'Role', {
    assumedBy: new iam.ServicePrincipal('eks-fargate-pods.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSFargatePodExecutionRolePolicy'),
    ],
  });
});

test('default settings', () => {
  // WHEN
  const task = new EksCreateFargateProfile(stack, 'Fargate Profile', {
    fargateProfileName: 'fargateProfileName',
    clusterName: 'clusterName',
    podExecutionRole: podExecutionRole,
    selectors: fargateProfileSelector,
    clientRequestToken: 'clientRequestToken',
  });

  // THEN
  expect(stack.resolve(task.toStateJson())).toEqual({
    Type: 'Task',
    Resource: {
      'Fn::Join': [
        '',
        [
          'arn:',
          {
            Ref: 'AWS::Partition',
          },
          ':states:::eks:createFargateProfile',
        ],
      ],
    },
    End: true,
    Parameters: {
      FargateProfileName: 'fargateProfileName',
      ClusterName: 'clusterName',
      PodExecutionRoleArn: {
        'Fn::GetAtt': [
          'Role1ABCC5F0',
          'Arn',
        ],
      },
      Selectors: [
        {
          Labels: { ExampleLabel: 'label' },
          Namespace: 'default',
        },
      ],
      ClientRequestToken: 'clientRequestToken',
    },
  });
});

test('sync integrationPattern', () => {
  // WHEN
  const task = new EksCreateFargateProfile(stack, 'Create', {
    integrationPattern: sfn.IntegrationPattern.RUN_JOB,
    fargateProfileName: 'fargateProfileName',
    clusterName: 'clusterName',
    podExecutionRole: podExecutionRole,
    selectors: fargateProfileSelector,
    clientRequestToken: 'clientRequestToken',
  });

  // THEN
  expect(stack.resolve(task.toStateJson())).toEqual({
    Type: 'Task',
    Resource: {
      'Fn::Join': [
        '',
        [
          'arn:',
          {
            Ref: 'AWS::Partition',
          },
          ':states:::eks:createFargateProfile.sync',
        ],
      ],
    },
    End: true,
    Parameters: {
      FargateProfileName: 'fargateProfileName',
      ClusterName: 'clusterName',
      PodExecutionRoleArn: {
        'Fn::GetAtt': [
          'Role1ABCC5F0',
          'Arn',
        ],
      },
      Selectors: [
        {
          Labels: { ExampleLabel: 'label' },
          Namespace: 'default',
        },
      ],
      ClientRequestToken: 'clientRequestToken',
    },
  });
});

test('Task throws if WAIT_FOR_TASK_TOKEN is supplied as service integration pattern', () => {
  expect(() => {
    new EksCreateFargateProfile(stack, 'Create', {
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      fargateProfileName: 'fargateProfileName',
      clusterName: 'clusterName',
      podExecutionRole: podExecutionRole,
      selectors: fargateProfileSelector,
      clientRequestToken: 'clientRequestToken',
    });
  }).toThrow(
    /Unsupported service integration pattern. Supported Patterns: REQUEST_RESPONSE,RUN_JOB. Received: WAIT_FOR_TASK_TOKEN/,
  );
});