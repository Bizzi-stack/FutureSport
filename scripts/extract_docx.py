import zipfile, xml.etree.ElementTree as ET, json, re, sys

def extract_docx_text(path):
    with zipfile.ZipFile(path) as doc:
        xml = doc.read('word/document.xml')
    root = ET.fromstring(xml)
    NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    lines = []
    for p in root.findall('.//w:p', NS):
        parts = []
        for t in p.findall('.//w:t', NS):
            if t.text:
                parts.append(t.text)
        if parts:
            lines.append(''.join(parts))
    return '\n'.join(lines)

if __name__ == '__main__':
    path = r'C:/Users/noahb/Downloads/TPMC3 - M9 (1).docx'
    text = extract_docx_text(path)
    print(text)
