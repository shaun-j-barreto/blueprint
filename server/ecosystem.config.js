module.exports = {
  apps: [
    {
      name: "Blueprint",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
      },
    },
  ],
};
