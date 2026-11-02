#!/usr/bin/env python3
"""Veille des prix Starlink Roam.

Télécharge le catalogue public (≈ 96 Ko compressé), le compare à l'historique et
prévient par Telegram si le top 5 des moins chers bouge ou si quelque chose de
surprenant apparaît (baisse, essai, nouvelle formule, pays ajouté ou retiré).

Usage :
  promo_watch.py                  vérification quotidienne (envoie l'alerte si besoin)
  promo_watch.py --dry-run        affiche le message au lieu de l'envoyer, ne change pas l'état
  promo_watch.py --import-wayback DIR   charge dans l'historique des captures YYYYMMDDhhmmss*.json

Fichiers :
  ~/.config/starlink-watch/telegram.env   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
  ~/.local/share/starlink-watch/          history.jsonl, state.json, report.md
"""
import argparse
import datetime as dt
import gzip
import json
import os
import re
import statistics
import sys
import urllib.parse
import urllib.request

CATALOG_URL = "https://starlink.com/public-files/landing-prices.json"
RATES_URL = "https://open.er-api.com/v6/latest/XAF"
TOP_N = 5
DATA = os.path.expanduser("~/.local/share/starlink-watch")
ENV = os.path.expanduser("~/.config/starlink-watch/telegram.env")
HISTORY = os.path.join(DATA, "history.jsonl")
STATE = os.path.join(DATA, "state.json")
REPORT = os.path.join(DATA, "report.md")

DROP_MIN = 0.05      # baisse locale signalée dès 5 %
JUMP_MIN = 0.15      # hausse locale signalée dès 15 %
TRIAL_RATIO = 0.25   # prix < 25 % de la médiane mondiale du même forfait = essai probable


