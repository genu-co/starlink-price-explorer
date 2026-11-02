#!/usr/bin/env python3
"""Veille des e-mails Starlink sur abrico.shal@gmail.com (lecture seule).

Chaque mail est rattaché à un pays via l'alias abrico.shal+<pays>@gmail.com
présent dans To / Delivered-To / Cc, puis analysé pour repérer les offres
(coupon, réduction, essai, changement de prix, montants).

Usage :
  gmail_watch.py --auth        autorisation OAuth (navigateur, loopback + PKCE)
  gmail_watch.py               vérification (Telegram seulement si nouveautés pertinentes)
  gmail_watch.py --backfill    tout l'historique Starlink, rapport par pays, sans Telegram
  gmail_watch.py --dry-run     affiche le message au lieu de l'envoyer, ne change pas l'état
  gmail_watch.py --days N      fenêtre de recherche au premier lancement (défaut 7)

Fichiers :
  ~/.config/starlink-watch/gmail_client.json   client OAuth « Desktop app » (Google Cloud)
  ~/.config/starlink-watch/gmail_token.json    refresh token (600)
  ~/.config/starlink-watch/telegram.env        TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
  ~/.local/share/starlink-watch/               gmail_state.json, gmail_report.md

Seul le scope gmail.readonly est demandé : le script ne peut ni modifier,
ni étiqueter, ni marquer comme lu.
"""
import argparse
import base64
import datetime as dt
import hashlib
import html
import http.server
import json
import os
import re
import secrets
import sys
import urllib.error
import urllib.parse
import urllib.request
import webbrowser

SCOPE = "https://www.googleapis.com/auth/gmail.readonly"
API = "https://gmail.googleapis.com/gmail/v1/users/me"
CFG = os.path.expanduser("~/.config/starlink-watch")
DATA = os.path.expanduser("~/.local/share/starlink-watch")
CLIENT = os.path.join(CFG, "gmail_client.json")
TOKEN = os.path.join(CFG, "gmail_token.json")
ENV = os.path.join(CFG, "telegram.env")
STATE = os.path.join(DATA, "gmail_state.json")
REPORT = os.path.join(DATA, "gmail_report.md")
QUERY = "from:(starlink.com OR spacex.com)"
NO_ALIAS = "(sans alias)"

ALIAS_RE = re.compile(r"abrico\.shal\+([a-z0-9._-]+)@gmail\.com", re.I)

# Mots-clés d'offre (EN/FR/ES/IT/PT). Les formes courtes sont bornées par \b.
OFFER_WORDS = [
    # anglais
    "coupon", "discount", "promo", "promotion", "offer", "trial", "free month",
    "months free", "month free", "price change", "price update", "new price",
    "lower price", "reduced", "save", "savings", "deal", r"\d+\s*% off", "half price",
    # français
    "réduction", "remise", "offre", "essai", "mois gratuit", "mois offert",
    "changement de prix", "nouveau prix", "baisse de prix", "code promo",
    # espagnol
    "descuento", "oferta", "prueba", "mes gratis", "cambio de precio", "rebaja",
    # italien
    "sconto", "offerta", "prova", "mese gratis", "mese gratuito", "variazione di prezzo",
    "nuovo prezzo", "codice",
    # portugais
    "desconto", "oferta", "teste", "mês grátis", "grátis", "alteração de preço",
    "novo preço",
]
OFFER_RE = re.compile(r"(?<!\w)(" + "|".join(sorted(set(OFFER_WORDS), key=len, reverse=True)) + r")(?!\w)", re.I)

# Montants : symbole ou code devise avant ou après le nombre.
CUR = r"(?:[$€£¥₦₹]|R\$|US\$|Bs\.?|FCFA|XAF|EUR|USD|GBP|BOB|NGN|KES|RWF|ZAR|BRL|MXN|COP|PEN|CLP|ARS|PHP|MWK|ZMW|GHS|XOF)"
NUM = r"\d{1,3}(?:[ .,  ]\d{3})*(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?"
AMOUNT_RE = re.compile(rf"(?<![\w]){CUR}\s?(?:{NUM})|(?:{NUM})\s?{CUR}(?![A-Za-z])")


