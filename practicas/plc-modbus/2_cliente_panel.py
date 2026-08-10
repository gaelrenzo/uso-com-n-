"""Cliente Modbus TCP: panel de operador para el PLC virtual.

Lee y escribe las direcciones del servidor "1_servidor_plc.py".
Direcciones 1-based: M1=coil 1, M2=coil 2, alarma=coil 3, principal=coil 4.
  Holding: 1=vel1, 2=vel2, 3=temp.  Input: 1=piezas.

Uso: 2_cliente_panel.py [host] [puerto]   (por defecto 127.0.0.1 5020)
"""
import sys
import time

from pymodbus.client import ModbusTcpClient


def dprint(tag, result):
    print(f"  {tag}: {result}")


def main():
    host = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 5020

    client = ModbusTcpClient(host=host, port=port, timeout=3)
    if not client.connect():
        print(f"No se pudo conectar a {host}:{port}. ¿El servidor PLC está encendido?")
        return

    print(f"Conectado al PLC virtual en {host}:{port}\n")

    # 1) Arranque de la linea
    print("== Arranque ==")
    dprint("Prender motor 1 (coil 1)", client.write_coil(1, True))
    dprint("Subir velocidad motor 1 a 1750 rpm (hold 1)", client.write_register(1, 1750))
    time.sleep(0.5)

    # 2) Lectura de estado
    print("\n== Estado de la linea ==")
    dprint("Coils 1-4", client.read_coils(1, 4))
    dprint("Velocidades (rpm)", client.read_holding_registers(1, 3))
    dprint("Contador de piezas", client.read_input_registers(1, 1))

    # 3) Simulacion de alarma
    print("\n== Prueba de alarma ==")
    dprint("Activar alarma (coil 3)", client.write_coil(3, True))
    dprint("Leer alarma", client.read_coil(3))
    dprint("Desactivar alarma", client.write_coil(3, False))

    # 4) Apagado
    print("\n== Parada ==")
    dprint("Apagar motor 1", client.write_coil(1, False))

    client.close()
    print("\nPanel finalizado.")


if __name__ == "__main__":
    main()