def http_get(url):
    req = urllib.request.Request(url, headers={"Accept-Encoding": "gzip", "User-Agent": "starlink-watch/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        raw = r.read()
        if r.headers.get("Content-Encoding") == "gzip" or raw[:2] == b"\x1f\x8b":
            raw = gzip.decompress(raw)
    return raw.decode("utf-8-sig")


def clean(name):
    return re.sub(r"\s+", " ", name.replace("<br>", " ")).strip()


def classify(name):
    """Renvoie (groupe, libellé) : 'essai' | 'capé' | 'illimité' | 'global' | None.

    Les essais (« 7-Day Trial - Roam - Unlimited », « Try Roam … ») ont existé en
    2025 au Japon et au Chili : ils sont mis à part, jamais dans le top 5."""
    n = clean(name)
    if "roam" not in n.lower():
        return None, n
    if re.search(r"trial|try|essai", n, re.I):
        return "essai", n
    if n.startswith("Global Roam"):
        return "global", n
    if n.startswith("Global Roam"):
        return "global", n
    if "Unlimited" in n:
        return "illimité", "Roam Illimité"
    m = re.search(r"(\d+)\s*GB", n)
    if m:
        return "capé", f"Roam {m.group(1)} Go"
    return None, n


def plans_from_catalog(catalog):
    """{ 'PAYS|nom' : [prix local, devise] } pour TOUTES les offres de TOUS les types
    (un Roam est déjà apparu dans le type 13, pas seulement le 8), plus les kits
    sous la clé 'PAYS|kit:nom'. Si un même nom existe dans plusieurs types, on
    garde le prix le plus bas : c'est celui qui intéresse."""
    out = {}
    for entry in catalog:
        for c in entry.get("countries", []):
            items = [(clean(s.get("description") or ""), s.get("price")) for s in c.get("subscriptions", [])]
            items += [("kit:" + clean(k.get("description") or ""), k.get("price")) for k in c.get("kits", [])]
            for name, price in items:
                if price is None or name in ("", "kit:"):
                    continue
                key = f"{c['regionCode']}|{name}"
                if key not in out or price < out[key][0]:
                    out[key] = [price, c["currencyCode"]]
    return out


def load_history():
    if not os.path.exists(HISTORY):
        return []
    with open(HISTORY, encoding="utf-8") as f:
        return [json.loads(l) for l in f if l.strip()]


def save_history(rows):
    os.makedirs(DATA, exist_ok=True)
    rows = sorted({r["date"]: r for r in rows}.values(), key=lambda r: r["date"])
    with open(HISTORY, "w", encoding="utf-8") as f:
        for r in rows:
            f.write(json.dumps(r, ensure_ascii=False, separators=(",", ":")) + "\n")


def fp(x):
    """Prix local lisible : 1639000 → '1 639 000', 89.0 → '89', 6.5 → '6.5'."""
    return (f"{x:,.2f}".rstrip("0").rstrip(".")).replace(",", " ")


def to_xaf(price, cur, rates):
    r = rates.get(cur)
    return price / r if r else None


def rank(plans, rates):
    """Classements par groupe, du moins cher au plus cher (prix en XAF)."""
    groups = {"capé": [], "illimité": [], "global": [], "essai": []}
    for key, (price, cur) in plans.items():
        country, raw = key.split("|", 1)
        grp, label = classify(raw)
        xaf = to_xaf(price, cur, rates)
        if grp and xaf:
            groups[grp].append({"country": country, "label": label, "price": price, "cur": cur, "xaf": xaf})
    for g in groups.values():
        g.sort(key=lambda p: p["xaf"])
    return groups


def top_key(items):
    return [f"{p['country']}|{p['label']}" for p in items[:TOP_N]]


def surprises(prev, cur, rates):
    """Compare deux catalogues (prix locaux). Renvoie une liste de phrases."""
    notes = []
    names = lambda d: {k.split("|", 1)[1] for k in d}
    countries = lambda d: {k.split("|", 1)[0] for k in d}
    watched = lambda n: re.search(r"roam|trial|try|free|promo|discount|mini", n, re.I)
    for n in sorted(filter(watched, names(cur) - names(prev))):
        notes.append(f"Nouvelle formule au catalogue : « {n} »")
    for n in sorted(filter(watched, names(prev) - names(cur))):
        notes.append(f"Formule disparue : « {n} »")
    for k, (p, c) in sorted(cur.items()):
        if classify(k.split("|", 1)[1])[0] == "essai" and k not in prev:
            notes.append(f"Essai Roam apparu : {k.replace('|', ' · ')} à {fp(p)} {c}")
    new_c, gone_c = countries(cur) - countries(prev), countries(prev) - countries(cur)
    if new_c:
        notes.append("Pays ajoutés : " + ", ".join(sorted(new_c)))
    if gone_c:
        notes.append("Pays retirés : " + ", ".join(sorted(gone_c)))

    medians = {}
    by_name = {}
    for k, (p, c) in cur.items():
        x = to_xaf(p, c, rates)
        if x:
            by_name.setdefault(classify(k.split("|", 1)[1])[1], []).append(x)
    for n, xs in by_name.items():
        medians[n] = statistics.median(xs)

    moves = []
    for k, (p, c) in cur.items():
        country, raw = k.split("|", 1)
        grp, label = classify(raw)
        is_mini = raw.startswith("kit:") and "mini" in raw.lower()
        if not grp and not is_mini:
            continue  # on ne suit que le Roam et le kit Mini
        xaf = to_xaf(p, c, rates)
        if grp in ("capé", "illimité") and xaf and xaf < TRIAL_RATIO * medians.get(label, 0):
            if k not in prev or prev[k][0] != p:
                    notes.append(f"Prix anormalement bas (essai ou promo ?) : {country} {label} à {fp(p)} {c} (≈ {xaf:,.0f} XAF)".replace(",", " "))
            continue
        if k not in prev or prev[k][1] != c or not prev[k][0]:
            continue
        old = prev[k][0]
        ch = p / old - 1
        label = label if grp else raw[4:]
        if ch <= -DROP_MIN:
            moves.append((is_mini, ch, f"Baisse : {country} {label} {fp(old)} → {fp(p)} {c} ({ch:+.0%})"))
        elif ch >= JUMP_MIN:
            moves.append((is_mini, ch, f"Hausse : {country} {label} {fp(old)} → {fp(p)} {c} ({ch:+.0%})"))
    moves.sort(key=lambda m: m[:2])  # forfaits Roam d'abord, puis kits Mini ; plus forte baisse en tête
    roam = [m[2] for m in moves if not m[0]]
    drops = sum(1 for m in moves if not m[0] and m[1] < 0)
    if drops >= 20:  # déjà vu le 4 mars 2026 : prix affichés HT pendant deux semaines, puis retour au TTC
        notes.append(f"⚠ {drops} baisses Roam simultanées : probablement un changement de présentation "
                     "(prix hors taxe) plutôt qu'une promotion. À vérifier avant de bouger.")
    kits = [m[2] for m in moves if m[0]]
    notes += roam  # toutes les variations Roam, sans plafond
    notes += kits[:5]
    if len(kits) > 5:
        notes.append(f"… et {len(kits) - 5} autres variations de prix du kit Mini")
    return notes


def fmt_top(title, items):
    lines = [title]
    for i, p in enumerate(items[:TOP_N], 1):
        lines.append(f"{i}. {p['country']} · {p['label']} · {p['xaf']:,.0f} XAF ({fp(p['price'])} {p['cur']})".replace(",", " "))
    return "\n".join(lines)


def build_report(groups, notes, moved, today):
    parts = [f"# Veille Roam — {today}", ""]
    parts.append(fmt_top("## Roam limité (tous volumes)", groups["capé"]))
    parts.append("")
    parts.append(fmt_top("## Roam Illimité", groups["illimité"]))
    parts.append("")
    if groups["essai"]:
        parts.append(fmt_top("## Essais Roam en cours", groups["essai"]))
        parts.append("")
    if groups["global"]:
        parts.append(fmt_top("## Global Roam (hors classement)", groups["global"]))
        parts.append("")
    parts.append("## À noter")
    parts += [f"- {n}" for n in notes] or ["- rien d'inhabituel"]
    parts.append("")
    parts.append("Top 5 modifié : " + ("oui" if moved else "non"))
    return "\n".join(parts) + "\n"


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


def import_wayback(directory):
    rows = {r["date"]: r for r in load_history()}
    n = 0
    for name in sorted(os.listdir(directory)):
        m = re.match(r"(\d{4})(\d{2})(\d{2})", name)
        if not m or not name.endswith(".json"):
            continue
        try:
            raw = open(os.path.join(directory, name), "rb").read()
            if raw[:2] == b"\x1f\x8b":
                raw = gzip.decompress(raw)
            plans = plans_from_catalog(json.loads(raw.decode("utf-8-sig")))
        except Exception:
            continue
        date = "-".join(m.groups())
        rows.setdefault(date, {"date": date, "source": "wayback", "plans": plans})
        n += 1
    save_history(list(rows.values()))
    print(f"{n} captures importées, {len(rows)} dates dans l'historique")


def main():
    try:
        run()
    except Exception as e:
        msg = f"Veille Starlink Roam : échec du passage ({type(e).__name__}: {str(e)[:200]})"
        print(msg, file=sys.stderr)
        if "--dry-run" not in sys.argv:
            telegram_send(msg)
        sys.exit(1)


def run():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--import-wayback")
    a = ap.parse_args()
    if a.import_wayback:
        return import_wayback(a.import_wayback)

    os.makedirs(DATA, exist_ok=True)
    today = dt.date.today().isoformat()
    plans = plans_from_catalog(json.loads(http_get(CATALOG_URL)))
    try:
        rates = json.loads(http_get(RATES_URL))["rates"]
    except Exception:
        if not os.path.exists(STATE):
            raise
        rates = json.load(open(STATE))["rates"]  # derniers taux connus
    groups = rank(plans, rates)

    state = json.load(open(STATE)) if os.path.exists(STATE) else {}
    history = [r for r in load_history() if r["date"] != today]
    prev_plans = history[-1]["plans"] if history else None

    tops = {g: top_key(groups[g]) for g in ("capé", "illimité")}
    first = "tops" not in state
    moved = [g for g in tops if not first and tops[g] != state["tops"].get(g)]
    notes = surprises(prev_plans, plans, rates) if prev_plans else []

    report = build_report(groups, notes, bool(moved), today)
    with open(REPORT, "w", encoding="utf-8") as f:
        f.write(report)

    send = bool(moved or notes) and not first
    if a.dry_run:
        print(report)
        print(f"[dry-run] alerte : {'oui' if send else 'non'} (top5 bougé : {moved or 'non'}, notes : {len(notes)})")
        return

    delivered = True
    if not send and dt.date.today().weekday() == 0:
        send, moved = True, []  # lundi : signe de vie, pour qu'un silence ne cache pas une panne
        report = report.replace("# Veille Roam", "# Veille Roam (point hebdomadaire)", 1)
    if send:
        head = "Veille Starlink Roam — le top 5 a bougé" if moved else (
            "Veille Starlink Roam — à noter" if notes else "Veille Starlink Roam — rien de neuf cette semaine")
        delivered = telegram_send(head + "\n\n" + report.split("\n", 2)[2])
    if delivered:  # si l'envoi échoue, on garde l'ancien état pour réessayer demain
        history.append({"date": today, "source": "live", "plans": plans})
        save_history(history)
        state = {"tops": tops, "rates": rates, "date": today}
        json.dump(state, open(STATE, "w"))
    print("ok" if delivered else "alerte non envoyée, état conservé")


if __name__ == "__main__":
    main()
