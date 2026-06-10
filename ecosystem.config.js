module.exports = {
  apps: [
    {
      name: "quantis-dte",
      script: "./backend/dist/server.js",
      instances: "max", // Escala a todos los cores disponibles
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 8080 // Puerto por defecto en Azure App Service Linux
      }
    }
  ]
};
