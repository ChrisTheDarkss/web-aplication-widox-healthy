#!/bin/bash
echo "Reiniciando Sistema CRUD..."
echo "Deteniendo contenedores..."
docker-compose down

echo "Limpiando recursos..."
docker system prune -f

echo "Iniciando contenedores..."
docker-compose up -d --build

echo "Esperando a que los servicios estén listos..."
sleep 15

echo "Verificando estado..."
docker ps

echo "Verificando logs del backend..."
docker logs node_backend --tail 20

echo "Verificando logs de MySQL..."
docker logs mysql_crud --tail 10

echo "Sistema reiniciado!"
echo "Accede a: http://localhost:3000"
pause