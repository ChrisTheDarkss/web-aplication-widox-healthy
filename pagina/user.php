<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type");

include_once 'config.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Obtener usuario por ID
        if(isset($_GET['id'])) {
            $id = $_GET['id'];
            $query = "SELECT id, nombre, email, fecha_registro FROM usuarios WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->bindParam(1, $id);
            $stmt->execute();
            
            if($stmt->rowCount() > 0) {
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                echo json_encode($row);
            } else {
                http_response_code(404);
                echo json_encode(array("message" => "Usuario no encontrado."));
            }
        } else {
            // Obtener todos los usuarios
            $query = "SELECT id, nombre, email, fecha_registro FROM usuarios WHERE activo = 1";
            $stmt = $db->prepare($query);
            $stmt->execute();
            
            $usuarios = array();
            while($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                array_push($usuarios, $row);
            }
            echo json_encode($usuarios);
        }
        break;
        
    case 'PUT':
        // Actualizar usuario
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->id) && !empty($data->nombre) && !empty($data->email)) {
            $id = $data->id;
            $nombre = $data->nombre;
            $email = $data->email;
            
            // Verificar si el email ya existe en otro usuario
            $query = "SELECT id FROM usuarios WHERE email = ? AND id != ?";
            $stmt = $db->prepare($query);
            $stmt->bindParam(1, $email);
            $stmt->bindParam(2, $id);
            $stmt->execute();
            
            if($stmt->rowCount() > 0) {
                http_response_code(400);
                echo json_encode(array("message" => "El email ya está en uso por otro usuario."));
            } else {
                $query = "UPDATE usuarios SET nombre=?, email=? WHERE id=?";
                $stmt = $db->prepare($query);
                
                if($stmt->execute([$nombre, $email, $id])) {
                    echo json_encode(array("message" => "Usuario actualizado exitosamente."));
                } else {
                    http_response_code(503);
                    echo json_encode(array("message" => "No se pudo actualizar el usuario."));
                }
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "Datos incompletos."));
        }
        break;
        
    case 'DELETE':
        // Eliminar usuario (borrado lógico)
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->id)) {
            $id = $data->id;
            $query = "UPDATE usuarios SET activo = 0 WHERE id = ?";
            $stmt = $db->prepare($query);
            
            if($stmt->execute([$id])) {
                echo json_encode(array("message" => "Usuario eliminado exitosamente."));
            } else {
                http_response_code(503);
                echo json_encode(array("message" => "No se pudo eliminar el usuario."));
            }
        } else {
            http_response_code(400);
            echo json_encode(array("message" => "ID de usuario requerido."));
        }
        break;
        
    default:
        http_response_code(405);
        echo json_encode(array("message" => "Método no permitido."));
        break;
}
?>