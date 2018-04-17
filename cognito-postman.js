const AmazonCognitoIdentity = require('amazon-cognito-identity-js')
const speakeasy = require('speakeasy')

// globally accessible variables
export const userPool = new CognitoUserPool({
  UserPoolId: 'us-west-2_HOVCUPEvz',
  ClientId: '63ioltrimf2d27ak6bvcr7kbmf'
})
export var authData
export var cognitoUser

// get auth data from provided values and set to global variable
export const setAuthData = (Username, Password) => {
  let authenticationData = { Username, Password }
  authData = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData)
  cognitoUser = new AmazonCognitoIdentity.CognitoUser({ Username, Pool: userPool});
  console.log('Auth Data: ', authData, 'Cognito User: ', cognito)
}

export const signUp = (username, password) => userPool.signUp(username, password, [], null, console.log)

export const auth = () => cognitoUser.authenticateUser(authenticationDetails, {
  onSuccess: function (result) {
    console.log('access token + ' + result.getAccessToken().getJwtToken())
    return result.getAccessToken().getJwtToken()
  },

  onFailure: function(err) {
    console.error('onFailure: ', err);
  },

  mfaSetup: function(challengeName, challengeParameters) {      
    cognitoUser.associateSoftwareToken(this);
  },

  associateSecretCode : function(secretCode) {
    var challengeAnswer = speakeasy.totp({secret: secretCode, encoding: 'base32' })
    cognitoUser.verifySoftwareToken(challengeAnswer, 'My TOTP device', this);
  },

  selectMFAType : function(challengeName, challengeParameters) {
    var mfaType = prompt('Please select the MFA method.', ''); // valid values for mfaType is "SMS_MFA", "SOFTWARE_TOKEN_MFA" 
    cognitoUser.sendMFASelectionAnswer(mfaType, this);
  },

  totpRequired : function(secretCode, secret) {
    var challengeAnswer = speakeasy.totp({secret, encoding: 'base32'})
    cognitoUser.sendMFACode(challengeAnswer, this, 'SOFTWARE_TOKEN_MFA');
  },

  mfaRequired: function(codeDeliveryDetails, secret) {
    var challengeAnswer = speakeasy.totp({secret, encoding: 'base32'})
    cognitoUser.sendMFACode(challengeAnswer, this, 'SOFTWARE_TOKEN_MFA');
  },

  newPasswordRequired: function(userattrs, reqattrs) {
    cognitoUser.completeNewPasswordChallenge('Testing123!', null, this)
  }
})