# ---------------------------------------------------------------- analyse pure

def country_of(headers):
    """Pays de l'alias trouvé dans To/Delivered-To/Cc (dict nom→valeur, insensible à la casse)."""
    h = {k.lower(): v for k, v in headers.items()}
    for name in ("delivered-to", "to", "cc", "x-original-to"):
        m = ALIAS_RE.search(h.get(name, "") or "")
        if m:
            return m.group(1).lower()
    return NO_ALIAS


def b64url_decode(data):
    """Décode le base64url de Gmail (sans padding) en texte UTF-8."""
    data = data or ""
    raw = base64.urlsafe_b64decode(data + "=" * (-len(data) % 4))
    return raw.decode("utf-8", errors="replace")


def strip_html(s):
    s = re.sub(r"(?is)<(script|style)\b.*?</\1>", " ", s)
    s = re.sub(r"(?i)<br\s*/?>|</p>|</div>|</tr>", "\n", s)
    s = re.sub(r"<[^>]+>", " ", s)
    s = html.unescape(s)
    return re.sub(r"[ \t ]+", " ", re.sub(r"\n\s*\n+", "\n", s)).strip()


def body_text(payload):
    """Texte du message : parties text/plain, sinon text/html dépouillé."""
    plain, rich = [], []

    def walk(p):
        mt = (p.get("mimeType") or "").lower()
        data = (p.get("body") or {}).get("data")
        if data and mt == "text/plain":
            plain.append(b64url_decode(data))
        elif data and mt == "text/html":
            rich.append(b64url_decode(data))
        for c in p.get("parts") or []:
            walk(c)

    walk(payload or {})
    if plain:
        return "\n".join(plain).strip()
    return strip_html("\n".join(rich))


def detect_offers(text):
    """Renvoie (mots-clés trouvés, montants trouvés), dédoublonnés dans l'ordre."""
    kw = list(dict.fromkeys(m.group(1).lower() for m in OFFER_RE.finditer(text or "")))
    amounts = list(dict.fromkeys(re.sub(r"\s+", " ", m.group(0)).strip() for m in AMOUNT_RE.finditer(text or "")))
    return kw, amounts


def analyse(msg):
    """Message Gmail (format=full) → dict résumé."""
    payload = msg.get("payload") or {}
    headers = {}
    for h in payload.get("headers") or []:
        n = h.get("name", "")
        headers[n] = (headers.get(n, "") + " " + h.get("value", "")).strip()
    hl = {k.lower(): v for k, v in headers.items()}
    text = body_text(payload)
    subject = hl.get("subject", "")
    kw, amounts = detect_offers(subject + "\n" + text)
    ts = int(msg.get("internalDate", "0")) // 1000
    return {
        "id": msg.get("id"),
        "date": dt.datetime.fromtimestamp(ts, dt.timezone.utc).strftime("%Y-%m-%d"),
        "ts": ts,
        "from": hl.get("from", ""),
        "subject": subject,
        "country": country_of(headers),
        "keywords": kw,
        "amounts": amounts[:6],
        "relevant": bool(kw),
        "snippet": html.unescape(msg.get("snippet", ""))[:200],
    }


# ---------------------------------------------------------------- OAuth

def load_client():
    with open(CLIENT, encoding="utf-8") as f:
        d = json.load(f)
    c = d.get("installed") or d.get("web")
    if not c:
        sys.exit("gmail_client.json : clé « installed » absente (créer un client « Desktop app »)")
    return c


def post_form(url, fields):
    data = urllib.parse.urlencode(fields).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:  # n'afficher que le code d'erreur OAuth, jamais de jeton
        try:
            err = json.load(e).get("error", "?")
        except Exception:
            err = "?"
        sys.exit(f"OAuth : échec HTTP {e.code} ({err})")


