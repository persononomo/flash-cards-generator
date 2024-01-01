import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins';
import {getTags} from '../helpers';
import {Certificate} from "aws-cdk-lib/aws-certificatemanager";

interface StackParams {
    env: object;
}

export class UiContentStack extends cdk.Stack {
    _cloudfrontUIDistribution: string
    _contentUIS3Bucket: string
    _contentDomainName: string

    constructor(app: cdk.App, stackId: string, props: StackParams) {
        super(app, stackId, {
            env: props.env,
            tags: getTags(stackId),
        });

        let bucketName = `flash-cards-generator-ui`
        let subdomainName = `flashcard-generator`
        let allowedOrigins = `https://${subdomainName}.kozub.dev`;

        const corsRule = {
            allowedHeaders: ['*'],
            allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.HEAD],
            allowedOrigins: [allowedOrigins],
            exposeHeaders: [],
        };
        const bucket = new s3.Bucket(this, `${bucketName}-bucket`, {
            bucketName: bucketName,
            accessControl: s3.BucketAccessControl.PRIVATE,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            cors: [corsRule],
        });

        //Create Cloudfront function
        const handler = new cloudfront.Function(this, `flash-cards-generator-cf-handler`, {
            functionName: `flash-cards-generator-cloudfront-handler`,
            code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
    var response = event.response;
    var headers = response.headers;

    // Add the security headers to the response
    headers['strict-transport-security'] = {value: 'max-age=31536000; includeSubDomains; preload'};
    headers['x-frame-options'] = {value: 'DENY'};
    headers['x-content-type-options'] = {value: 'nosniff'};
    headers['x-xss-protection'] = {value: '1; mode=block'};
    headers['x-download-options'] = {value: 'noopen'};
    headers['x-permitted-cross-domain-policies'] = {value: 'none'};
    headers['referrer-policy'] = {value: 'strict-origin-when-cross-origin'};
    headers['expect-ct'] = {value: 'enforce, max-age=86400'};
    headers['content-security-policy'] = {value: "" +
            "default-src 'self'; " +
            "base-uri 'self'; " +
            "block-all-mixed-content; " +
            "font-src 'self' data:; " +
            "form-action 'self'; " +
            "frame-ancestors 'none'; " +
            "script-src 'self' 'unsafe-eval'; " +
            "img-src 'self' *.kozub.dev data:; " +
            "child-src *.kozub.dev; " +
            "style-src 'self' 'unsafe-inline'; " +
            "connect-src 'self' *.kozub.dev; " +
            "frame-src *.kozub.dev; " +
            "media-src 'self';"
    };
    return response;
}`)
        })

        let origin = new cloudfront_origins.S3Origin(bucket)
        const iCertificate = Certificate.fromCertificateArn(this, 'certificate', 'arn:aws:acm:us-east-1:123260218585:certificate/38bc94fa-e443-458e-8c4f-9d987c4be8ed');

        // Create a CloudFront Distribution
        const distribution = new cloudfront.Distribution(this, `${bucketName}-distribution`, {
            errorResponses: [
                {
                    httpStatus: 404,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(30)
                },
                {
                    httpStatus: 403,
                    responseHttpStatus: 200,
                    responsePagePath: '/index.html',
                    ttl: cdk.Duration.minutes(30)
                }
            ],
            domainNames: [`${subdomainName}.kozub.dev`],
            certificate: iCertificate,
            defaultBehavior: {
                origin: origin,
                cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
                originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                functionAssociations: [{
                    function: handler,
                    eventType: cloudfront.FunctionEventType.VIEWER_RESPONSE
                }]
            },
            defaultRootObject: 'index.html',
        });

        // create route53 record for bucket
        const iHostedZone = route53.HostedZone.fromHostedZoneAttributes(this, `${bucketName}-hosted-zone`, {
            hostedZoneId: "Z00924393AKCVD9EB7FPB",
            zoneName: "kozub.dev"
        });
        let cloudfrontTarget = new route53Targets.CloudFrontTarget(distribution);
        let recordTarget = route53.RecordTarget.fromAlias(cloudfrontTarget);
        new route53.ARecord(this, `${bucketName}-record`, {
            recordName: subdomainName,
            zone: iHostedZone,
            target: recordTarget,
        });

        this._contentUIS3Bucket = bucket.bucketName
        this._cloudfrontUIDistribution = distribution.distributionId
        this._contentDomainName = `${subdomainName}.kozub.dev`
    }
}