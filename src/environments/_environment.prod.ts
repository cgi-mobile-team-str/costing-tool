export const environment = {
  production: true,
  msalConfig: {
    auth: {
      clientId: '8b243d6e-5c1c-411e-a387-f44ce9ef0043',
      authority: 'https://login.microsoftonline.com/04bec368-e44a-4659-9029-12eda6658d5d',
      redirectUri: '/',
      postLogoutRedirectUri: '/',
      scopes: ['api://8b243d6e-5c1c-411e-a387-f44ce9ef0043/access_as_user'],
    },
  },
  api: {
    url: 'https://cgi-costing-api-fwe7a9b7dkavcndg.francecentral-01.azurewebsites.net',
  },
};
