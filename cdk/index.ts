import * as cdk from 'aws-cdk-lib';

import {UiContentStack} from './src/stacks/ui-content-stack';
import {IamStack} from "./src/stacks/iam-stack";


const account = '123260218585';
const envNorthVirginia = {account: account, region: 'us-east-1'};


const app = new cdk.App();


// UI stacks
new UiContentStack(app, `ui-content-stack`, {
    env: envNorthVirginia,
});

// IamStack
new IamStack(app, `iam-stack`, {
    env: envNorthVirginia,
});

app.synth();