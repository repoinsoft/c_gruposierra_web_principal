<?php
header('Content-Type: application/json; charset=utf-8');

$API_URL = 'https://gruposierra.pe/includes/apiMyPro.php';

function hit($url, $params = []) {
  $ch = curl_init();
  if ($params) {
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $params);
  } else {
    curl_setopt($ch, CURLOPT_URL, $url);
  }
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_TIMEOUT, 10);
  // Con dominio y cert válido, esto puede ir en true (recomendado):
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
  $out  = curl_exec($ch);
  $err  = curl_error($ch);
  $code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
  curl_close($ch);
  return ['code'=>$code, 'body'=>$out, 'curl_error'=>$err];
}

$results = [
  'ping_get'  => hit($API_URL . '?action=ping'),
  'ping_post' => hit($API_URL, ['action'=>'ping']),
  'list_get'  => hit($API_URL . '?action=list'),
];

echo json_encode(['ok'=>true, 'tests'=>$results], JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT);
