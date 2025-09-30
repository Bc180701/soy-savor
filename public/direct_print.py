#!/usr/bin/env python3
import socket
import time

def send_to_printer(printer_ip, printer_port, data):
    """Envoyer des données directement à l'imprimante"""
    try:
        # Connexion à l'imprimante
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect((printer_ip, printer_port))
        
        # Envoyer les données
        sock.send(data)
        
        # Fermer la connexion
        sock.close()
        
        print(f"✅ Données envoyées à {printer_ip}:{printer_port}")
        return True
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        return False

def generate_escpos_commands():
    """Générer les commandes ESC/POS"""
    content = b""
    
    # Commandes ESC/POS binaires
    content += b"\x1B\x40"  # ESC @ - Initialize printer
    content += b"\x1B\x61\x01"  # ESC a 1 - Center alignment
    
    # En-tête du restaurant
    content += b"\x1B\x21\x30"  # ESC ! 0 - Normal text
    content += b"SOY SAVOR\n"
    content += b"16 cours Carnot\n"
    content += b"13160 Châteaurenard\n"
    content += b"Tel: 04 90 24 00 00\n"
    content += b"================================\n"
    
    # Informations de la commande
    content += b"\x1B\x21\x10"  # ESC ! 16 - Double height
    content += b"COMMANDE #DEBUG\n"
    content += b"\x1B\x21\x00"  # ESC ! 0 - Normal text
    content += b"Date: 2024-01-01 12:00:00\n"
    content += b"Type: TEST DIRECT PRINT\n"
    content += b"================================\n"
    
    # Articles de la commande
    content += b"\x1B\x21\x08"  # ESC ! 8 - Bold
    content += b"ARTICLES COMMANDES\n"
    content += b"\x1B\x21\x00"  # ESC ! 0 - Normal text
    content += b"================================\n"
    content += b"Test Article 1\n"
    content += b"Qte: 1 x 5.00€ = 5.00€\n"
    content += b"--------------------------------\n"
    content += b"Test Article 2\n"
    content += b"Qte: 2 x 3.50€ = 7.00€\n"
    content += b"--------------------------------\n"
    
    # Totaux
    content += b"================================\n"
    content += b"\x1B\x21\x08"  # Bold
    content += b"TOTAL: 12.00€\n"
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
    # Configuration de l'imprimante
    PRINTER_IP = "192.168.1.129"
    PRINTER_PORT = 9100  # Port standard pour impression directe
    
    print(f"🖨️ Test d'impression directe sur {PRINTER_IP}:{PRINTER_PORT}")
    
    # Générer les commandes ESC/POS
    escpos_data = generate_escpos_commands()
    
    # Envoyer à l'imprimante
    success = send_to_printer(PRINTER_IP, PRINTER_PORT, escpos_data)
    
    if success:
        print("✅ Impression envoyée ! Vérifiez l'imprimante.")
    else:
        print("❌ Échec de l'impression. Vérifiez la connexion.")
