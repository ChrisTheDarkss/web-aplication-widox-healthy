--Tabla para Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para historial de IMC
CREATE TABLE IF NOT EXISTS historial_imc (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    peso DECIMAL(5,2),
    altura DECIMAL(5,2),
    edad INT,
    genero ENUM('hombre', 'mujer'),
    nivel_actividad VARCHAR(50),
    imc DECIMAL(4,2),
    tdee INT,
    objetivo ENUM('deficit', 'superavit'),
    calorias_objetivo INT,
    fecha_calculado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabla para registro de calorías diarias
CREATE TABLE IF NOT EXISTS registro_calorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    fecha DATE,
    desayuno INT DEFAULT 0,
    almuerzo INT DEFAULT 0,
    cena INT DEFAULT 0,
    snacks INT DEFAULT 0,
    total_calorias INT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_fecha_usuario (usuario_id, fecha)
);

-- Tabla para progreso de ejercicios
CREATE TABLE IF NOT EXISTS progreso_ejercicios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    ejercicio VARCHAR(100),
    grupo_muscular VARCHAR(50),
    series INT,
    repeticiones INT,
    peso DECIMAL(5,2),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insertar usuario de prueba
INSERT IGNORE INTO usuarios (nombre, email, password) 
VALUES ('Usuario Demo', 'demo@demo.com', 'test1234');