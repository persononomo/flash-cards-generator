export const getEnv = () => process.env.DEPLOY_ENV || "dev";

export const getTags = (stackId: string) => ({
    environment: getEnv(),
    stack: stackId,
    createdBy: 'cdk',
    project: 'persononomo',
});

