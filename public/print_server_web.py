#!/usr/bin/env python3
import http.server
import socketserver
import json
import threading
from print_order import print_order

class PrintWebHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        """Gérer les requêtes POST pour l'impression"""
        if self.path == '/print':
            try:
                # Lire les données de la commande
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                order_data = json.loads(post_data.decode('utf-8'))
                
                print(f"📨 Commande reçue: #{order_data.get('id', 'N/A')}")
                
                # Impression en arrière-plan
                def print_async():
                    success = print_order(order_data)
                    if success:
                        print(f"✅ Commande #{order_data.get('id', 'N/A')} imprimée !")
                    else:
                        print(f"❌ Échec impression #{order_data.get('id', 'N/A')}")
                
                # Lancer l'impression en arrière-plan
                thread = threading.Thread(target=print_async)
                thread.start()
                
                # Répondre immédiatement
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"status": "success", "message": "Impression lancée"}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
            except Exception as e:
                print(f"❌ Erreur: {e}")
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                response = {"status": "error", "message": str(e)}
                self.wfile.write(json.dumps(response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        """Gérer les requêtes OPTIONS pour CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    PORT = 8080
    
    with socketserver.TCPServer(("", PORT), PrintWebHandler) as httpd:
        print(f"🖨️ Serveur d'impression démarré sur le port {PORT}")
        print(f"URL: http://localhost:{PORT}/print")
        print("En attente des commandes...")
        httpd.serve_forever()
