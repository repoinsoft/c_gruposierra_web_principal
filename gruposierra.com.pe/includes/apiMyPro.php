<?php
header('Content-Type: application/json; charset=utf-8');

// 1) Construye la ruta correcta fuera de public_html
$homeDir    = dirname($_SERVER['DOCUMENT_ROOT']);
$configPath = $homeDir . '/secure/db_config.php';

// 2) Carga con verificaci��n y mensaje claro si falla
if (!is_file($configPath) || !is_readable($configPath)) {
  http_response_code(500);
  echo json_encode([
    'ok'    => false,
    'error' => 'CONFIG_NOT_FOUND',
    'detail'=> 'No se pudo leer ' . $configPath
  ], JSON_UNESCAPED_UNICODE);
  exit;
}

$config  = require $configPath;
$host    = $config['host']   ?? 'localhost';
$user    = $config['user']   ?? '';
$pass    = $config['pass']   ?? '';
$dbname  = $config['dbname'] ?? '';
$port    = $config['port']   ?? 3306;
$charset = $config['charset']?? 'utf8mb4';

// �9�7 �0�3Faltaba esto!
$action = $_GET['action'] ?? $_POST['action'] ?? '';

// (opcional) endpoint de ping para probar r��pido: ?action=ping
if ($action === 'ping') {
  echo json_encode(['ok'=>true, 'message'=>'Conectado (ping ready)'], JSON_UNESCAPED_UNICODE);
  exit;
}

if ($action === 'list') {
  mysqli_report(MYSQLI_REPORT_OFF);
  $cn = @new mysqli($host, $user, $pass, $dbname, (int)$port);
  if ($cn->connect_error) {
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'DB_CONNECT','detail'=>$cn->connect_error], JSON_UNESCAPED_UNICODE);
    exit;
  }
  if (!empty($charset)) { $cn->set_charset($charset); }

  // �9�5 Incluimos slug si tu tabla lo tiene (b1_proyectos.slug)
  $sql = "
    SELECT
      id,
      nombre,
      slug,
      direccion AS ubicacion,
      descripcion,
      foto,
      mapa,
      moneda,
      tipo,
      desde,
      metros,
      prioridad,
      estado,
      DATE_FORMAT(creado, '%Y-%m-%d %H:%i:%s') AS fecha_creado
    FROM b1_proyectos
    WHERE estado = 'ACTIVO'
    ORDER BY prioridad DESC, creado DESC
  ";


  $rs = $cn->query($sql);
  if (!$rs) {
    $err = $cn->error;
    $cn->close();
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'SQL_ERROR','detail'=>$err], JSON_UNESCAPED_UNICODE);
    exit;
  }

  // helper para generar slug si viniera NULL/vac��o
  $mkSlug = function($s){
    $slug = $s ?: 'proyecto';
    if (function_exists('iconv')) {
      $slug = iconv('UTF-8','ASCII//TRANSLIT',$slug);
    }
    $slug = strtolower(preg_replace('/[^a-z0-9]+/i','-', $slug));
    return trim($slug, '-');
  };

    $data = [];
    while ($r = $rs->fetch_assoc()) {
    $titulo = $r['nombre'] ?: 'Proyecto';

    $slug = $r['slug'];
    if (!$slug || !is_string($slug)) {
      $slug = $mkSlug($titulo);
    }

    $img = $r['foto'];
    if ($img && strpos($img, '/') !== 0 && !preg_match('~^https?://~i', $img)) {
      $img = '/img/proyectos/' . ltrim($img, '/');
    }

    $url = 'https://proyectos.gruposierra.pe/?p=' . rawurlencode($slug);

    $moneda = $r['moneda'] ?? '';
    $desde  = isset($r['desde'])  ? (float)$r['desde']  : null;
    $metros = isset($r['metros']) ? (float)$r['metros'] : null;

    $data[] = [
      'titulo'         => $titulo,
      'ubicacion'      => $r['ubicacion'] ?? ($r['descripcion'] ?? ''),
      'img'            => $img ?: '',
      'slug'           => $slug,
      'url'            => $url,

      // 🔹 NUEVOS CAMPOS
      'mapa'           => $r['mapa'] ?? '',
      'tipo'           => $r['tipo'] ?? '',

      // nombres que el JS ya entiende
      'precio_moneda'  => $moneda,
      'precio_desde'   => $desde,
      'area_desde'     => $metros,
      'precio_periodo' => '', // ya no usamos "al mes"

      'prioridad'      => isset($r['prioridad']) ? (int)$r['prioridad'] : null,
      'estado'         => $r['estado'] ?? null,
      'creado'         => $r['fecha_creado'] ?? null
    ];
  }

  $rs->free();
  $cn->close();

  echo json_encode(['ok'=>true,'count'=>count($data),'data'=>$data], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  exit;
}

/* ===== Acci��n desconocida ===== */
http_response_code(400);
echo json_encode(['ok'=>false,'error'=>'BAD_ACTION','detail'=>'Acci��n no soportada'], JSON_UNESCAPED_UNICODE);
