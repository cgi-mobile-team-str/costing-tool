export const environment = {
  production: true,
  msalConfig: {
    auth: {
      clientId: 'YOUR_PROD_CLIENT_ID',
      authority: 'https://login.microsoftonline.com/YOUR_PROD_TENANT_ID',
      redirectUri: '/',
      postLogoutRedirectUri: '/',
    },
  },
};
