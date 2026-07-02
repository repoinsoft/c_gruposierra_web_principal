<?php
/******************************************************
 * apiMyCli.php
 ******************************************************/

header('Content-Type: application/json; charset=utf-8');

/* 🔓 CORS útil para pruebas locales (opcional) */
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

try {
  /* 📦 Carga credenciales (fuera de public_html) */
  $config = require __DIR__ . '/../secure/db_config.php';
  if (!is_array($config)) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'CONFIG_INVALID']); exit;
  }

  $action = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : 'ping';

  if ($action === 'ping') {
    echo json_encode(['ok'=>true, 'message'=>'API clientes lista']); exit;
  }

  /* 🔌 Conexión */
  mysqli_report(MYSQLI_REPORT_OFF);
  $cn = @new mysqli($config['host'], $config['user'], $config['pass'], $config['dbname'], $config['port'] ?? 3306);
  if ($cn->connect_error) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'DB_CONNECT','detail'=>$cn->connect_error], JSON_UNESCAPED_UNICODE);
    exit;
  }
  if (!empty($config['charset'])) { $cn->set_charset($config['charset']); } else { $cn->set_charset('utf8mb4'); }

  if ($action === 'check') {
    /* 📨 Lee JSON o x-www-form-urlencoded */
    $payload = [];
    $ct = $_SERVER['CONTENT_TYPE'] ?? '';
    if (stripos($ct, 'application/json') !== false) {
      $payload = json_decode(file_get_contents('php://input'), true) ?: [];
    } else {
      $payload = $_POST + $_GET;
    }

    $user = isset($payload['user']) ? trim((string)$payload['user']) : '';
    $pass = isset($payload['pass']) ? trim((string)$payload['pass']) : '';

    if ($user === '' || $pass === '') {
      http_response_code(400);
      echo json_encode(['ok'=>false,'error'=>'MISSING_FIELDS','detail'=>'user y pass son requeridos'], JSON_UNESCAPED_UNICODE);
      exit;
    }

    /* 🛡️ Consulta segura */
    $sql = "SELECT id FROM c0_clientes_acceso WHERE user = ? AND pass = ? AND estado = 1 LIMIT 1";
    $stmt = $cn->prepare($sql);
    if (!$stmt) {
      http_response_code(500);
      echo json_encode(['ok'=>false,'error'=>'PREPARE_FAIL'], JSON_UNESCAPED_UNICODE);
      exit;
    }
    $stmt->bind_param('ss', $user, $pass);
    $stmt->execute();
    $stmt->store_result();
    $exists = $stmt->num_rows > 0;
    $stmt->close();

    echo json_encode(['ok'=>true,'exists'=>$exists], JSON_UNESCAPED_UNICODE);
    $cn->close();
    exit;
  }

  /* ❓ Acción no soportada */
  http_response_code(404);
  echo json_encode(['ok'=>false,'error'=>'NOT_FOUND']);
} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'UNHANDLED','detail'=>$e->getMessage()]);
}
