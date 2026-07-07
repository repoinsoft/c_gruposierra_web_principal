<?php
header('Content-Type: application/json; charset=utf-8');

/* ====== Carga segura de credenciales ====== */
$homeDir    = dirname($_SERVER['DOCUMENT_ROOT']);
$configPath = $homeDir . '/secure/db_config.php';
if (!is_file($configPath) || !is_readable($configPath)) {
  http_response_code(500);
  echo json_encode(['ok'=>false,'error'=>'CONFIG_NOT_FOUND','detail'=>$configPath], JSON_UNESCAPED_UNICODE);
  exit;
}
$config = require $configPath;

function db_connect($cfg){
  mysqli_report(MYSQLI_REPORT_OFF);
  $cn = @new mysqli($cfg['host'],$cfg['user'],$cfg['pass'],$cfg['dbname'],$cfg['port']);
  if ($cn->connect_error) return [null,$cn->connect_error];
  if (!empty($cfg['charset'])) $cn->set_charset($cfg['charset']);
  return [$cn,null];
}

$action = $_GET['action'] ?? $_POST['action'] ?? '';

/* ------------------------------------------------------------------ */
/* 1) LISTA DE PROYECTOS (para aside)                                 */
/* ------------------------------------------------------------------ */
if ($action === 'projects') {
  list($cn,$err) = db_connect($config);
  if ($err){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'DB_CONNECT','detail'=>$err]); exit; }

  $sql = "
    SELECT
      id,
      nombre,
      slug,
      direccion,
      descripcion,
      foto,
      COALESCE(entrada,0)   AS entrada,
      COALESCE(salida,0)    AS salida,
      COALESCE(saldo,0)     AS saldo,
      COALESCE(prioridad,0) AS prioridad,
      estado, creado
    FROM b1_proyectos
    WHERE estado='ACTIVO'
    ORDER BY prioridad DESC, id DESC
  ";
  $rs = $cn->query($sql);
  if (!$rs){
    $e=$cn->error; $cn->close();
    http_response_code(500);
    echo json_encode(['ok'=>false,'error'=>'SQL_ERROR','detail'=>$e], JSON_UNESCAPED_UNICODE);
    exit;
  }

  $data = [];
  while ($r = $rs->fetch_assoc()) {
    $data[] = [
      'id'        => (int)$r['id'],
      'nombre'    => $r['nombre'],
      'slug'      => $r['slug'] ?? '',
      'direccion' => $r['direccion'] ?? '',
      'descripcion'=> $r['descripcion'] ?? '',
      'foto'      => $r['foto'] ?: '',
      'entrada'   => (int)$r['entrada'],
      'salida'    => (int)$r['salida'],
      'saldo'     => (int)$r['saldo'],
      'prioridad' => (int)$r['prioridad']
    ];
  }
  $rs->free(); $cn->close();

  echo json_encode(['ok'=>true,'count'=>count($data),'data'=>$data], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  exit;
}

