export const environment = {
  production: true,
  msalConfig: {
    auth: {
      clientId: '841f0375-afb3-41df-86cd-c7c722933b0a',
      authority: 'https://login.microsoftonline.com/b9fec68c-c92d-461e-9a97-3d03a0f18b82',
      redirectUri: '/',
      postLogoutRedirectUri: '/',
      scopes: ['api://42436f7c-f3da-45a8-afd3-c776f05495a8/access_as_user'],
    },
  },
  api: {
    url: 'https://cgi-costing-api-fwe7a9b7dkavcndg.francecentral-01.azurewebsites.net',
  },
};
