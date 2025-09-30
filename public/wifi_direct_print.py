#!/usr/bin/env python3
import socket
import time
import json

def print_via_wifi_direct():
    """Impression via Wi-Fi Direct de l'imprimante"""
    
    # Adresses possibles pour Wi-Fi Direct
    WIFI_DIRECT_IPS = [
        "192.168.1.129",  # IP actuelle
        "192.168.4.1",    # IP par défaut Wi-Fi Direct
        "192.168.1.1",    # IP alternative
    ]
    
    PRINTER_PORT = 9100  # Port standard pour impression directe
    
    # Contenu d'impression simple
    content = b"SOY SAVOR\n"
    content += b"16 cours Carnot\n"
    content += b"13160 Chateaurenard\n"
    content += b"Tel: 04 90 24 00 00\n"
    content += b"================================\n"
    content += b"COMMANDE #TEST WIFI DIRECT\n"
    content += b"Date: 2024-01-01 12:00:00\n"
    content += b"Type: TEST WIFI DIRECT\n"
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
    
    for ip in WIFI_DIRECT_IPS:
        try:
            print(f"🔄 Tentative de connexion à {ip}:{PRINTER_PORT}...")
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect((ip, PRINTER_PORT))
            
            print(f"✅ Connexion réussie à {ip} !")
            print("📤 Envoi des données...")
            sock.send(content)
            
            sock.close()
            print("🎉 Impression envoyée avec succès !")
            return True
            
        except Exception as e:
            print(f"❌ Échec sur {ip}: {e}")
            continue
    
    print("❌ Aucune connexion possible")
    return False

def test_printer_connectivity():
    """Tester la connectivité avec l'imprimante"""
    print("🔍 Test de connectivité...")
    
    # Ping test
    import subprocess
    result = subprocess.run(['ping', '-n', '1', '192.168.1.129'], 
                          capture_output=True, text=True)
    
    if result.returncode == 0:
        print("✅ Ping réussi vers 192.168.1.129")
    else:
        print("❌ Ping échoué vers 192.168.1.129")
    
    # Test de port
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(3)
        result = sock.connect_ex(('192.168.1.129', 9100))
        sock.close()
        
        if result == 0:
            print("✅ Port 9100 ouvert sur 192.168.1.129")
        else:
            print("❌ Port 9100 fermé sur 192.168.1.129")
    except Exception as e:
        print(f"❌ Erreur test port: {e}")

if __name__ == "__main__":
    print("🖨️ Test d'impression Wi-Fi Direct...")
    print("=" * 50)
    
    # Test de connectivité
    test_printer_connectivity()
    print("=" * 50)
    
    # Test d'impression
    success = print_via_wifi_direct()
    
    if success:
        print("\n🎉 SUCCÈS ! Vérifiez l'imprimante !")
    else:
        print("\n❌ Échec. Vérifiez la configuration Wi-Fi Direct.")
