import * as eks from '@aws-cdk/aws-eks';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { Stack } from '@aws-cdk/core';
import { EksDeleteCluster } from '../../lib/eks/delete-cluster';

let stack: Stack;
let cluster: eks.Cluster;

beforeEach(() => {
  //GIVEN
  stack = new Stack();
  cluster = new eks.Cluster(stack, 'Cluster', {
    version: eks.KubernetesVersion.V1_18,
    clusterName: 'eksCluster',
  });
});

test('DeleteCluster with request response pattern', () => {
  // WHEN
  const task = new EksDeleteCluster(stack, 'Delete Cluster', {
    cluster: cluster,
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
          ':states:::eks:deleteCluster',
        ],
      ],
    },
    End: true,
    Parameters: {
      Name: {
        Ref: 'Cluster9EE0221C',
      },
    },
  });
});


test('DeleteCluster with run a job pattern', () => {
  // WHEN
  const task = new EksDeleteCluster(stack, 'Delete Cluster', {
    integrationPattern: sfn.IntegrationPattern.RUN_JOB,
    cluster: cluster,
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
          ':states:::eks:deleteCluster.sync',
        ],
      ],
    },
    End: true,
    Parameters: {
      Name: {
        Ref: 'Cluster9EE0221C',
      },
    },
  });
});

test('Task throws if WAIT_FOR_TASK_TOKEN is supplied as service integration pattern', () => {
  expect(() => {
    new EksDeleteCluster(stack, 'Create Cluster', {
      cluster: cluster,
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    });
  }).toThrow(
    /Unsupported service integration pattern. Supported Patterns: REQUEST_RESPONSE,RUN_JOB. Received: WAIT_FOR_TASK_TOKEN/,
  );
});
