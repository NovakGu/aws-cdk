import * as ec2 from '@aws-cdk/aws-ec2';
import * as eks from '@aws-cdk/aws-eks';
import * as iam from '@aws-cdk/aws-iam';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { Stack } from '@aws-cdk/core';
import { ClusterLogging, EksCreateCluster, EncryptionConfig, LoggingOptions } from '../../lib/eks/create-cluster';

let stack: Stack;
let encryptionConfiguration: EncryptionConfig;
let vpc: ec2.Vpc;
let eksRole: iam.IRole;

beforeEach(() => {
  //GIVEN
  stack = new Stack();
  encryptionConfiguration = {
    resources: ['resources'],
    provider: {
      keyArn: 'keyArn',
    },
  };
  vpc = new ec2.Vpc(stack, 'vpc');
  eksRole = new iam.Role(stack, 'Role', {
    assumedBy: new iam.ServicePrincipal('eks.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEKSClusterPolicy'),
    ],
  });

  new ec2.SecurityGroup(stack, 'ControlPlaneSecurityGroup', {
    vpc: vpc,
    description: 'EKS Control Plane Security Group',
  });
});

test('CreateCluster with request response pattern', () => {
  // WHEN
  const task = new EksCreateCluster(stack, 'Create Cluster', {
    clusterName: 'clusterName',
    eksRole: eksRole,
    vpc: vpc,
    publicCidrs: ['0.0.0.0/4'],
    clientRequestToken: 'clientRequestToken',
    kubernetesVersion: eks.KubernetesVersion.V1_18,
    encryptionConfig: [encryptionConfiguration],
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
          ':states:::eks:createCluster',
        ],
      ],
    },
    End: true,
    Parameters: {
      Name: 'clusterName',
      RoleArn: {
        'Fn::GetAtt': [
          'Role1ABCC5F0',
          'Arn',
        ],
      },
      ResourcesVpcConfig: {
        SubnetIds: [
          { Ref: 'vpcPublicSubnet1Subnet2E65531E' },
          { Ref: 'vpcPublicSubnet2Subnet009B674F' },
          { Ref: 'vpcPrivateSubnet1Subnet934893E8' },
          { Ref: 'vpcPrivateSubnet2Subnet7031C2BA' },
        ],
        SecurityGroupIds: [{
          'Fn::GetAtt': ['CreateClusterControlPlaneSecurityGroupF810968F', 'GroupId'],
        }],
        EndpointPrivateAccess: false,
        EndpointPublicAccess: true,
        PublicAccessCidrs: [{ 0: '0.0.0.0/4' }],
      },
      ClientRequestToken: 'clientRequestToken',
      EncryptionConfig: [encryptionConfiguration],
      Version: '1.18',
    },
  });
});

test('CreateCluster with request response pattern with logging enabled', () => {
  // GIVEN
  const clusterLogging : ClusterLogging = {
    enabled: true,
    types: ['api'],
  };
  const loggingOptions : LoggingOptions = {
    clusterLoggingList: [clusterLogging],
  };
  // WHEN
  const task = new EksCreateCluster(stack, 'Create Cluster', {
    clusterName: 'clusterName',
    eksRole: eksRole,
    vpc: vpc,
    publicCidrs: ['0.0.0.0/4'],
    clientRequestToken: 'clientRequestToken',
    kubernetesVersion: eks.KubernetesVersion.V1_18,
    encryptionConfig: [encryptionConfiguration],
    loggingConfiguration: loggingOptions,
  });
  // TODO adjust THEN for added logging config
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
          ':states:::eks:createCluster',
        ],
      ],
    },
    End: true,
    Parameters: {
      Name: 'clusterName',
      Logging: {
        ClusterLogging: [
          {
            enabled: true,
            types: ['api'],
          },
        ],
      },
      RoleArn: {
        'Fn::GetAtt': [
          'Role1ABCC5F0',
          'Arn',
        ],
      },
      ResourcesVpcConfig: {
        SubnetIds: [
          { Ref: 'vpcPublicSubnet1Subnet2E65531E' },
          { Ref: 'vpcPublicSubnet2Subnet009B674F' },
          { Ref: 'vpcPrivateSubnet1Subnet934893E8' },
          { Ref: 'vpcPrivateSubnet2Subnet7031C2BA' },
        ],
        SecurityGroupIds: [{
          'Fn::GetAtt': ['CreateClusterControlPlaneSecurityGroupF810968F', 'GroupId'],
        }],
        EndpointPrivateAccess: false,
        EndpointPublicAccess: true,
        PublicAccessCidrs: [{ 0: '0.0.0.0/4' }],
      },
      ClientRequestToken: 'clientRequestToken',
      EncryptionConfig: [encryptionConfiguration],
      Version: '1.18',
    },
  });
});

test('CreateCluster with run a job pattern', () => {
  // WHEN
  const task = new EksCreateCluster(stack, 'Create Cluster', {
    integrationPattern: sfn.IntegrationPattern.RUN_JOB,
    clusterName: 'clusterName',
    eksRole: eksRole,
    vpc: vpc,
    publicCidrs: ['0.0.0.0/4'],
    clientRequestToken: 'clientRequestToken',
    kubernetesVersion: eks.KubernetesVersion.V1_18,
    encryptionConfig: [encryptionConfiguration],
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
          ':states:::eks:createCluster.sync',
        ],
      ],
    },
    End: true,
    Parameters: {
      Name: 'clusterName',
      RoleArn: {
        'Fn::GetAtt': [
          'Role1ABCC5F0',
          'Arn',
        ],
      },
      ResourcesVpcConfig: {
        SubnetIds: [
          { Ref: 'vpcPublicSubnet1Subnet2E65531E' },
          { Ref: 'vpcPublicSubnet2Subnet009B674F' },
          { Ref: 'vpcPrivateSubnet1Subnet934893E8' },
          { Ref: 'vpcPrivateSubnet2Subnet7031C2BA' },
        ],
        SecurityGroupIds: [{
          'Fn::GetAtt': ['CreateClusterControlPlaneSecurityGroupF810968F', 'GroupId'],
        }],
        EndpointPrivateAccess: false,
        EndpointPublicAccess: true,
        PublicAccessCidrs: [{ 0: '0.0.0.0/4' }],
      },
      ClientRequestToken: 'clientRequestToken',
      EncryptionConfig: [encryptionConfiguration],
      Version: '1.18',
    },
  });
});

test('Task throws if WAIT_FOR_TASK_TOKEN is supplied as service integration pattern', () => {
  expect(() => {
    new EksCreateCluster(stack, 'Create Cluster', {
      clusterName: 'clusterName',
      eksRole: eksRole,
      vpc: vpc,
      publicCidrs: ['0.0.0.0/4'],
      clientRequestToken: 'clientRequestToken',
      kubernetesVersion: eks.KubernetesVersion.V1_18,
      encryptionConfig: [encryptionConfiguration],
      integrationPattern: sfn.IntegrationPattern.WAIT_FOR_TASK_TOKEN,
    });
  }).toThrow(
    /Unsupported service integration pattern. Supported Patterns: REQUEST_RESPONSE,RUN_JOB. Received: WAIT_FOR_TASK_TOKEN/,
  );
});
