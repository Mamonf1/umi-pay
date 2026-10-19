#!/usr/bin/env python3
"""تحديث بيانات حساب الأدمن الإداري وفق تعليمات الإدارة:
   الهاتف: 963969748865 (الصيغة الدولية) — كلمة المرور: M2737@
"""
import sqlite3

DB = "/home/z/my-project/db/custom.db"
con = sqlite3.connect(DB)
cur = con.cursor()

# قبل التحديث
before = cur.execute(
    'SELECT id, phone, name, pass, role FROM "User" WHERE phone IN (?, ?)',
    ("0969748865", "963969748865"),
).fetchall()
print("قبل:", before)

cur.execute(
    'UPDATE "User" SET phone = ?, pass = ? WHERE phone = ? AND role = ?',
    ("963969748865", "M2737@", "0969748865", "admin"),
)
con.commit()

# بعد التحديث
after = cur.execute(
    'SELECT phone, name, pass, role FROM "User" ORDER BY role'
).fetchall()
print("بعد:", after)

# فحص تعارض الرقم مع مستخدم آخر
clash = cur.execute('SELECT COUNT(*) FROM "User" WHERE phone = ?', ("963969748865",)).fetchone()[0]
print("عدد الحسابات بالرقم الجديد (يجب أن يكون 1):", clash)

con.close()
print("OK - تم تحديث حساب الأدمن")
