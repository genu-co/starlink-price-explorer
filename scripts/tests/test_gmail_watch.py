"""Tests hors réseau de l'analyse de gmail_watch.py.

Lancer : python3 -I -m unittest discover -s scripts/tests
"""
import base64
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
import gmail_watch as gw  # noqa: E402


def enc(s):
    return base64.urlsafe_b64encode(s.encode()).rstrip(b"=").decode()


class Pays(unittest.TestCase):
    def test_delivered_to(self):
        self.assertEqual(gw.country_of({"Delivered-To": "abrico.shal+bolivia@gmail.com"}), "bolivia")

    def test_to_avec_nom_et_casse(self):
        self.assertEqual(gw.country_of({"to": "Abrico <Abrico.Shal+Italy@gmail.com>"}), "italy")

    def test_pays_compose(self):
        self.assertEqual(gw.country_of({"To": "abrico.shal+south-africa@gmail.com"}), "south-africa")

    def test_sans_alias(self):
        self.assertEqual(gw.country_of({"To": "abrico.shal@gmail.com"}), gw.NO_ALIAS)


class Offres(unittest.TestCase):
    def test_italien(self):
        kw, amt = gw.detect_offers("Sconto del 50%: offerta Roam a 29 € al mese")
        self.assertIn("sconto", kw)
        self.assertIn("offerta", kw)
        self.assertIn("29 €", amt)

    def test_anglais_pourcentage(self):
        kw, amt = gw.detect_offers("Get 50% off your first month, free month trial. Now US$ 49.00")
        self.assertTrue({"50% off", "free month", "trial"} <= set(kw))
        self.assertIn("US$ 49.00", amt)

    def test_espagnol_francais_portugais(self):
        self.assertIn("descuento", gw.detect_offers("Un descuento exclusivo")[0])
        self.assertIn("mois offert", gw.detect_offers("Un mois offert !")[0])
        self.assertIn("desconto", gw.detect_offers("Ganhe desconto de R$ 100")[0])
        self.assertIn("R$ 100", gw.detect_offers("Ganhe desconto de R$ 100")[1])

    def test_montant_code_apres(self):
        self.assertIn("19 000 XAF", gw.detect_offers("Prix : 19 000 XAF")[1])

    def test_pas_de_faux_positif(self):
        kw, _ = gw.detect_offers("Your order has shipped. Tracking number attached.")
        self.assertEqual(kw, [])
        # « offer » ne doit pas matcher à l'intérieur d'un autre mot
        self.assertEqual(gw.detect_offers("offering")[0], [])


class Decodage(unittest.TestCase):
    def test_base64url_sans_padding(self):
        self.assertEqual(gw.b64url_decode(enc("Prova gratuita — ½ prezzo ✓")), "Prova gratuita — ½ prezzo ✓")

    def test_caracteres_url_safe(self):
        s = "\xff\xfe>>??"
        self.assertIn("-", enc(s) + base64.urlsafe_b64encode(b"\xfb\xff").decode())
        self.assertEqual(gw.b64url_decode(enc(s)), s)

    def test_plain_prioritaire(self):
        payload = {"mimeType": "multipart/alternative", "parts": [
            {"mimeType": "text/html", "body": {"data": enc("<p>HTML</p>")}},
            {"mimeType": "text/plain", "body": {"data": enc("Texte brut")}},
        ]}
        self.assertEqual(gw.body_text(payload), "Texte brut")

    def test_html_depouille(self):
        payload = {"mimeType": "multipart/mixed", "parts": [{"mimeType": "multipart/alternative", "parts": [
            {"mimeType": "text/html", "body": {"data": enc(
                "<style>p{}</style><p>Sconto&nbsp;<b>50%</b></p><script>x()</script>")}}]}]}
        self.assertEqual(gw.body_text(payload), "Sconto 50%")

    def test_analyse_complete(self):
        msg = {"id": "abc", "internalDate": "1767225600000", "snippet": "x", "payload": {
            "mimeType": "text/plain", "body": {"data": enc("Usa il codice ROAM50 per uno sconto")},
            "headers": [{"name": "To", "value": "abrico.shal+italy@gmail.com"},
                        {"name": "Subject", "value": "Offerta Starlink"},
                        {"name": "From", "value": "Starlink <no-reply@starlink.com>"}]}}
        r = gw.analyse(msg)
        self.assertEqual((r["country"], r["date"], r["relevant"]), ("italy", "2026-01-01", True))
        self.assertIn("sconto", r["keywords"])


if __name__ == "__main__":
    unittest.main()
