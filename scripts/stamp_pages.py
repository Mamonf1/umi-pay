#!/usr/bin/env python3
"""Stamp page numbers on UMI PAY plan PDF (skip cover & ending) + set metadata.
Scheme (pagination.md): cover = hidden page 1; body pages numbered 1..N; ending dark page left clean."""
import io
import fitz
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

SRC = '/home/z/my-project/download/UMI_PAY_Development_Plan_raw.pdf'
OUT = '/home/z/my-project/download/UMI_PAY_Development_Plan_final.pdf'

doc = fitz.open(SRC)
n = len(doc)
pw, ph = doc[0].rect.width, doc[0].rect.height
print(f"pages={n} size={pw:.1f}x{ph:.1f}pt")

buf = io.BytesIO()
c = canvas.Canvas(buf, pagesize=(pw, ph))
for i in range(n):
    # skip cover (0) and ending (last); body pages get 1..N
    if 0 < i < n - 1:
        c.setFont('Helvetica', 9)
        c.setFillColor(HexColor('#767079'))
        c.drawCentredString(pw / 2, 22, str(i))
    c.showPage()
c.save()
buf.seek(0)

overlay = fitz.open(stream=buf.read(), filetype='pdf')
for i in range(n):
    if 0 < i < n - 1:
        page = doc[i]
        page.show_pdf_page(page.rect, overlay, i)

doc.set_metadata({
    'title': 'خطة تطوير تطبيق أومي باي UMI PAY — من نموذج أولي إلى منتج قابل للتمويل',
    'author': 'Z.ai',
    'subject': 'خطة تطوير منتج: محفظة أومي باي الرقمية — Flutter، تصميم UX عربي، خارطة طريق 24 أسبوعاً وتقديرات مالية',
    'creator': 'Z.ai PDF Workbench',
    'producer': 'Playwright + Chromium',
    'keywords': 'UMI PAY, أومي باي, محفظة إلكترونية, خطة تطوير, Flutter, fintech',
})
doc.save(OUT, garbage=3, deflate=True)
print("saved:", OUT)
