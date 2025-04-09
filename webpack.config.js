const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
    const config = await createExpoWebpackConfigAsync(env, argv);

    // Add the alias
    config.resolve.alias = {
        ...(config.resolve.alias || {}),
        '../Utilities/Platform': 'react-native-web/dist/exports/Platform',
    };

    return config;
};