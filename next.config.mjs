import webpack from 'webpack';
import dotenv from 'dotenv';
dotenv.config();
    
export default {
    webpack: config => {
    const env = Object.keys(process.env).reduce((acc, curr) => {
    acc[`process.env.${curr}`] = JSON.stringify(process.env[curr]);
        return acc;
    }, {});
        
    config.plugins.push(new webpack.DefinePlugin(env));
        
    return config;
    }
};