/* ------------------------------------------------------------------ */
/* 2) DATOS DEL VISOR (b1 + b2)  — acepta id o slug (alias p)         */
/* ------------------------------------------------------------------ */
if ($action === 'viewer') {
  // soporta ?slug=torre-andina-2 o ?p=torre-andina-2 o ?id=2
  $slug = isset($_GET['slug']) ? trim($_GET['slug']) : (isset($_GET['p']) ? trim($_GET['p']) : '');
  $id   = isset($_GET['id'])   ? (int)$_GET['id']   : 0;

  list($cn,$err) = db_connect($config);
  if ($err){ http_response_code(500); echo json_encode(['ok'=>false,'error'=>'DB_CONNECT','detail'=>$err]); exit; }

  // Datos base del proyecto (por slug o por id)
  if ($slug !== '') {
    $q1 = $cn->prepare("SELECT id,nombre,slug,direccion,descripcion,foto,
                               COALESCE(entrada,0) entrada,
                               COALESCE(salida,0)  salida,
                               COALESCE(saldo,0)   saldo,
                               COALESCE(prioridad,0) prioridad
                        FROM b1_proyectos
                        WHERE slug=? LIMIT 1");
    $q1->bind_param('s',$slug);
  } else {
    if ($id<=0){ $cn->close(); http_response_code(400); echo json_encode(['ok'=>false,'error'=>'BAD_ID']); exit; }
    $q1 = $cn->prepare("SELECT id,nombre,slug,direccion,descripcion,foto,
                               COALESCE(entrada,0) entrada,
                               COALESCE(salida,0)  salida,
                               COALESCE(saldo,0)   saldo,
                               COALESCE(prioridad,0) prioridad
                        FROM b1_proyectos
                        WHERE id=? LIMIT 1");
    $q1->bind_param('i',$id);
  }

  $q1->execute();
  $p = $q1->get_result()->fetch_assoc();
  $q1->close();

  if (!$p){
    $cn->close();
    http_response_code(404);
    echo json_encode(['ok'=>false,'error'=>'NOT_FOUND']);
    exit;
  }

  $pid = (int)$p['id'];

  // Plano + imágenes 360
  $q2 = $cn->prepare("SELECT plano_url,img360_1_url,img360_2_url,img360_3_url,img360_4_url,img360_5_url
                      FROM b2_proyectos360
                      WHERE proyecto_id=? LIMIT 1");
  $q2->bind_param('i',$pid);
  $q2->execute();
  $x = $q2->get_result()->fetch_assoc();
  $q2->close();

  $img360 = [];
  if ($x){
    for($i=1;$i<=5;$i++){
      $k = "img360_{$i}_url";
      $img360[] = $x[$k] ?? "";
    }
  }

  $data = [
    'proyecto' => [
      'id'        => $pid,
      'nombre'    => $p['nombre'],
      'slug'      => $p['slug'] ?? '',
      'direccion' => $p['direccion'] ?? '',
      'descripcion'=> $p['descripcion'] ?? '',
      'foto'      => $p['foto'] ?: '',
      'entrada'   => (int)$p['entrada'],
      'salida'    => (int)$p['salida'],
      'saldo'     => (int)$p['saldo'],
      'prioridad' => (int)$p['prioridad']
    ],
    'plano_url' => $x['plano_url'] ?? '',
    'img360'    => $img360
  ];

  $cn->close();
  echo json_encode(['ok'=>true,'data'=>$data], JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
  exit;
}

/* ------------------------------------------------------------------ */
/* 3) ENVIAR FORMULARIO DE CONTACTO A LA API CENTRAL                  */
/* ------------------------------------------------------------------ */
if ($action === 'submit_contact') {
  $nombre   = trim($_POST['nombre'] ?? '');
  $email    = trim($_POST['email'] ?? '');
  $telefono = trim($_POST['telefono'] ?? '');
  $proyecto = trim($_POST['proyecto'] ?? '');
  $tema     = trim($_POST['tema'] ?? '');
  $mensaje  = trim($_POST['mensaje'] ?? '');

  if ($nombre === '' || $telefono === '' || $proyecto === '' || $mensaje === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'FIELDS_REQUIRED']);
    exit;
  }

  // Llamada HTTP cURL segura a la API central en PHP
  $apiSecret = 'sierra_insoft_key_access'; 
  $apiUrl = 'https://api.insoft.com.pe/sierra/b_sierra_consultas_web.php?action=create';

  $postData = json_encode([
    'nombre'   => $nombre,
    'email'    => $email,
    'telefono' => $telefono,
    'proyecto' => $proyecto,
    'tema'     => $tema,
    'mensaje'  => $mensaje
  ]);

  $ch = curl_init();
  curl_setopt($ch, CURLOPT_URL, $apiUrl);
  curl_setopt($ch, CURLOPT_POST, true);
  curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Content-Type: application/json',
    'X-API-SECRET: ' . $apiSecret
  ]);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);

  $res = curl_exec($ch);
  $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
  curl_close($ch);

  if ($httpCode !== 200) {
    http_response_code($httpCode ?: 500);
    echo json_encode(['ok' => false, 'error' => 'API_ERROR', 'detail' => $res]);
    exit;
  }

  echo $res;
  exit;
}

/* Acción desconocida */
http_response_code(400);
echo json_encode(['ok'=>false,'error'=>'BAD_ACTION','detail'=>'Acción no soportada'], JSON_UNESCAPED_UNICODE);
