#!/usr/bin/env python3
import http.server
import socketserver
import json
from datetime import datetime

class PrintHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        """Gérer les requêtes GET"""
        if self.path == '/api/print-order/escpos.txt':
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            
            # Contenu d'impression
            content = self.get_print_content()
            self.wfile.write(content)
            
            # Log
            print(f"[{datetime.now()}] GET - Impression envoyée à {self.client_address[0]}")
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """Gérer les requêtes POST de l'imprimante"""
        if self.path == '/api/print-order/escpos.txt':
            # Lire les données POST
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            # Log de la requête
            print(f"[{datetime.now()}] POST - Requête reçue de {self.client_address[0]}")
            print(f"Headers: {dict(self.headers)}")
            if post_data:
                print(f"Data: {post_data.decode('utf-8', errors='ignore')}")
            
            # Répondre avec le contenu d'impression
            self.send_response(200)
            self.send_header('Content-Type', 'application/octet-stream')
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            
            content = self.get_print_content()
            self.wfile.write(content)
            
            print(f"[{datetime.now()}] POST - Impression envoyée à {self.client_address[0]}")
        else:
            self.send_response(404)
            self.end_headers()
    
    def get_print_content(self):
        """Générer le contenu d'impression avec commandes ESC/POS"""
        content = b""
        
        # Commandes ESC/POS binaires
        content += b"\x1B\x40"  # ESC @ - Initialize printer
        content += b"\x1B\x61\x01"  # ESC a 1 - Center alignment
        
        # En-tête du restaurant
        content += b"\x1B\x21\x30"  # ESC ! 0 - Normal text
        content += b"SOY SAVOR\n"
        content += b"16 cours Carnot\n"
        content += b"13160 Chateaurenard\n"
        content += b"Tel: 04 90 24 00 00\n"
        content += b"================================\n"
        
        # Informations de la commande
        content += b"\x1B\x21\x10"  # ESC ! 16 - Double height
        content += b"COMMANDE #DEBUG\n"
        content += b"\x1B\x21\x00"  # ESC ! 0 - Normal text
        content += f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n".encode('utf-8')
        content += b"Type: TEST SERVER DIRECT PRINT\n"
        content += b"================================\n"
        
        # Articles de la commande
        content += b"\x1B\x21\x08"  # ESC ! 8 - Bold
        content += b"ARTICLES COMMANDES\n"
        content += b"\x1B\x21\x00"  # ESC ! 0 - Normal text
        content += b"================================\n"
        content += b"Test Article 1\n"
        content += b"Qte: 1 x 5.00EUR = 5.00EUR\n"
        content += b"--------------------------------\n"
        content += b"Test Article 2\n"
        content += b"Qte: 2 x 3.50EUR = 7.00EUR\n"
        content += b"--------------------------------\n"
        
        # Totaux
        content += b"================================\n"
        content += b"\x1B\x21\x08"  # Bold
        content += b"TOTAL: 12.00EUR\n"
        content += b"\x1B\x21\x00"  # Normal text
        
        # Pied de page
        content += b"================================\n"
        content += b"Merci pour votre commande !\n"
        content += b"Bon appetit !\n"
        content += b"\n\n\n"  # Espace pour couper
        
        # Couper le papier
        content += b"\x1D\x56\x00"  # GS V 0 - Full cut
        
        return content

if __name__ == "__main__":
    PORT = 8080
    
    with socketserver.TCPServer(("", PORT), PrintHandler) as httpd:
        print(f"Serveur d'impression démarré sur le port {PORT}")
        print(f"URL: http://192.168.1.113:{PORT}/api/print-order/escpos.txt")
        print("En attente des requêtes de l'imprimante...")
        httpd.serve_forever()
