<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(
    !empty($data->nombre) &&
    !empty($data->email) &&
    !empty($data->password)
) {
    $nombre = $data->nombre;
    $email = $data->email;
    $password = password_hash($data->password, PASSWORD_DEFAULT);

    // Verificar si el email ya existe
    $query = "SELECT id FROM usuarios WHERE email = ?";
    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $email);
    $stmt->execute();

    if($stmt->rowCount() > 0) {
        http_response_code(400);
        echo json_encode(array("message" => "El email ya está registrado."));
    } else {
        // Insertar nuevo usuario
        $query = "INSERT INTO usuarios SET nombre=?, email=?, password=?";
        $stmt = $db->prepare($query);
        
        if($stmt->execute([$nombre, $email, $password])) {
            http_response_code(201);
            echo json_encode(array(
                "message" => "Usuario registrado exitosamente.",
                "id" => $db->lastInsertId(),
                "nombre" => $nombre
            ));
        } else {
            http_response_code(503);
            echo json_encode(array("message" => "No se pudo registrar el usuario."));
        }
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Datos incompletos."));
}
?>