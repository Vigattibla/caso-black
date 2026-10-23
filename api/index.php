<?php
declare(strict_types=1);
umask(0077);
header('Cache-Control: no-store, private');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: same-origin');
require __DIR__ . '/lib.php';
try {
    cb_db();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    if ($method === 'GET') {
        if (isset($_GET['config'])) cb_json(['vip_url' => cb_vip()]);
        if (isset($_GET['session'])) { $auth = cb_admin(); cb_json(['ok' => true, 'autenticado' => $auth, 'csrf' => $_SESSION['csrf']]); }
        if (isset($_GET['admin'])) {
            cb_require_admin();
            $people = cb_sql('SELECT i.id,i.nome,i.email,i.whatsapp,i.origem,i.criado_em,
              (SELECT count(*) FROM carimbos c WHERE c.investigador_id=i.id AND estacao<=5) provas,
              EXISTS(SELECT 1 FROM carimbos c WHERE c.investigador_id=i.id AND estacao=6) resolvido
              FROM investigadores i ORDER BY criado_em DESC LIMIT 1000')->fetchAll(PDO::FETCH_ASSOC);
            foreach ($people as &$person) { $person['provas'] = (int)$person['provas']; $person['resolvido'] = (bool)(int)$person['resolvido']; } unset($person);
            $albums = cb_sql('SELECT m.*,i.nome FROM mural m JOIN investigadores i ON i.id=m.investigador_id ORDER BY m.criado_em DESC LIMIT 500')->fetchAll(PDO::FETCH_ASSOC);
            cb_json(['ok' => true, 'investigadores' => $people, 'albuns' => $albums, 'vip_url' => cb_vip(),
              'total' => (int)cb_sql('SELECT count(*) FROM investigadores')->fetchColumn()]);
        }
        if (isset($_GET['export'])) {
            cb_require_admin(); cb_audit('exportar-contatos');
            header('Content-Type: text/csv; charset=utf-8'); header('Content-Disposition: attachment; filename="caso-black-contatos.csv"');
            $out = fopen('php://output', 'w'); fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Nome', 'E-mail', 'Telefone/WhatsApp', 'Origem', 'Cadastro', 'Provas', 'Caso resolvido', 'Consentimento'], ';');
            $s = cb_sql('SELECT i.nome,i.email,i.whatsapp,i.origem,i.criado_em,
              (SELECT count(*) FROM carimbos c WHERE c.investigador_id=i.id AND estacao<=5),
              EXISTS(SELECT 1 FROM carimbos c WHERE c.investigador_id=i.id AND estacao=6),i.lgpd FROM investigadores i ORDER BY criado_em DESC');
            while ($r = $s->fetch(PDO::FETCH_NUM)) {
                $r = array_map(fn($v) => is_string($v) && preg_match('/^[=+@\-\t\r]/', $v) ? "'" . $v : $v, $r);
                fputcsv($out, $r, ';');
            } fclose($out); exit;
        }
        if (isset($_GET['mural'])) {
            cb_require_admin();
            cb_json(cb_sql("SELECT id,equipe,criado_em,impresso_em FROM mural WHERE status='aprovado' ORDER BY criado_em")->fetchAll(PDO::FETCH_ASSOC));
        }
        if (isset($_GET['tv'])) {
            cb_require_admin(); $p = cb_tv_lista(); $base = dirname(__DIR__) . '/';
            cb_json(['ok' => true, 'videos' => array_map(fn($v) => ['arquivo' => $v, 'nome' => $p['nomes'][$v] ?? basename($v, '.mp4'), 'tamanho' => filesize($base . $v)], $p['lista'])]);
        }
        if (isset($_GET['imagem'])) {
            cb_require_admin(); $id = cb_uuid($_GET['imagem']);
            if (!cb_sql('SELECT 1 FROM mural WHERE id=?', [$id])->fetchColumn()) cb_fail('Álbum não encontrado.', 404);
            $file = cb_dir() . '/albuns/' . $id . '.jpg';
            if (!is_file($file)) cb_fail('Imagem não encontrada.', 404);
            header('Content-Type: image/jpeg'); header('Content-Length: ' . filesize($file));
            header('Content-Disposition: inline; filename="caso-black-' . $id . '.jpg"'); readfile($file); exit;
        }
        cb_json(['ok' => true, 'servico' => 'Caso Black']);
    }
    if ($method !== 'POST') cb_fail('Método não permitido.', 405);
    // Vídeo da TV: corpo cru (MP4) com CSRF no cabeçalho; vai direto para tv-videos/ e entra no fim da lista.
    if (isset($_GET['tv-video'])) {
        cb_require_admin(); cb_csrf(['csrf' => $_SERVER['HTTP_X_CSRF'] ?? '']);
        $len = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
        if ($len < 1000 || $len > 400000000) cb_fail('Envie um MP4 de até 400 MB.', 413);
        @set_time_limit(600);
        $dir = dirname(__DIR__) . '/tv-videos'; if (!is_dir($dir)) mkdir($dir, 0755);
        $nome = 'tv-videos/' . time() . '-' . bin2hex(random_bytes(3)) . '.mp4'; $file = dirname(__DIR__) . '/' . $nome;
        $in = fopen('php://input', 'rb'); $out = fopen("$file.part", 'wb'); $n = stream_copy_to_stream($in, $out, 400000001); fclose($in); fclose($out);
        if ($n > 400000000 || substr((string)file_get_contents("$file.part", false, null, 0, 12), 4, 4) !== 'ftyp') { @unlink("$file.part"); cb_fail('O arquivo não é um vídeo MP4.'); }
        rename("$file.part", $file); @chmod($file, 0644);
        $p = cb_tv_lista(); $p['lista'][] = $nome; $p['nomes'][$nome] = mb_substr(trim(rawurldecode($_SERVER['HTTP_X_NOME'] ?? '')), 0, 80) ?: 'Vídeo';
        cb_tv_salvar($p); cb_audit('tv-enviar', $nome); cb_json(['ok' => true]);
    }
    if (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== 0) cb_fail('Envie JSON.', 415);
    if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 6500000) cb_fail('Imagem muito grande.', 413);
    $raw = file_get_contents('php://input', false, null, 0, 6500001);
    if (strlen($raw) > 6500000) cb_fail('Envio muito grande.', 413);
    $b = json_decode($raw, true);
    if (!is_array($b)) cb_fail('Envio inválido.');
    $event = $b['evento'] ?? '';
    if ($event === 'login') {
        cb_csrf($b); cb_limit('login', 8, 900);
        if (!is_string($b['senha'] ?? null) || !password_verify($b['senha'], cb_config()['password_hash'])) cb_fail('Senha incorreta.', 401);
        session_regenerate_id(true); $_SESSION['admin_ate'] = time() + 28800; $_SESSION['csrf'] = bin2hex(random_bytes(24));
        cb_audit('login'); cb_json(['ok' => true, 'csrf' => $_SESSION['csrf']]);
    }
    if (in_array($event, ['logout', 'moderar', 'impressos', 'ajustes', 'tv-ordem', 'tv-remover'], true)) {
        cb_require_admin(); cb_csrf($b);
        if ($event === 'logout') { $_SESSION = []; session_destroy(); cb_json(['ok' => true]); }
        if ($event === 'moderar') {
            $id = cb_uuid($b['id'] ?? ''); $status = $b['status'] ?? '';
            if (!in_array($status, ['aprovado', 'rejeitado', 'pendente'], true)) cb_fail('Status inválido.');
            if (!cb_sql('SELECT 1 FROM mural WHERE id=?', [$id])->fetchColumn()) cb_fail('Álbum não encontrado.', 404);
            cb_sql('UPDATE mural SET status=?,moderado_em=? WHERE id=?', [$status, cb_now(), $id]); cb_audit('moderar-' . $status, $id);
        }
        if ($event === 'impressos') {
            $ids = $b['ids'] ?? []; if (!is_array($ids) || count($ids) > 100) cb_fail('Seleção inválida.');
            foreach ($ids as $id) { $id = cb_uuid($id); cb_sql("UPDATE mural SET impresso_em=? WHERE id=? AND status='aprovado'", [cb_now(), $id]); cb_audit('impresso', $id); }
        }
        if ($event === 'tv-ordem') {
            $p = cb_tv_lista(); $nova = $b['lista'] ?? null;
            if (!is_array($nova) || count($nova) !== count($p['lista']) || array_diff($p['lista'], $nova) || array_diff($nova, $p['lista'])) cb_fail('Lista desatualizada. Atualize a página.', 409);
            $p['lista'] = array_values($nova); cb_tv_salvar($p); cb_audit('tv-ordem');
        }
        if ($event === 'tv-remover') {
            $p = cb_tv_lista(); $v = $b['arquivo'] ?? '';
            if (!is_string($v) || !in_array($v, $p['lista'], true)) cb_fail('Vídeo não encontrado.', 404);
            $p['lista'] = array_values(array_diff($p['lista'], [$v])); unset($p['nomes'][$v]); cb_tv_salvar($p);
            if (str_starts_with($v, 'tv-videos/')) @unlink(dirname(__DIR__) . '/' . $v);
            cb_audit('tv-remover', $v);
        }
        if ($event === 'ajustes') {
            $url = trim((string)($b['vip_url'] ?? '')); $u = parse_url($url);
            if ($url !== '' && (strlen($url) > 500 || !$u || ($u['scheme'] ?? '') !== 'https' || !in_array(strtolower($u['host'] ?? ''), ['chat.whatsapp.com', 'wa.me', 'www.whatsapp.com', 'whatsapp.com'], true) || isset($u['user']) || isset($u['pass']))) cb_fail('Use um link HTTPS do WhatsApp.');
            cb_sql("INSERT INTO ajustes(chave,valor) VALUES('vip_url',?) ON CONFLICT(chave) DO UPDATE SET valor=excluded.valor", [$url]); cb_audit('configurar-vip');
        }
        cb_json(['ok' => true]);
    }
    // A chave de visitante protege cada ficha; ela nunca permite ler contatos ou álbuns de outras equipes.
    cb_limit('envio:' . substr(hash('sha256', cb_token()), 0, 16), 120, 600);
    if ($event === 'cadastro') {
        $id = cb_uuid($b['id'] ?? ''); $token = cb_token();
        $nome = cb_text($b['nome'] ?? '', 80); $email = strtolower(cb_text($b['email'] ?? '', 120));
        $phone = preg_replace('/\D/', '', (string)($b['whatsapp'] ?? ''));
        if (strlen($nome) < 2 || ($email === '' && $phone === '')) cb_fail('Preencha seu nome e e-mail ou telefone.');
        if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) cb_fail('Confira o e-mail.');
        if ($phone !== '' && (strlen($phone) < 10 || strlen($phone) > 13)) cb_fail('Use telefone com DDD.');
        if (($b['lgpd'] ?? false) !== true) cb_fail('É necessário autorizar o cadastro.');
        if (cb_sql('SELECT 1 FROM investigadores WHERE id=?', [$id])->fetchColumn()) cb_owner($id);
        else {
            cb_limit('cadastro', 300, 3600);
            cb_sql('INSERT INTO investigadores(id,token_hash,nome,email,whatsapp,lgpd,origem,criado_em) VALUES(?,?,?,?,?,1,?,?)',
              [$id, hash('sha256', $token), $nome, $email, $phone, cb_text($b['origem'] ?? 'carta-qr', 40), cb_now()]);
        }
        cb_json(['ok' => true, 'id' => $id]);
    }
    $id = cb_uuid($b['investigador_id'] ?? ''); cb_owner($id);
    if ($event === 'carimbo') {
        $n = $b['estacao'] ?? 0;
        if (!is_int($n) || $n < 1 || $n > 6) cb_fail('Estação inválida.');
        if ($n === 6 && (int)cb_sql('SELECT count(*) FROM carimbos WHERE investigador_id=? AND estacao<=5', [$id])->fetchColumn() < 5) cb_fail('Complete as cinco provas antes do final.');
        cb_sql('INSERT OR IGNORE INTO carimbos(investigador_id,estacao,via,criado_em) VALUES(?,?,?,?)', [$id, $n, cb_text($b['via'] ?? 'site', 30), cb_now()]);
        cb_json(['ok' => true]);
    }
    if ($event === 'feedback') {
        $nota = $b['nota'] ?? 0; if (!is_int($nota) || $nota < 1 || $nota > 3) cb_fail('Nota inválida.');
        cb_sql('INSERT OR IGNORE INTO feedback(id,investigador_id,nota,faltou,criado_em) VALUES(?,?,?,?,?)', [cb_uuid($b['id'] ?? ''), $id, $nota, cb_text($b['faltou'] ?? '', 500), cb_now()]);
        cb_json(['ok' => true]);
    }
    if ($event === 'mural') {
        $album = cb_uuid($b['id'] ?? ''); $equipe = cb_text($b['equipe'] ?? '', 40);
        if (strlen($equipe) < 2 || ($b['autorizo'] ?? false) !== true) cb_fail('Informe a equipe e autorize a exposição na recepção.');
        if (!cb_sql('SELECT 1 FROM carimbos WHERE investigador_id=? AND estacao=6', [$id])->fetchColumn()) cb_fail('Resolva o caso antes de enviar o álbum.');
        $exists = cb_sql('SELECT investigador_id,status FROM mural WHERE id=?', [$album])->fetch(PDO::FETCH_ASSOC);
        if ($exists) { if ($exists['investigador_id'] !== $id) cb_fail('Envio não autorizado.', 403); cb_json(['ok' => true, 'id' => $album, 'status' => $exists['status']]); }
        if ((int)cb_sql('SELECT count(*) FROM mural WHERE investigador_id=?', [$id])->fetchColumn() >= 3) cb_fail('Sua equipe já enviou três álbuns. Procure a recepção.');
        $image = $b['imagem'] ?? '';
        if (!is_string($image) || !preg_match('#^data:image/(?:jpeg|png|webp);base64,([a-zA-Z0-9+/=]+)$#', $image, $m)) cb_fail('Imagem inválida.');
        $bytes = base64_decode($m[1], true);
        if ($bytes === false || strlen($bytes) > 4000000) cb_fail('Imagem muito grande.', 413);
        $info = @getimagesizefromstring($bytes);
        if (!$info || $info[0] < 100 || $info[1] < 100 || $info[0] * $info[1] > 9000000 || !in_array($info['mime'], ['image/jpeg','image/png','image/webp'], true)) cb_fail('Foto inválida ou muito grande.');
        $im = @imagecreatefromstring($bytes); if (!$im) cb_fail('Não foi possível ler a foto.');
        $dir = cb_dir() . '/albuns'; if (!is_dir($dir)) mkdir($dir, 0700, true);
        $file = $dir . '/' . $album . '.jpg';
        if (!imagejpeg($im, $file, 87)) throw new RuntimeException('Falha ao gravar álbum.'); imagedestroy($im); @chmod($file, 0600);
        cb_sql('INSERT INTO mural(id,investigador_id,equipe,autorizo,criado_em) VALUES(?,?,?,1,?)', [$album, $id, $equipe, cb_now()]);
        cb_json(['ok' => true, 'id' => $album, 'status' => 'pendente']);
    }
    cb_fail('Operação desconhecida.');
} catch (Throwable $e) {
    error_log('Caso Black API: ' . get_class($e));
    cb_json(['ok' => false, 'erro' => 'Não foi possível concluir agora. Tente novamente.'], 503);
}
