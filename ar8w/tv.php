<?php
/* Telão em rede: o celular manda o retrato falado ao fim do caso (POST), a TV pergunta o que há de novo (GET ?desde=)
   e baixa cada imagem (GET ?img=). Guarda fora do public_html, só os últimos 60, sem dado pessoal. */
declare(strict_types=1);
header('X-Content-Type-Options: nosniff');
$dir = (getenv('CB_DATA_DIR') ?: dirname(__DIR__, 3) . '/caso-black-private') . '/tv';
if (!is_dir($dir)) @mkdir($dir, 0700, true);
$indice = "$dir/indice.json";
$ler = function () use ($indice) { $j = @json_decode((string)@file_get_contents($indice), true); return is_array($j) ? $j : []; };
function sair($corpo, int $st = 200): void { http_response_code($st); header('Content-Type: application/json'); header('Cache-Control: no-store'); echo json_encode($corpo); exit; }

if (isset($_GET['img'])) {
    $id = (string)$_GET['img'];
    if (!preg_match('/^[0-9]{10,13}-[a-z0-9]{4,8}$/', $id) || !is_file("$dir/$id.jpg")) sair(['erro' => 'nao'], 404);
    header('Content-Type: image/jpeg'); header('Cache-Control: public, max-age=31536000, immutable');
    readfile("$dir/$id.jpg"); exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $ip = hash('sha256', ($_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '') . 'cb');
    $trava = "$dir/ip-" . substr($ip, 0, 16);
    if (is_file($trava) && time() - filemtime($trava) < 20) sair(['erro' => 'calma'], 429);
    $bin = file_get_contents('php://input', false, null, 0, 300001);
    if ($bin === false || strlen($bin) > 300000 || strncmp($bin, "\xFF\xD8\xFF", 3) !== 0) sair(['erro' => 'imagem'], 400);
    $tam = @getimagesizefromstring($bin);
    if (!$tam || $tam[2] !== IMAGETYPE_JPEG || $tam[0] > 1200 || $tam[1] > 1200) sair(['erro' => 'imagem'], 400);
    touch($trava);
    $id = (string)round(microtime(true) * 1000) . '-' . bin2hex(random_bytes(3));
    file_put_contents("$dir/$id.jpg", $bin, LOCK_EX);
    $f = fopen($indice, 'c+'); flock($f, LOCK_EX);
    $lista = json_decode(stream_get_contents($f) ?: '[]', true) ?: [];
    $lista[] = $id;
    foreach (array_splice($lista, 0, max(0, count($lista) - 60)) as $velho) @unlink("$dir/$velho.jpg");
    ftruncate($f, 0); rewind($f); fwrite($f, json_encode($lista)); flock($f, LOCK_UN); fclose($f);
    foreach (glob("$dir/ip-*") ?: [] as $t) if (time() - filemtime($t) > 600) @unlink($t);
    sair(['ok' => true, 'id' => $id]);
}

// GET: ids em ordem; com ?desde=ID só os posteriores. ETag deixa a TV perguntar quase de graça.
$lista = $ler();
$etag = '"' . md5(implode(',', $lista)) . '"';
header("ETag: $etag"); header('Cache-Control: no-cache');
if (($_SERVER['HTTP_IF_NONE_MATCH'] ?? '') === $etag) { http_response_code(304); exit; }
$desde = (string)($_GET['desde'] ?? '');
$i = $desde === '' ? false : array_search($desde, $lista, true);
header('Content-Type: application/json');
echo json_encode(['total' => count($lista), 'ids' => $i === false ? $lista : array_slice($lista, $i + 1)]);
