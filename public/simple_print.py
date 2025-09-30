#!/usr/bin/env python3
import socket
import time

def print_direct():
    """Impression directe via port 9100"""
    PRINTER_IP = "192.168.1.129"
    PRINTER_PORT = 9100
    
    # Contenu simple pour test
    content = b"SOY SAVOR\n"
    content += b"16 cours Carnot\n"
    content += b"13160 Chateaurenard\n"
    content += b"Tel: 04 90 24 00 00\n"
    content += b"================================\n"
    content += b"COMMANDE #TEST\n"
    content += b"Date: 2024-01-01 12:00:00\n"
    content += b"Type: TEST DIRECT\n"
    content += b"================================\n"
    content += b"Test Article 1\n"
    content += b"Qte: 1 x 5.00EUR = 5.00EUR\n"
    content += b"--------------------------------\n"
    content += b"================================\n"
    content += b"TOTAL: 5.00EUR\n"
    content += b"================================\n"
    content += b"Merci pour votre commande !\n"
    content += b"Bon appetit !\n"
    content += b"\n\n\n"
    
    try:
        print(f"Connexion a l'imprimante {PRINTER_IP}:{PRINTER_PORT}...")
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect((PRINTER_IP, PRINTER_PORT))
        
        print("Envoi des donnees...")
        sock.send(content)
        
        sock.close()
        print("✅ Impression envoyee !")
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

if __name__ == "__main__":
    print("🖨️ Test d'impression directe...")
    success = print_direct()
    
    if success:
        print("Vérifiez l'imprimante !")
    else:
        print("Échec de l'impression.")
