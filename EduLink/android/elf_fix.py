#!/usr/bin/env python3
"""Fix ELF segment alignment for 16 KB page size."""
import struct, sys, os, glob

def fix_elf_alignment(filepath):
    try:
        with open(filepath, 'r+b') as f:
            magic = f.read(4)
            if magic != b'\x7fELF': return False
            ei_class = f.read(1)[0]
            if ei_class != 2: return False  # ELF64 only
            f.seek(32); phoff = struct.unpack('<Q', f.read(8))[0]
            f.seek(54); phentsize = struct.unpack('<H', f.read(2))[0]
            f.seek(56); phnum = struct.unpack('<H', f.read(2))[0]
            changed = False
            for i in range(phnum):
                f.seek(phoff + i * phentsize)
                p_type = struct.unpack('<I', f.read(4))[0]
                f.read(4)  # p_flags
                f.read(8); f.read(8); f.read(8); f.read(8); f.read(8)
                p_align = struct.unpack('<Q', f.read(8))[0]
                if p_align < 0x4000 and p_align > 0 and p_type == 1:
                    f.seek(phoff + i * phentsize + 4 + 4 + 8 + 8 + 8 + 8 + 8)
                    f.write(struct.pack('<Q', 0x4000))
                    changed = True
            return changed
    except: return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print('Usage: elf_fix.py <file_or_dir>')
        sys.exit(1)
    count = 0
    for path in sys.argv[1:]:
        if os.path.isdir(path):
            for so in glob.glob(f'{path}/**/*.so', recursive=True):
                if fix_elf_alignment(so): print(f'  ✓ {os.path.basename(so)}'); count += 1
        elif path.endswith('.so'):
            if fix_elf_alignment(path): print(f'  ✓ {os.path.basename(path)}'); count += 1
    print(f'Patched {count} files')
