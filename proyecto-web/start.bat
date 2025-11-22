@echo off
echo Iniciando Sistema CRUD con Docker
echo Construyendo y ejecutando contenedores
docker-compose down
docker-compose up -d --build

echo Esperando a que los servicios esten listos
timeout 10

echo Verificando servicios
echo MySQL: localhost:3306
echo Backend API: localhost:3000/api
echo Frontend: localhost:3000

echo Sistema listo!
echo Accede a: http://localhost:3000
echo Verifica API: http://localhost:3000/api
pause