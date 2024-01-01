import * as cdk from 'aws-cdk-lib';
import {
    Effect,
    PolicyDocument,
    PolicyStatement,
    Role,
    OpenIdConnectProvider, WebIdentityPrincipal
} from "aws-cdk-lib/aws-iam";
import {getTags} from "../helpers";


interface StackParams {
    env: object
}

export class IamStack extends cdk.Stack {

    constructor(app: cdk.App, stackId: string, params: StackParams) {
        super(app, stackId, {env: params.env, tags: getTags(stackId)});

        //openid connect provider
        let oidcProviderArn = 'arn:aws:iam::123260218585:oidc-provider/token.actions.githubusercontent.com'
        let githubOpenIdConnectProvider = OpenIdConnectProvider.fromOpenIdConnectProviderArn(this, 'oidc-provider', oidcProviderArn);

        const repoName = 'persononomo/flash-cards-generator'

        // deploy role
        new Role(this, `flash-cards-deploy-role`, {
            roleName: `flash-cards-deploy-role`,
            assumedBy: new WebIdentityPrincipal(
                githubOpenIdConnectProvider.openIdConnectProviderArn,
                {
                    'StringEquals': {
                        'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com'
                    },
                    'StringLike': {
                        'token.actions.githubusercontent.com:sub': `repo:${repoName}:*`
                    }
                }),
            inlinePolicies: {
                'policy': new PolicyDocument({
                    statements: [
                        new PolicyStatement({
                            effect: Effect.ALLOW,
                            actions: [
                                "cloudformation:*",
                                "lambda:*",
                                "apigateway:*",
                                "s3:*",
                                "logs:*",
                                "events:*",
                                "iam:CreateRole",
                                "iam:AttachRolePolicy",
                                "iam:PutRolePolicy",
                                "iam:PassRole",
                                "iam:GetRole",
                                "acm:ListCertificates",
                                "cloudfront:UpdateDistribution",
                                "route53:ListHostedZones",
                                "route53:ChangeResourceRecordSets"
                            ],
                            resources: ["*"]
                        })
                    ],
                }),
            }
        });
    }
}