def save_token(tok):
    os.makedirs(CFG, mode=0o700, exist_ok=True)
    fd = os.open(TOKEN + ".tmp", os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        json.dump(tok, f)
    os.chmod(TOKEN + ".tmp", 0o600)
    os.replace(TOKEN + ".tmp", TOKEN)


def auth():
    c = load_client()
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    state = secrets.token_urlsafe(24)
    result = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if "code" not in q and "error" not in q:
                self.send_response(404); self.end_headers(); return
            result.update({k: v[0] for k, v in q.items()})
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()
            self.wfile.write("<p>Autorisation reçue, tu peux fermer cet onglet.</p>".encode())

        def log_message(self, *a):  # pas de log : l'URL contient le code
            pass

    srv = http.server.HTTPServer(("127.0.0.1", 0), Handler)
    redirect = f"http://127.0.0.1:{srv.server_port}"
    url = c["auth_uri"] + "?" + urllib.parse.urlencode({
        "client_id": c["client_id"], "redirect_uri": redirect, "response_type": "code",
        "scope": SCOPE, "state": state, "code_challenge": challenge,
        "code_challenge_method": "S256", "access_type": "offline", "prompt": "consent",
        "login_hint": "abrico.shal@gmail.com",
    })
    print("Ouvre ce lien si le navigateur ne s'ouvre pas :\n" + url)
    webbrowser.open(url)
    srv.timeout = 10
    deadline = dt.datetime.now() + dt.timedelta(minutes=5)
    while not result and dt.datetime.now() < deadline:
        srv.handle_request()
    srv.server_close()
    if not result:
        sys.exit("Délai de 5 min dépassé sans réponse OAuth")
    if result.get("error"):
        sys.exit(f"Autorisation refusée : {result['error']}")
    if result.get("state") != state:
        sys.exit("Paramètre state invalide : autorisation abandonnée")
    tok = post_form(c["token_uri"], {
        "code": result["code"], "client_id": c["client_id"], "client_secret": c.get("client_secret", ""),
        "redirect_uri": redirect, "grant_type": "authorization_code", "code_verifier": verifier,
    })
    if "refresh_token" not in tok:
        sys.exit("Pas de refresh token reçu (révoquer l'accès dans le compte Google puis relancer --auth)")
    granted = tok.get("scope", "").split()
    if granted and granted != [SCOPE]:
        sys.exit(f"Scopes inattendus accordés : {granted} — jeton non enregistré")
    save_token({"refresh_token": tok["refresh_token"], "scope": SCOPE,
                "created": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")})
    print(f"Jeton enregistré dans {TOKEN} (600). Lance maintenant --backfill.")


def access_token():
    c = load_client()
    try:
        with open(TOKEN, encoding="utf-8") as f:
            rt = json.load(f)["refresh_token"]
    except FileNotFoundError:
        sys.exit("Pas de jeton : lancer d'abord gmail_watch.py --auth")
    tok = post_form(c["token_uri"], {"client_id": c["client_id"], "client_secret": c.get("client_secret", ""),
                                     "refresh_token": rt, "grant_type": "refresh_token"})
    return tok["access_token"]


# ---------------------------------------------------------------- API Gmail (GET uniquement)

def api_get(token, path, **params):
    url = f"{API}/{path}" + ("?" + urllib.parse.urlencode(params) if params else "")
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"Gmail API : HTTP {e.code} sur {path.split('?')[0]}")


def list_ids(token, query):
    ids, page = [], None
    while True:
        params = {"q": query, "maxResults": 500, "includeSpamTrash": "false"}
        if page:
            params["pageToken"] = page
        r = api_get(token, "messages", **params)
        ids += [m["id"] for m in r.get("messages", [])]
        page = r.get("nextPageToken")
        if not page:
            return ids


# ---------------------------------------------------------------- état, rapport, Telegram

def load_state():
    try:
        with open(STATE, encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def save_state(st):
    os.makedirs(DATA, exist_ok=True)
    with open(STATE + ".tmp", "w", encoding="utf-8") as f:
        json.dump(st, f, indent=1)
    os.replace(STATE + ".tmp", STATE)


def build_report(items, title):
    by = {}
    for it in sorted(items, key=lambda x: x["ts"], reverse=True):
        by.setdefault(it["country"], []).append(it)
    out = [f"# {title}", "", f"{len(items)} message(s), {sum(i['relevant'] for i in items)} avec offre probable", ""]
    for country in sorted(by, key=lambda k: (k == NO_ALIAS, k)):
        lst = by[country]
        out.append(f"## {country} ({len(lst)})")
        for it in lst:
            mark = "🎯 " if it["relevant"] else ""
            out.append(f"- {it['date']} {mark}{it['subject']}")
            if it["relevant"]:
                extra = ", ".join(it["keywords"][:6])
                if it["amounts"]:
                    extra += " | " + ", ".join(it["amounts"])
                out.append(f"  - {extra}")
        out.append("")
    return "\n".join(out)


def telegram_msg(items):
    rel = [i for i in items if i["relevant"]]
    lines = [f"📧 Starlink : {len(rel)} e-mail(s) avec offre"]
    for it in sorted(rel, key=lambda x: (x["country"], x["ts"])):
        amt = f" ({', '.join(it['amounts'][:3])})" if it["amounts"] else ""
        lines.append(f"• [{it['country']}] {it['subject'][:90]}{amt} — {', '.join(it['keywords'][:4])}")
    return "\n".join(lines)[:4000]


def telegram_send(text):
    env = {}
    with open(ENV, encoding="utf-8") as f:
        for l in f:
            if "=" in l and not l.startswith("#"):
                k, v = l.strip().split("=", 1)
                env[k] = v.strip().strip('"')
    data = urllib.parse.urlencode({"chat_id": env["TELEGRAM_CHAT_ID"], "text": text}).encode()
    url = f"https://api.telegram.org/bot{env['TELEGRAM_BOT_TOKEN']}/sendMessage"
    try:
        with urllib.request.urlopen(urllib.request.Request(url, data=data), timeout=30) as r:
            return json.load(r).get("ok", False)
    except Exception as e:  # le message d'erreur ne doit jamais contenir l'URL (jeton)
        print(f"Telegram : échec ({type(e).__name__})", file=sys.stderr)
        return False


# ---------------------------------------------------------------- principal

def run():
    ap = argparse.ArgumentParser(description="Veille Gmail Starlink (lecture seule)")
    ap.add_argument("--auth", action="store_true")
    ap.add_argument("--backfill", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--days", type=int, default=7)
    a = ap.parse_args()
    if a.auth:
        return auth()

    st = load_state()
    seen = set(st.get("seen_ids", []))
    if a.backfill:
        query = QUERY
    elif st.get("last_ts"):
        query = f"{QUERY} after:{int(st['last_ts']) - 86400}"  # marge d'un jour, dédoublonné par id
    else:
        query = f"{QUERY} newer_than:{a.days}d"

    token = access_token()
    ids = list_ids(token, query)
    todo = ids if a.backfill else [i for i in ids if i not in seen]
    items = [analyse(api_get(token, f"messages/{i}", format="full")) for i in todo]

    today = dt.date.today().isoformat()
    title = f"Starlink Gmail — {'historique complet' if a.backfill else 'nouveaux messages'} ({today})"
    report = build_report(items, title)
    os.makedirs(DATA, exist_ok=True)
    if not a.dry_run:
        with open(REPORT, "w", encoding="utf-8") as f:
            f.write(report)

    if a.backfill or a.dry_run or not any(i["relevant"] for i in items):
        print(report)
    if not a.backfill and any(i["relevant"] for i in items):
        msg = telegram_msg(items)
        if a.dry_run:
            print("--- Telegram (non envoyé) ---\n" + msg)
        elif not telegram_send(msg):
            return 1  # état non mis à jour : on réessaiera au prochain passage

    if not a.dry_run:
        seen |= set(i["id"] for i in items)
        last = max([st.get("last_ts", 0)] + [i["ts"] for i in items])
        save_state({"last_ts": last, "seen_ids": sorted(seen)[-5000:], "updated": today})
    return 0


if __name__ == "__main__":
    sys.exit(run())
