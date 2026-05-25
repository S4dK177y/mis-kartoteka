const app = require('./src/app');

const os = require('os');

const PORT = process.env.PORT || 8080;

app.listen(PORT, process.env.HOST || '0.0.0.0', () => {
  const networkInterfaces = os.networkInterfaces();
  let ipAddress = 'localhost';

  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const info of interfaces) {
      if (info.family === 'IPv4' && !info.internal) {
        ipAddress = info.address;
        break;
      }
    }
    if (ipAddress !== 'localhost') break;
  }

  console.log(`Сервер запущен. Локальный доступ: http://localhost:${PORT}`);
  console.log(`Доступ в сети: http://${ipAddress}:${PORT}`);
});
