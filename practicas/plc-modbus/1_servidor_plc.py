"""Servidor Modbus TCP que simula un PLC sencillo.

Mapeo de direcciones del "PLC virtual" (direcciones 1-based, como Modbus real):
  - Coils:     1 = motor 1, 2 = motor 2, 3 = alarma, 4 = principal
  - Discrete:  1 = boton START, 2 = boton STOP, 3 = sensor de nivel
  - Holding:   1 = velocidad motor 1, 2 = velocidad motor 2, 3 = temperatura
  - Input reg: 1 = cuenta de piezas

Uso: 1_servidor_plc.py [puerto]   (por defecto 5020)
"""
import sys

from pymodbus.server import StartTcpServer
from pymodbus.datastore import ModbusDeviceContext, ModbusSequentialDataBlock


def build_store():
    # Estado inicial del "PLC". La base debe ser >= 1 en pymodbus >= 3.11.
    base = 1
    coils = [False, False, False, True] + [False] * 196   # M1 M2 ALARMA PRINCIPAL
    discre = [False, False, False] + [False] * 197        # START STOP NIVEL
    holding = [1000, 1500, 40] + [0] * 197                # vel1 vel2 temp
    inputr = [0] * 200                                    # contador piezas

    return ModbusDeviceContext(
        di=ModbusSequentialDataBlock(base, [int(x) for x in discre]),
        co=ModbusSequentialDataBlock(base, [int(x) for x in coils]),
        hr=ModbusSequentialDataBlock(base, holding),
        ir=ModbusSequentialDataBlock(base, inputr),
    )


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5020
    context = build_store()
    print(f"[PLC virtual] escuchando en 0.0.0.0:{port}")
    print("Pulsa Ctrl+C para detener.")
    StartTcpServer(context=context, address=("0.0.0.0", port))


if __name__ == "__main__":
    main()