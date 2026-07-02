<?php
/******************************************************
 * apiMySli.php  —  Slider desde BD (web1_slider)
 * Solo ACTIVO, ordenado por orden ASC, sin campo "creado"
 ******************************************************/

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

try {
  // Credenciales (fuera de public_html)
  $config = require dirname(__DIR__, 2) . '/secure/db_config.php';
  if (!is_array($config)) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'CONFIG_INVALID']); exit;
  }

  // Conexión
  mysqli_report(MYSQLI_REPORT_OFF);
  $cn = @new mysqli(
    $config['host'], $config['user'], $config['pass'],
    $config['dbname'], $config['port'] ?? 3306
  );
  if ($cn->connect_error) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'DB_CONNECT','detail'=>$cn->connect_error], JSON_UNESCAPED_UNICODE);
    exit;
  }
  $cn->set_charset(!empty($config['charset']) ? $config['charset'] : 'utf8mb4');

  // Acción
  $action = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : 'list';

  if ($action === 'ping') {
    echo json_encode(['ok'=>true, 'message'=>'API slider lista']); 
    $cn->close(); exit;
  }

  if ($action === 'list') {
    // Límite opcional
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 0;
    if ($limit < 1 || $limit > 50) $limit = 0; // 0 = sin límite

    // Solo ACTIVO y ordenado; sin "creado"
    $sql = "SELECT id, orden, imagenes AS url, estado
            FROM web1_slider
            WHERE estado = 'ACTIVO'
            ORDER BY orden ASC";
    if ($limit > 0) { $sql .= " LIMIT ?"; }

    $stmt = $cn->prepare($sql);
    if (!$stmt) {
      http_response_code(500);
      echo json_encode(['ok'=>false,'error'=>'PREPARE_FAIL'], JSON_UNESCAPED_UNICODE);
      $cn->close(); exit;
    }
    if ($limit > 0) { $stmt->bind_param('i', $limit); }

    $stmt->execute();
    $res = $stmt->get_result();

    $items = [];
    if ($res) {
      while ($row = $res->fetch_assoc()) {
        $u = trim((string)$row['url']);
        if ($u !== '') {
          $items[] = [
            'id'     => (int)$row['id'],
            'orden'  => (int)$row['orden'],
            'url'    => $u,
            'estado' => (string)$row['estado'],
          ];
        }
      }
      $res->free();
    }

    $stmt->close(); $cn->close();
    echo json_encode(['ok'=>true, 'count'=>count($items), 'items'=>$items], JSON_UNESCAPED_UNICODE);
    exit;
  }

  http_response_code(404);
  echo json_encode(['ok'=>false,'error'=>'NOT_FOUND']);
  $cn->close();

} catch (Throwable $e) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'UNHANDLED','detail'=>$e->getMessage()]);
}
