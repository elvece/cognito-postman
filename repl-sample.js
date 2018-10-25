#!/usr/bin/env node
const repl = require('repl')
const context = repl.start('$ ').context
const fetch = require('node-fetch')
const speakeasy = require('speakeasy')
context.speakeasy = speakeasy
context.fetch = fetch
global.fetch = fetch
const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
const AWS = require('aws-sdk')
const nonadmin = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18', region: 'us-west-2'})
const admin = new AWS.CognitoIdentityServiceProvider({apiVersion: '2016-04-18', region: 'us-west-2'})
context.admin = admin
context.nonadmin = nonadmin
const { CognitoUserPool, CognitoUserAttribute, CognitoUser } = AmazonCognitoIdentity

var credentials = new AWS.SharedIniFileCredentials({ profile: '' });
AWS.config.credentials = credentials;

const poolData = {
    UserPoolId: '',
    ClientId: ''
}

context.poolData = poolData

const userPool = new CognitoUserPool(poolData)
context.userPool = userPool
context.CognitoUserAttribute = CognitoUserAttribute
context.CognitoUser = CognitoUser

const dataEmail = {
    Name: 'email',
    Value: ''
}

const attributeEmail = new CognitoUserAttribute(dataEmail)
context.attributeEmail = attributeEmail

var authenticationData = {
    Username : '',
    Password : '',
    Pool : userPool
};
var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

var cognitoUser = new AmazonCognitoIdentity.CognitoUser(authenticationData);
context.user = cognitoUser
const signUp = () => userPool.signUp(authenticationData.Username, authenticationData.Password, [], null, console.log)
context.signUp = signUp
var accessToken
global.navigator = {}
const auth = () => cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function (result) {
        accessToken = result.getAccessToken().getJwtToken()
        console.log('RESULT: ', result, 'access token + ' + result.getAccessToken().getJwtToken());
        console.log('res', result)
    },

    onFailure: function(err) {
        console.log('here6')
        console.error(err.message || JSON.stringify(err))
        console.error(new Error().stack)
    },

    mfaSetup: function(challengeName, challengeParameters) {
        console.log(challengeName, challengeParameters)
        
        cognitoUser.associateSoftwareToken(this);
    },

    associateSecretCode : function(secretCode) {
        console.log(secretCode)
        console.log('here5')
        var challengeAnswer = speakeasy.totp({secret: secretCode, encoding: 'base32' })
        cognitoUser.verifySoftwareToken(challengeAnswer, 'My TOTP device', this);
    },

    selectMFAType : function(challengeName, challengeParameters) {
        console.log('here4')
        var mfaType = prompt('Please select the MFA method.', ''); // valid values for mfaType is "SMS_MFA", "SOFTWARE_TOKEN_MFA" 
        cognitoUser.sendMFASelectionAnswer(mfaType, this);
    },

    totpRequired : function(secretCode) {
        console.log('here3')
        var challengeAnswer = speakeasy.totp({secret: '', encoding: 'base32'})
        cognitoUser.sendMFACode(challengeAnswer, this, 'SOFTWARE_TOKEN_MFA');
    },

    mfaRequired: function(codeDeliveryDetails) {
        console.log('here2')
        var challengeAnswer = speakeasy.totp({secret: '', encoding: 'base32'})
        cognitoUser.sendMFACode(challengeAnswer, this, 'SOFTWARE_TOKEN_MFA');
    },

    newPasswordRequired: function(userattrs, reqattrs) {
        console.log('here')
        cognitoUser.completeNewPasswordChallenge('Testing@123', null, this)
    }
});
const mfacode = () => speakeasy.totp({secret: '', encoding: 'base32'})
context.mfacode = mfacode
context.auth = auth
