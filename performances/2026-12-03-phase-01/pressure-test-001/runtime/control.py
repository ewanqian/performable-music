"""Independent local OSC control: bypasses browser and conductor process.
Not an independent physical hardware mute. Keep that acceptance gate NOT RUN.
"""
import socket,struct,sys

def string(s):
 b=s.encode()+b'\0';return b+b'\0'*((-len(b))%4)
command=sys.argv[1] if len(sys.argv)>1 else 'kill'
assert command in ['arm','kill','quit','stop_record']
s=socket.socket(socket.AF_INET,socket.SOCK_DGRAM)
s.sendto(string('/critical/'+command)+string(',s')+string('local-terminal'),('127.0.0.1',57131));s.close()
print('Local OSC sent:',command)
