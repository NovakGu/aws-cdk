import * as iam from '@aws-cdk/aws-iam';
import * as sfn from '@aws-cdk/aws-stepfunctions';
import { Construct } from 'constructs';
import { integrationResourceArn, validatePatternSupported } from '../private/task-utils';

/**
 *  Properties for creating a Fargate Profile with EksCreateFargateProfile
 */
export interface EksCreateFargateProfileProps extends sfn.TaskStateBaseProps {

  /**
   * The name of the Fargate profile
   */
  readonly fargateProfileName: string;

  /**
   * The name of the Amazon EKS cluster to apply the Fargate profile to
   */
  readonly clusterName: string;

  /**
   * The Amazon Resource Name (ARN) of the pod execution role to use for pods that match the selectors in the Fargate profile
   */
  readonly podExecutionRole: iam.IRole;

  /**
   * The selectors to match for pods to use this Fargate profile
   *
   * @default - no selectors
   */
  readonly selectors?: FargateProfileSelector[];

  /**
   * Unique, case-sensitive identifier that you provide to ensure the idempotency of the request
   *
   * @default - no client request token
   */
  readonly clientRequestToken?: string;

  /**
   * The metadata to apply to the node group to assist with categorization and organization
   *
   * @default - no tags
   */
  readonly tags?: {[key: string]: string};

  /**
   * The IDs of subnets to launch your pods into.
   *
   * @default - no subnets
   */
  readonly subnets?: string[];
}

/**
 * Create a Fargate Profile as a Task
 *
 * @see https://docs.aws.amazon.com/step-functions/latest/dg/connect-eks.html
 */
export class EksCreateFargateProfile extends sfn.TaskStateBase {

  private static readonly SUPPORTED_INTEGRATION_PATTERNS: sfn.IntegrationPattern[] = [
    sfn.IntegrationPattern.REQUEST_RESPONSE,
    sfn.IntegrationPattern.RUN_JOB,
  ];

  protected readonly taskMetrics?: sfn.TaskMetricsConfig;
  protected readonly taskPolicies?: iam.PolicyStatement[];

  private readonly integrationPattern: sfn.IntegrationPattern;

  constructor(scope: Construct, id: string, private readonly props: EksCreateFargateProfileProps) {
    super(scope, id, props);
    this.integrationPattern = props.integrationPattern ?? sfn.IntegrationPattern.REQUEST_RESPONSE;

    validatePatternSupported(this.integrationPattern, EksCreateFargateProfile.SUPPORTED_INTEGRATION_PATTERNS);

    let iamActions: string[] | undefined;
    if (this.integrationPattern === sfn.IntegrationPattern.REQUEST_RESPONSE) {
      iamActions = ['eks:CreateFargateProfile'];
    } else if (this.integrationPattern === sfn.IntegrationPattern.RUN_JOB) {
      iamActions = [
        'eks:CreateFargateProfile',
        'eks:DescribeFargateProfile',
        'eks:DeleteFargateProfile',
      ];
    }

    this.taskPolicies = [
      new iam.PolicyStatement({
        resources: ['*'],
        actions: iamActions,
      }),
      new iam.PolicyStatement({
        resources: ['*'],
        actions: ['iam:GetRole'],
      }),
      new iam.PolicyStatement({
        resources: [this.props.podExecutionRole.roleArn],
        actions: ['iam:PassRole'],
        conditions: {
          StringEqualsIfExists: {
            'iam:PassedToService': [
              'eks.amazonaws.com',
            ],
          },
        },
      }),
    ];
  }

  /**
   * Provides the EKS Create NodeGroup service integration task configuration
   *
   * @internal
   */
  protected _renderTask(): any {
    const selectors: object[] = [];
    this.props.selectors?.forEach(fargateProfileSelector => selectors.push({
      Namespace: fargateProfileSelector.namespace,
      Labels: fargateProfileSelector.labels,
    }));
    return {
      Resource: integrationResourceArn('eks', 'createFargateProfile', this.integrationPattern),
      Parameters: sfn.FieldUtils.renderObject({
        FargateProfileName: this.props.fargateProfileName,
        ClusterName: this.props.clusterName,
        PodExecutionRoleArn: this.props.podExecutionRole.roleArn,
        ...(this.props.selectors ? {
          Selectors: selectors,
        } : undefined ),
        Subnets: this.props.subnets,
        ClientRequestToken: this.props.clientRequestToken,
        Tags: this.props.tags,
      }),
    };
  }
}

/**
 * An object representing an AWS Fargate profile selector.
 */
export interface FargateProfileSelector {

  /**
   * The Kubernetes labels that the selector should match
   * @default - no labels
   */
  readonly labels?: {[key: string]: string};

  /**
   * Flag for log type exports of its control plane logs to CloudWatch Logs
   * @default - no namespace
   */
  readonly namespace?: string;
}

