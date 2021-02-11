import * as sfn from '@aws-cdk/aws-stepfunctions';
import { Stack } from '@aws-cdk/core';
import { EksDeleteFargateProfile } from '../../lib/eks/delete-fargate-profile';

//TODO add more coverage test

let stack: Stack;

beforeEach(() => {
  //GIVEN
  stack = new Stack();
});

test('default settings', () => {
  // WHEN
  const task = new EksDeleteFargateProfile(stack, 'Fargate Profile', {
    clusterName: 'clusterName',
    fargateProfileName: 'fargateProfileName',
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
          ':states:::eks:deleteFargateProfile',
        ],
      ],
    },
    End: true,
    Parameters: {
      ClusterName: 'clusterName',
      FargateProfileName: 'fargateProfileName',
    },
  });
});

test('sync integrationPattern', () => {
  // WHEN
  const task = new EksDeleteFargateProfile(stack, 'Delete', {
    integrationPattern: sfn.IntegrationPattern.RUN_JOB,
    clusterName: 'clusterName',
    fargateProfileName: 'fargateProfileName',
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
          ':states:::eks:deleteFargateProfile.sync',
        ],
      ],
    },
    End: true,
    Parameters: {
      ClusterName: 'clusterName',
      FargateProfileName: 'fargateProfileName',
    },
  });
});

test('Task throws if WAIT_FOR_TASK_TOKEN is supplied as service integration pattern', () => {
  expect(() => {
    new EksDeleteFargateProfile(stack, 'Delete', {
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
      clusterName: 'clusterName',
      fargateProfileName: 'fargateProfileName',
    });
  }).toThrow(
    /Unsupported service integration pattern. Supported Patterns: REQUEST_RESPONSE,RUN_JOB. Received: WAIT_FOR_TASK_TOKEN/,
  );
});