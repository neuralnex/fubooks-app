module.exports = ({ config }) => {
  const extra = {
    ...(config.extra || {}),
    privyAppId:
      process.env.PRIVY_APP_ID ||
      process.env.EXPO_PUBLIC_PRIVY_APP_ID ||
      config.extra?.privyAppId ||
      '',
    privyClientId:
      process.env.PRIVY_CLIENT_ID ||
      process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID ||
      config.extra?.privyClientId ||
      '',
    adminOnly:
      (process.env.ADMIN_ONLY === 'true') || config.extra?.adminOnly || false,
  };

  return {
    ...config,
    extra,
  };
};
