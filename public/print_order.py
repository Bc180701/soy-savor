#!/usr/bin/env python3
import socket
import json
import sys
from datetime import datetime

def print_order(order_data):
    """Impression d'une commande via Wi-Fi Direct"""
    
    PRINTER_IP = "192.168.1.129"
    PRINTER_PORT = 9100
    
    try:
        # Parser les données de la commande
        if isinstance(order_data, str):
            order = json.loads(order_data)
        else:
            order = order_data
        
        # Générer le contenu d'impression
        content = generate_print_content(order)
        
        # Connexion et impression
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(10)
        sock.connect((PRINTER_IP, PRINTER_PORT))
        
        sock.send(content)
        sock.close()
        
        print(f"✅ Commande #{order.get('id', 'N/A')} imprimée avec succès !")
        return True
        
    except Exception as e:
        print(f"❌ Erreur impression: {e}")
        return False

def generate_print_content(order):
    """Générer le contenu d'impression"""
    content = b""
    
    # En-tête du restaurant
    content += b"SOY SAVOR\n"
    content += b"16 cours Carnot\n"
    content += b"13160 Chateaurenard\n"
    content += b"Tel: 04 90 24 00 00\n"
    content += b"================================\n"
    
    # Informations de la commande
    content += f"COMMANDE #{order.get('id', 'N/A')}\n".encode('utf-8')
    content += f"Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n".encode('utf-8')
    content += f"Type: {order.get('delivery_type', 'N/A')}\n".encode('utf-8')
    content += b"================================\n"
    
    # Articles de la commande
    content += b"ARTICLES COMMANDES\n"
    content += b"================================\n"
    
    # Utiliser cartBackupItems si disponible
    items = order.get('cartBackupItems', [])
    if not items:
        items = order.get('items', [])
    
    total = 0
    for item in items:
        name = item.get('name', 'Article inconnu')
        quantity = item.get('quantity', 1)
        price = item.get('price', 0)
        item_total = quantity * price
        
        content += f"{name}\n".encode('utf-8')
        content += f"Qte: {quantity} x {price:.2f}EUR = {item_total:.2f}EUR\n".encode('utf-8')
        content += b"--------------------------------\n"
        total += item_total
    
    # Totaux
    content += b"================================\n"
    content += f"TOTAL: {total:.2f}EUR\n".encode('utf-8')
    content += b"================================\n"
    
    # Pied de page
    content += b"Merci pour votre commande !\n"
    content += b"Bon appetit !\n"
    content += b"\n\n\n"
    
    return content

if __name__ == "__main__":
    # Test avec des données d'exemple
    test_order = {
        "id": "TEST-001",
        "delivery_type": "LIVRAISON",
        "cartBackupItems": [
            {"name": "Poké Créa", "quantity": 2, "price": 12.50},
            {"name": "Sushi Créa", "quantity": 1, "price": 15.00}
        ]
    }
    
    print("🖨️ Test d'impression de commande...")
    success = print_order(test_order)
    
    if success:
        print("🎉 Test réussi !")
    else:
        print("❌ Test échoué !")
