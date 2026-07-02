<?php
header('Content-Type: application/json; charset=utf-8');

// 1) Construye la ruta correcta fuera de public_html
$homeDir = dirname($_SERVER['DOCUMENT_ROOT']);
$configPath = $homeDir . '/secure/db_config.php';

// 2) Carga con verificación y mensaje claro si falla
if (!is_file($configPath) || !is_readable($configPath)) {
  http_response_code(500);
  echo json_encode([
    'ok' => false,
    'error' => 'CONFIG_NOT_FOUND',
    'detail' => 'No se pudo leer ' . $configPath
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$config = require $configPath;

// -------- Helpers --------
function db_connect($cfg){
  mysqli_report(MYSQLI_REPORT_OFF);
  $cn = @new mysqli($cfg['host'], $cfg['user'], $cfg['pass'], $cfg['dbname'], $cfg['port']);
  if ($cn->connect_error) return [null, $cn->connect_error];
  if (!empty($cfg['charset'])) $cn->set_charset($cfg['charset']);
  return [$cn, null];
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

// ========================================================
// 1) LISTA DE EVENTOS
//    GET /includes/apoMyEve.php?action=events
// ========================================================
if ($action === 'events') {
  list($cn, $err) = db_connect($config);
  if ($err) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'DB_CONNECT','detail'=>$err], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $sql = "
    SELECT
      e.id,
      e.titulo,
      e.descripcion,
      CONCAT(e.fecha_evento, ' ', IFNULL(e.hora_evento,'00:00:00')) AS fecha_hora,
      e.lugar AS ubicacion,
      e.imagen AS foto,
      e.aforo_maximo,
      e.es_pago,
      e.precio,
      e.metodo_pago,
      e.estado,
      IFNULL(COUNT(i.id),0) AS inscritos,
      GREATEST(e.aforo_maximo - IFNULL(COUNT(i.id),0), 0) AS cupos_disponibles
    FROM d1_eventos e
    LEFT JOIN d2_inscritos i ON i.evento_id = e.id
    WHERE e.estado IN ('PROGRAMADO','EN_CURSO')
    GROUP BY e.id, e.titulo, e.descripcion, e.fecha_evento, e.hora_evento,
             e.lugar, e.imagen, e.aforo_maximo, e.es_pago, e.precio, e.metodo_pago, e.estado
    ORDER BY e.prioridad DESC, e.fecha_evento ASC, e.id DESC;
  ";
  $rs = $cn->query($sql);
  if (!$rs) {
    $err = $cn->error;
    $cn->close();
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'SQL_ERROR','detail'=>$err], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $data = [];
  while ($r = $rs->fetch_assoc()) {
    $img = $r['foto'];
    if ($img && strpos($img, '/') !== 0 && !preg_match('~^https?://~i', $img)) {
      $img = '/img/eventos/' . ltrim($img, '/');
    }
    $data[] = [
      'id'         => (int)$r['id'],
      'titulo'     => $r['titulo'],
      'descripcion'=> $r['descripcion'],
      'fecha_hora' => $r['fecha_hora'],
      'ubicacion'  => $r['ubicacion'],
      'img'        => $img ?: '',
      'aforo'      => (int)$r['aforo_maximo'],
      'inscritos'  => (int)$r['inscritos'],
      'cupos'      => (int)$r['cupos_disponibles'],
      'es_pago'    => (int)$r['es_pago'],
      'precio'     => (float)$r['precio'],
      'metodo_pago'=> $r['metodo_pago'],
      'estado'     => $r['estado']
    ];
  }
  $rs->free();
  $cn->close();

  echo json_encode(['ok'=>true,'count'=>count($data),'data'=>$data], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  exit;
}

// ========================================================
// 2) INSCRIBIRSE
//    POST /includes/apoMyEve.php?action=inscribir
// ========================================================
if ($action === 'inscribir') {
  // Solo POST
  if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok'=>false,'error'=>'METHOD_NOT_ALLOWED'], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $evento_id = isset($_POST['evento_id']) ? (int)$_POST['evento_id'] : 0;
  $nombre    = trim($_POST['nombre'] ?? '');
  $apellido  = trim($_POST['apellido'] ?? '');
  $dni       = trim($_POST['dni'] ?? '');
  $telefono  = trim($_POST['telefono'] ?? '');
  $correo    = trim($_POST['correo'] ?? '');
  $comp_url  = trim($_POST['comprobante_url'] ?? '');

  if ($evento_id <= 0 || $nombre === '') {
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>'BAD_INPUT','detail'=>'evento_id y nombre son obligatorios'], JSON_UNESCAPED_UNICODE);
    exit;
  }

  list($cn, $err) = db_connect($config);
  if ($err) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'DB_CONNECT','detail'=>$err], JSON_UNESCAPED_UNICODE);
    exit;
  }

  try {
    $cn->begin_transaction();

    // Lock del evento
    $q1 = $cn->prepare("SELECT aforo_maximo, es_pago, estado FROM d1_eventos WHERE id = ? FOR UPDATE");
    $q1->bind_param('i', $evento_id);
    $q1->execute();
    $ev = $q1->get_result()->fetch_assoc();
    if (!$ev) throw new Exception('EVENT_NOT_FOUND');
    if (!in_array($ev['estado'], ['PROGRAMADO','EN_CURSO'], true)) throw new Exception('EVENT_CLOSED');
    if ((int)$ev['es_pago'] === 1 && $comp_url === '') throw new Exception('PAY_PROOF_REQUIRED');

    $q2 = $cn->prepare("SELECT COUNT(*) c FROM d2_inscritos WHERE evento_id = ?");
    $q2->bind_param('i', $evento_id);
    $q2->execute();
    $c_actual = (int)$q2->get_result()->fetch_assoc()['c'];

    $aforo = (int)$ev['aforo_maximo'];
    if ($aforo > 0 && $c_actual >= $aforo) throw new Exception('NO_SLOTS');

    $q3 = $cn->prepare("
      INSERT INTO d2_inscritos (evento_id, nombre, apellido, dni, telefono, correo, comentarios, comprobante_url)
      VALUES (?, ?, ?, ?, ?, ?, '', ?)
    ");
    $q3->bind_param('issssss', $evento_id, $nombre, $apellido, $dni, $telefono, $correo, $comp_url);
    $q3->execute();

    $nuevo = $c_actual + 1;
    $cupos = max($aforo - $nuevo, 0);

    $cn->commit();
    echo json_encode(['ok'=>true,'inscrito_id'=>$cn->insert_id,'inscritos'=>$nuevo,'cupos'=>$cupos], JSON_UNESCAPED_UNICODE);
  } catch (Exception $e) {
    $cn->rollback();
    http_response_code(400);
    echo json_encode(['ok'=>false,'error'=>$e->getMessage()], JSON_UNESCAPED_UNICODE);
  } finally {
    $cn->close();
  }
  exit;
}

// -------- Acción desconocida --------
http_response_code(400);
echo json_encode(['ok'=>false,'error'=>'BAD_ACTION','detail'=>'Acción no soportada'], JSON_UNESCAPED_UNICODE);
