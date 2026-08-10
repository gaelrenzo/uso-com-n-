"""Esqueleto para escaneo/lectura ciclica (polling) tipo SCADA.

Un SCADA lee el PLC en bucle. Aquí leemos el estado cada 2 segundos.
Si quieres probar con un dispositivo RTU real (RS-485 / USB-serial),
cambia ModbusTcpClient por ModbusSerialClient(port='/dev/ttyUSB0', baudrate=9600).

Direcciones 1-based (ver 1_servidor_plc.py).

Uso: 3_escaneo_rtu_futuro.py [host] [puerto]
"""
import sys
import time

from pymodbus.client import ModbusTcpClient


def green(text):
    return f"\033[92m{text}\033[0m"


def main():
    host = sys.argv[1] if len(sys.argv) > 1 else "127.0.0.1"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 5020

    client = ModbusTcpClient(host=host, port=port, timeout=2)
    if not client.connect():
        print(f"No se pudo conectar a {host}:{port}.")
        return

    print("Escaneo ciclico (SCADA). Ctrl+C para salir.\n")
    try:
        while True:
            coils = client.read_coils(1, 4)
            regs = client.read_holding_registers(1, 3)
            piezas = client.read_input_registers(1, 1)
            if coils.isError() or regs.isError() or piezas.isError():
                print("Error de lectura...")
            else:
                m1, m2, alarma, prin = coils.bits[0:4]
                vel1, vel2, temp = regs.registers[0:3]
                line = (f"M1={green('ON') if m1 else 'OFF'} "
                        f"M2={green('ON') if m2 else 'OFF'} "
                        f"ALARMA={green('SI') if alarma else 'no'} "
                        f"vel={vel1}/{vel2} rpm temp={temp}C piezas={piezas.registers[0]}")
                print(line.ljust(70), end="\r", flush=True)
            time.sleep(2)
    except KeyboardInterrupt:
        print("\nEscaneo detenido.")
    finally:
        client.close()


if __name__ == "__main__":
    main()