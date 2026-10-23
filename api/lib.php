<?php
declare(strict_types=1);

function cb_dir(): string {
    return getenv('CB_DATA_DIR') ?: dirname(__DIR__, 3) . '/caso-black-private';
}
function cb_config(): array {
    static $config;
    if ($config === null) {
        $file = cb_dir() . '/config.json';
        if (!is_file($file)) throw new RuntimeException('Armazenamento ainda não configurado.');
        $config = json_decode((string)file_get_contents($file), true, 32, JSON_THROW_ON_ERROR);
    }
    return $config;
}
function cb_db(): PDO {
    static $db;
    if ($db) return $db;
    cb_config();
    $db = new PDO('sqlite:' . cb_dir() . '/caso-black.sqlite', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $db->exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;');
    $db->exec("CREATE TABLE IF NOT EXISTS investigadores (
      id TEXT PRIMARY KEY, token_hash TEXT NOT NULL, nome TEXT NOT NULL, email TEXT NOT NULL DEFAULT '',
      whatsapp TEXT NOT NULL DEFAULT '', lgpd INTEGER NOT NULL, origem TEXT NOT NULL, criado_em TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS carimbos (investigador_id TEXT NOT NULL REFERENCES investigadores(id),
      estacao INTEGER NOT NULL CHECK(estacao BETWEEN 1 AND 6), via TEXT NOT NULL, criado_em TEXT NOT NULL,
      PRIMARY KEY(investigador_id,estacao));
      CREATE TABLE IF NOT EXISTS mural (id TEXT PRIMARY KEY, investigador_id TEXT NOT NULL REFERENCES investigadores(id),
      equipe TEXT NOT NULL, autorizo INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pendente',
      criado_em TEXT NOT NULL, moderado_em TEXT, impresso_em TEXT);
      CREATE TABLE IF NOT EXISTS feedback (id TEXT PRIMARY KEY, investigador_id TEXT, nota INTEGER NOT NULL, faltou TEXT, criado_em TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS ajustes (chave TEXT PRIMARY KEY, valor TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS limites (chave TEXT PRIMARY KEY, vezes INTEGER NOT NULL, expira INTEGER NOT NULL);
      CREATE INDEX IF NOT EXISTS mural_status ON mural(status,criado_em);
      CREATE TABLE IF NOT EXISTS auditoria (id INTEGER PRIMARY KEY, acao TEXT NOT NULL, alvo TEXT, criado_em TEXT NOT NULL);");
    @chmod(cb_dir() . '/caso-black.sqlite', 0600);
    return $db;
}
function cb_sql(string $query, array $params = []): PDOStatement {
    $s = cb_db()->prepare($query); $s->execute($params); return $s;
}
function cb_json($body, int $status = 200): void {
    http_response_code($status); header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit;
}
function cb_fail(string $error, int $status = 400): void { cb_json(['ok' => false, 'erro' => $error], $status); }
function cb_now(): string { return gmdate('Y-m-d\TH:i:s\Z'); }
function cb_text($value, int $max): string {
    if (!is_string($value)) return '';
    $s = trim(preg_replace('/[\x00-\x1f\x7f]/u', ' ', $value) ?? '');
    return function_exists('mb_substr') ? mb_substr($s, 0, $max, 'UTF-8') : substr($s, 0, $max);
}
function cb_uuid($value): string {
    if (!is_string($value) || !preg_match('/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i', $value)) cb_fail('Identificador inválido.');
    return strtolower($value);
}
function cb_token(): string {
    $token = $_SERVER['HTTP_X_CB_VISITOR'] ?? '';
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) cb_fail('Abra sua ficha neste aparelho e tente novamente.', 401);
    return $token;
}
function cb_owner(string $id): array {
    $r = cb_sql('SELECT * FROM investigadores WHERE id=?', [$id])->fetch(PDO::FETCH_ASSOC);
    if (!$r || !hash_equals($r['token_hash'], hash('sha256', cb_token()))) cb_fail('Ficha não autorizada neste aparelho.', 403);
    return $r;
}
function cb_limit(string $type, int $max, int $seconds): void {
    $bucket = (int)floor(time() / $seconds);
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'cli';
    $key = hash_hmac('sha256', $type . '|' . $ip . '|' . $bucket, cb_config()['salt']);
    cb_sql('INSERT INTO limites(chave,vezes,expira) VALUES(?,1,?) ON CONFLICT(chave) DO UPDATE SET vezes=vezes+1', [$key, time() + $seconds]);
    if ((int)cb_sql('SELECT vezes FROM limites WHERE chave=?', [$key])->fetchColumn() > $max) {
        header('Retry-After: ' . $seconds); cb_fail('Muitas tentativas. Aguarde alguns minutos.', 429);
    }
    cb_sql('DELETE FROM limites WHERE expira<?', [time()]);
}
function cb_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $dir = cb_dir() . '/sessions';
    if (!is_dir($dir)) mkdir($dir, 0700, true);
    session_save_path($dir); session_name('cb_equipe');
    $path = dirname($_SERVER['SCRIPT_NAME'] ?? '/caso-black/api/index.php');
    session_set_cookie_params(['lifetime' => 28800, 'path' => rtrim(dirname($path), '/') . '/',
      'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https',
      'httponly' => true, 'samesite' => 'Strict']);
    ini_set('session.use_strict_mode', '1'); ini_set('session.gc_maxlifetime', '28800'); session_start();
    $_SESSION['csrf'] ??= bin2hex(random_bytes(24));
}
function cb_admin(): bool { cb_session(); return ($_SESSION['admin_ate'] ?? 0) > time(); }
function cb_require_admin(): void { if (!cb_admin()) cb_fail('Entre com a senha da equipe.', 401); }
function cb_csrf(array $body): void {
    cb_session();
    if (!is_string($body['csrf'] ?? null) || !hash_equals($_SESSION['csrf'], $body['csrf'])) cb_fail('Sessão expirada. Atualize a página.', 403);
}
function cb_rastro(): bool { return cb_sql("SELECT valor FROM ajustes WHERE chave='rastro_pipoca'")->fetchColumn() !== '0'; }
function cb_vip(): string { return (string)(cb_sql("SELECT valor FROM ajustes WHERE chave='vip_url'")->fetchColumn() ?: ''); }
function cb_audit(string $action, string $target = ''): void { cb_sql('INSERT INTO auditoria(acao,alvo,criado_em) VALUES(?,?,?)', [$action, $target, cb_now()]); }

// Vídeos da TV: a lista fica na pasta privada; os enviados pelo painel ficam em tv-videos/ (servidos direto, com Range).
function cb_tv_lista(): array {
    $p = json_decode((string)@file_get_contents(cb_dir() . '/tv/playlist.json'), true);
    if (!is_array($p) || !is_array($p['lista'] ?? null))
        $p = ['lista' => array_map(fn($n) => 'assets/tv/' . $n, json_decode((string)@file_get_contents(dirname(__DIR__) . '/assets/tv/playlist.json'), true) ?: [])];
    $p['lista'] = array_values(array_filter($p['lista'], fn($v) => is_string($v) && preg_match('#^(assets/tv|tv-videos)/[a-z0-9-]{1,60}\.mp4$#', $v) && is_file(dirname(__DIR__) . '/' . $v)));
    $p['nomes'] = is_array($p['nomes'] ?? null) ? $p['nomes'] : [];
    return $p;
}
function cb_tv_salvar(array $p): void {
    $d = cb_dir() . '/tv'; if (!is_dir($d)) mkdir($d, 0700, true);
    file_put_contents("$d/playlist.json", json_encode(['lista' => array_values($p['lista']), 'nomes' => $p['nomes']], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
}
