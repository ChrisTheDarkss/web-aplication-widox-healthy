<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

include_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$data = json_decode(file_get_contents("php://input"));

if(!empty($data->email) && !empty($data->password)) {
    $email = $data->email;
    $password = $data->password;

    $query = "SELECT id, nombre, email, password FROM usuarios WHERE email = ? AND activo = 1";
    $stmt = $db->prepare($query);
    $stmt->bindParam(1, $email);
    $stmt->execute();

    if($stmt->rowCount() > 0) {
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $id = $row['id'];
        $nombre = $row['nombre'];
        $email_db = $row['email'];
        $password_db = $row['password'];

        if(password_verify($password, $password_db)) {
            http_response_code(200);
            echo json_encode(array(
                "message" => "Inicio de sesión exitoso.",
                "id" => $id,
                "nombre" => $nombre,
                "email" => $email_db
            ));
        } else {
            http_response_code(401);
            echo json_encode(array("message" => "Contraseña incorrecta."));
        }
    } else {
        http_response_code(404);
        echo json_encode(array("message" => "Usuario no encontrado."));
    }
} else {
    http_response_code(400);
    echo json_encode(array("message" => "Datos incompletos."));
}
?>