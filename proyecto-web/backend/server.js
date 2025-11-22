const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'mysql',
    user: process.env.DB_USER || 'app_user',
    password: process.env.DB_PASSWORD || 'userpassword',
    database: process.env.DB_NAME || 'usuarios_db',
    port: process.env.DB_PORT || 3306,
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
};

// JWT Secret
const JWT_SECRET = 'tu_clave_secreta_jwt_aqui';

// Conexión a la base de datos con reintentos
let db;

async function connectDB() {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        try {
            console.log(`Intento ${attempts + 1} de conectar a MySQL...`);
            db = await mysql.createConnection(dbConfig);
            
            // Verificar conexión
            await db.execute('SELECT 1');
            console.log('Conectado a MySQL exitosamente');
            
            return;
        } catch (error) {
            attempts++;
            console.error(`Error conectando a MySQL (intento ${attempts}):`, error.message);
            
            if (attempts < maxAttempts) {
                console.log(`Reintentando en 5 segundos...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                console.error('No se pudo conectar a MySQL después de varios intentos');
                throw error;
            }
        }
    }
}

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token requerido' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Middleware para verificar conexión a BD
const ensureDBConnection = async (req, res, next) => {
    try {
        if (!db) {
            await connectDB();
        }
        await db.execute('SELECT 1');
        next();
    } catch (error) {
        console.error('Error en conexión a BD:', error);
        res.status(503).json({ error: 'Servicio de base de datos no disponible' });
    }
};

// Rutas de la API

// Registrar usuario
app.post('/api/registro', ensureDBConnection, async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

        // Validaciones básicas
        if (!nombre || !email || !password) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }

        // Verificar si el usuario ya existe
        const [existingUsers] = await db.execute(
            'SELECT id FROM usuarios WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar usuario
        const [result] = await db.execute(
            'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)',
            [nombre, email, hashedPassword]
        );

        console.log('Usuario registrado exitosamente, ID:', result.insertId);

        // Generar token JWT
        const token = jwt.sign(
            { userId: result.insertId, email: email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token: token,
            user: {
                id: result.insertId,
                nombre: nombre,
                email: email
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
    }
});

// Iniciar sesión
app.post('/api/login', ensureDBConnection, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son requeridos' });
        }

        const [users] = await db.execute(
            'SELECT * FROM usuarios WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = users[0];
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login exitoso',
            token: token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener perfil de usuario
app.get('/api/perfil', authenticateToken, ensureDBConnection, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, nombre, email, fecha_registro FROM usuarios WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ user: users[0] });
    } catch (error) {
        console.error('Error obteniendo perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Actualizar perfil de usuario
app.put('/api/perfil', authenticateToken, ensureDBConnection, async (req, res) => {
    try {
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        await db.execute(
            'UPDATE usuarios SET nombre = ? WHERE id = ?',
            [nombre, req.user.userId]
        );

        res.json({ message: 'Perfil actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener todos los usuarios (solo para demostración)
app.get('/api/usuarios', authenticateToken, ensureDBConnection, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, nombre, email, fecha_registro FROM usuarios'
        );
        res.json({ usuarios: users });
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar usuario
app.delete('/api/usuario/:id', authenticateToken, ensureDBConnection, async (req, res) => {
    try {
        const userId = req.params.id;

        if (parseInt(userId) !== req.user.userId) {
            return res.status(403).json({ error: 'No tienes permisos para eliminar esta cuenta' });
        }

        await db.execute('DELETE FROM usuarios WHERE id = ?', [userId]);

        res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// NUEVAS RUTAS PARA IMC, ALIMENTACIÓN Y EJERCICIOS

// Obtener historial de IMC del usuario
app.get('/api/imc/historial', authenticateToken, ensureDBConnection, async (req, res) => {
    try {
        const [historial] = await db.execute(
            `SELECT id, peso, altura, edad, genero, nivel_actividad, imc, tdee, objetivo, calorias_objetivo, fecha_calculado 
             FROM historial_imc 
             WHERE usuario_id = ? 
             ORDER BY fecha_calculado DESC 
             LIMIT 10`,
            [req.user.userId]
        );

        res.json({ historial: historial });
    } catch (error) {
        console.error('Error obteniendo historial IMC:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Guardar cálculo de IMC
app.post('/api/imc/calcular', authenticateToken, ensureDBConnection, async (req, res) => {
    try {
        const { peso, altura, edad, genero, nivel_actividad, imc, tdee, objetivo, calorias_objetivo } = req.body;

        // Validaciones
        if (!peso || !altura || !edad || !genero || !nivel_actividad || !imc || !tdee) {
            return res.status(400).json({ error: 'Todos los campos son requeridos' });
        }

        const [result] = await db.execute(
            `INSERT INTO historial_imc 
             (usuario_id, peso, altura, edad, genero, nivel_actividad, imc, tdee, objetivo, calorias_objetivo) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [req.user.userId, peso, altura, edad, genero, nivel_actividad, imc, tdee, objetivo || null, calorias_objetivo || null]
        );

        res.status(201).json({
            message: 'Cálculo de IMC guardado exitosamente',
            registro_id: result.insertId
        });

    } catch (error) {
        console.error('Error guardando cálculo IMC:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Guardar registro de calorías
app.post('/api/alimentacion/registro', authenticateToken, ensureDBConnection, async (req, res) => {
    try {
        const { fecha, desayuno, almuerzo, cena, snacks } = req.body;

        const total_calorias = (desayuno || 0) + (almuerzo || 0) + (cena || 0) + (snacks || 0);

        // Insertar o actualizar registro del día
        const [result] = await db.execute(
            `INSERT INTO registro_calorias 
             (usuario_id, fecha, desayuno, almuerzo, cena, snacks, total_calorias) 
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             desayuno = VALUES(desayuno), almuerzo = VALUES(almuerzo), cena = VALUES(cena), 
             snacks = VALUES(snacks), total_calorias = VALUES(total_calorias)`,
            [req.user.userId, fecha || new Date().toISOString().split('T')[0], desayuno || 0, almuerzo || 0, cena || 0, snacks || 0, total_calorias]
        );

        res.status(201).json({
            message: 'Registro de calorías guardado exitosamente',
            registro_id: result.insertId,
            total_calorias: total_calorias
        });

    } catch (error) {
        console.error('Error guardando registro de calorías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener registro de calorías del día
app.get('/api/alimentacion/registro/:fecha?', authenticateToken, ensureDBConnection, async (req, res) => {
    try {
        const fecha = req.params.fecha || new Date().toISOString().split('T')[0];

        const [registros] = await db.execute(
            `SELECT * FROM registro_calorias 
             WHERE usuario_id = ? AND fecha = ?`,
            [req.user.userId, fecha]
        );

        res.json({ registro: registros[0] || null });
    } catch (error) {
        console.error('Error obteniendo registro de calorías:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Guardar progreso de ejercicio
app.post('/api/ejercicios/progreso', authenticateToken, ensureDBConnection, async (req, res) => {
    try {
        const { ejercicio, grupo_muscular, series, repeticiones, peso } = req.body;

        if (!ejercicio) {
            return res.status(400).json({ error: 'El nombre del ejercicio es requerido' });
        }

        const [result] = await db.execute(
            `INSERT INTO progreso_ejercicios 
             (usuario_id, ejercicio, grupo_muscular, series, repeticiones, peso) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [req.user.userId, ejercicio, grupo_muscular || null, series || null, repeticiones || null, peso || null]
        );

        res.status(201).json({
            message: 'Progreso guardado exitosamente',
            registro_id: result.insertId
        });

    } catch (error) {
        console.error('Error guardando progreso de ejercicio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener historial de ejercicios
app.get('/api/ejercicios/historial', authenticateToken, ensureDBConnection, async (req, res) => {
    try {
        const [historial] = await db.execute(
            `SELECT id, ejercicio, grupo_muscular, series, repeticiones, peso, fecha 
             FROM progreso_ejercicios 
             WHERE usuario_id = ? 
             ORDER BY fecha DESC 
             LIMIT 20`,
            [req.user.userId]
        );

        res.json({ historial: historial });
    } catch (error) {
        console.error('Error obteniendo historial de ejercicios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener datos del perfil completo del usuario
app.get('/api/usuario/perfil', authenticateToken, ensureDBConnection, async (req, res) => {
    try {
        const [users] = await db.execute(
            'SELECT id, nombre, email, fecha_registro FROM usuarios WHERE id = ?',
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = users[0];

        // Obtener último cálculo de IMC
        const [ultimoImc] = await db.execute(
            'SELECT * FROM historial_imc WHERE usuario_id = ? ORDER BY fecha_calculado DESC LIMIT 1',
            [req.user.userId]
        );

        // Obtener registro de calorías de hoy
        const hoy = new Date().toISOString().split('T')[0];
        const [caloriasHoy] = await db.execute(
            'SELECT * FROM registro_calorias WHERE usuario_id = ? AND fecha = ?',
            [req.user.userId, hoy]
        );

        res.json({
            usuario: user,
            ultimo_imc: ultimoImc[0] || null,
            calorias_hoy: caloriasHoy[0] || null
        });

    } catch (error) {
        console.error('Error obteniendo perfil completo:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Rutas del frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

app.get('/registro', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'registro.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'home.html'));
});

app.get('/imc', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'imc.html'));
});

app.get('/ejercicios', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'ejercicios.html'));
});

app.get('/alimentacion', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'alimentacion.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'dashboard.html'));
});

// Ruta de verificación de API
app.get('/api', (req, res) => {
    res.json({ 
        message: 'API del Sistema CRUD funcionando correctamente',
        status: 'online',
        database: db ? 'conectada' : 'desconectada',
        timestamp: new Date().toISOString(),
        endpoints: {
            registro: 'POST /api/registro',
            login: 'POST /api/login',
            perfil: 'GET /api/perfil',
            usuarios: 'GET /api/usuarios',
            imc_calcular: 'POST /api/imc/calcular',
            imc_historial: 'GET /api/imc/historial',
            alimentacion_registro: 'POST /api/alimentacion/registro',
            ejercicios_progreso: 'POST /api/ejercicios/progreso'
        }
    });
});

// Ruta de health check
app.get('/health', async (req, res) => {
    try {
        if (db) {
            await db.execute('SELECT 1');
            res.json({ 
                status: 'healthy',
                database: 'connected',
                timestamp: new Date().toISOString()
            });
        } else {
            res.status(503).json({ 
                status: 'unhealthy',
                database: 'disconnected',
                timestamp: new Date().toISOString()
            });
        }
    } catch (error) {
        res.status(503).json({ 
            status: 'unhealthy',
            database: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('Error global:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicializar servidor
async function startServer() {
    try {
        console.log('Iniciando servidor...');
        await connectDB();
        
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en puerto ${PORT}`);
            console.log(`Frontend: http://localhost:${PORT}`);
            console.log(`API: http://localhost:${PORT}/api`);
            console.log(`Health: http://localhost:${PORT}/health`);
        });
    } catch (error) {
        console.error('Error fatal al iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();